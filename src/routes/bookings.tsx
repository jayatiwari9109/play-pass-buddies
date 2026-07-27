import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Game, Member, Pass } from "@/lib/types";
import { isPassActive } from "@/lib/types";
import { SLOT_HOURS, formatSlot } from "@/lib/plans";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Bookings | Fitnfreakk Funzone" }] }),
  component: BookingsPage,
});

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function BookingsPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [addFor, setAddFor] = useState<{ hour: number; game_id: string } | null>(null);

  const { data: games } = useQuery({
    queryKey: ["games"],
    queryFn: async (): Promise<Game[]> => {
      const { data, error } = await supabase.from("games").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.from("members").select("*").order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: passes } = useQuery({
    queryKey: ["passes-all"],
    queryFn: async (): Promise<Pass[]> => {
      const { data, error } = await supabase.from("passes").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["bookings", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, slot_hour, game_id, member_id, pass_id, member:members(id,full_name,member_id), game:games(id,name,max_players)")
        .eq("slot_date", date);
      if (error) throw error;
      return data || [];
    },
  });

  const addBooking = useMutation({
    mutationFn: async ({ member_id, game_id, hour }: { member_id: string; game_id: string; hour: number }) => {
      // find active pass for member
      const memberPasses = (passes || []).filter((p) => p.member_id === member_id && isPassActive(p));
      if (memberPasses.length === 0) throw new Error("Member has no active pass. Please activate/topup first.");
      // pick nearest expiring active pass
      const pass = memberPasses.sort(
        (a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime(),
      )[0];

      // capacity check
      const game = games!.find((g) => g.id === game_id)!;
      const slotBookings = (bookings || []).filter((b) => b.slot_hour === hour && b.game_id === game_id);
      if (slotBookings.length >= game.max_players) throw new Error(`${game.name} is full for this slot`);

      // double-book check
      const memberSlot = (bookings || []).find((b) => b.slot_hour === hour && b.member_id === member_id);
      if (memberSlot) throw new Error("Member is already booked in another game for this slot");

      const { error: insertErr } = await supabase.from("bookings").insert({
        member_id,
        game_id,
        pass_id: pass.id,
        slot_date: date,
        slot_hour: hour,
      });
      if (insertErr) throw insertErr;

      const { error: updErr } = await supabase
        .from("passes")
        .update({ remaining_passes: pass.remaining_passes - 1 })
        .eq("id", pass.id);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      toast.success("Booking added");
      setAddFor(null);
      qc.invalidateQueries({ queryKey: ["bookings", date] });
      qc.invalidateQueries({ queryKey: ["passes-all"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["schedule", date] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBooking = useMutation({
    mutationFn: async (b: any) => {
      const { error } = await supabase.from("bookings").delete().eq("id", b.id);
      if (error) throw error;
      // refund pass
      if (b.pass_id) {
        const pass = (passes || []).find((p) => p.id === b.pass_id);
        if (pass) {
          await supabase
            .from("passes")
            .update({ remaining_passes: pass.remaining_passes + 1 })
            .eq("id", pass.id);
        }
      }
    },
    onSuccess: () => {
      toast.success("Booking removed");
      qc.invalidateQueries({ queryKey: ["bookings", date] });
      qc.invalidateQueries({ queryKey: ["passes-all"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["schedule", date] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground text-sm">Assign members to game slots (7 AM – 9 PM)</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-input text-foreground rounded-md px-3 py-2 border border-border"
        />
      </div>

      <div className="grid gap-3">
        {SLOT_HOURS.map((hour) => (
          <div key={hour} className="card-surface p-3 md:p-4">
            <div className="font-semibold mb-2">{formatSlot(hour)}</div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {(games || []).map((g) => {
                const list = (bookings || []).filter((b) => b.slot_hour === hour && b.game_id === g.id);
                const full = list.length >= g.max_players;
                return (
                  <div key={g.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{g.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {list.length}/{g.max_players} players
                        </div>
                      </div>
                      {!full && (
                        <button
                          onClick={() => setAddFor({ hour, game_id: g.id })}
                          className="p-1.5 rounded bg-primary text-primary-foreground"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {list.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between text-xs bg-secondary/40 rounded px-2 py-1">
                          <span className="truncate">{b.member?.full_name}</span>
                          <button
                            onClick={() => removeBooking.mutate(b)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {list.length === 0 && <div className="text-xs text-muted-foreground">— empty —</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {addFor && (
        <div
          className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4"
          onClick={() => setAddFor(null)}
        >
          <div
            className="card-surface p-4 max-w-md w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3">
              Add member — {games?.find((g) => g.id === addFor.game_id)?.name} @ {formatSlot(addFor.hour)}
            </h3>
            <div className="grid gap-1.5">
              {(members || []).map((m) => {
                const memberActive = (passes || []).some((p) => p.member_id === m.id && isPassActive(p));
                return (
                  <button
                    key={m.id}
                    disabled={!memberActive || addBooking.isPending}
                    onClick={() =>
                      addBooking.mutate({ member_id: m.id, game_id: addFor.game_id, hour: addFor.hour })
                    }
                    className="text-left border border-border rounded-md p-2 hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium">{m.full_name}</div>
                      <div className="text-xs text-muted-foreground">{m.member_id}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${memberActive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                      {memberActive ? "ACTIVE" : "NO PASS"}
                    </span>
                  </button>
                );
              })}
              {(members || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
