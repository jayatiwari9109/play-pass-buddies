import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Game } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [{ title: "Games | Fitnfreakk Funzone" }] }),
  component: GamesPage,
});

function GamesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", max_players: "" });

  const { data: games } = useQuery({
    queryKey: ["games"],
    queryFn: async (): Promise<Game[]> => {
      const { data, error } = await supabase.from("games").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const addGame = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.max_players) throw new Error("Fill all fields");
      const mp = parseInt(form.max_players);
      if (isNaN(mp) || mp < 1) throw new Error("Invalid player count");
      const { error } = await supabase.from("games").insert({ name: form.name.trim(), max_players: mp });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Game added");
      setForm({ name: "", max_players: "" });
      qc.invalidateQueries({ queryKey: ["games"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeGame = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Game removed");
      qc.invalidateQueries({ queryKey: ["games"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Games</h1>
        <p className="text-muted-foreground text-sm">Manage available games and player capacity</p>
      </div>

      <div className="card-surface p-4">
        <h2 className="font-semibold mb-3">Add New Game</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            placeholder="Game name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-md bg-input border border-border text-sm md:col-span-2"
          />
          <input
            placeholder="Max players"
            type="number"
            value={form.max_players}
            onChange={(e) => setForm({ ...form, max_players: e.target.value })}
            className="px-3 py-2 rounded-md bg-input border border-border text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            disabled={addGame.isPending}
            onClick={() => addGame.mutate()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Add Game
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        {(games || []).map((g) => (
          <div key={g.id} className="card-surface p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{g.name}</div>
              <div className="text-xs text-muted-foreground">Max {g.max_players} players per slot</div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Delete ${g.name}? All its bookings will be removed too.`)) removeGame.mutate(g.id);
              }}
              className="text-destructive hover:text-destructive/80 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
