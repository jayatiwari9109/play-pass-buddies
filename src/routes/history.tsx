import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatSlot } from "@/lib/plans";
import { CalendarCheck, Ticket } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History | Fitnfreakk Funzone" },
      { name: "description", content: "Complete history of member bookings and pass activations." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [tab, setTab] = useState<"bookings" | "passes">("bookings");
  const [search, setSearch] = useState("");

  const { data: bookings } = useQuery({
    queryKey: ["history-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, slot_date, slot_hour, member:members(id,full_name,member_id), game:games(name)")
        .order("slot_date", { ascending: false })
        .order("slot_hour", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: passes } = useQuery({
    queryKey: ["history-passes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("passes")
        .select("id, kind, plan_number, total_passes, remaining_passes, activated_at, expires_at, member:members(id,full_name,member_id)")
        .order("activated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const q = search.trim().toLowerCase();
  const filteredBookings = (bookings || []).filter((b: any) => {
    if (!q) return true;
    return b.member?.full_name?.toLowerCase().includes(q) || b.member?.member_id?.toLowerCase().includes(q) || b.game?.name?.toLowerCase().includes(q);
  });
  const filteredPasses = (passes || []).filter((p: any) => {
    if (!q) return true;
    return p.member?.full_name?.toLowerCase().includes(q) || p.member?.member_id?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground text-sm">All bookings and pass activations across members.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("bookings")}
            className={`px-4 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 ${tab === "bookings" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            <CalendarCheck className="w-4 h-4" /> Bookings
          </button>
          <button
            onClick={() => setTab("passes")}
            className={`px-4 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 ${tab === "passes" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            <Ticket className="w-4 h-4" /> Passes
          </button>
        </div>
        <input
          placeholder="Search member or game…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm w-full sm:w-64"
        />
      </div>

      <div className="card-surface p-4">
        {tab === "bookings" ? (
          filteredBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings.</p>
          ) : (
            <div className="grid gap-1.5">
              {filteredBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0 gap-2">
                  <div className="min-w-0">
                    <Link
                      to="/members/$id"
                      params={{ id: b.member?.id }}
                      className="font-medium hover:text-primary truncate block"
                    >
                      {b.member?.full_name} <span className="text-xs text-muted-foreground">({b.member?.member_id})</span>
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {b.game?.name} · {formatSlot(b.slot_hour)}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{b.slot_date}</span>
                </div>
              ))}
            </div>
          )
        ) : filteredPasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No passes.</p>
        ) : (
          <div className="grid gap-1.5">
            {filteredPasses.map((p: any) => {
              const isActive = new Date(p.expires_at) > new Date() && p.remaining_passes > 0;
              return (
                <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0 gap-2">
                  <div className="min-w-0">
                    <Link
                      to="/members/$id"
                      params={{ id: p.member?.id }}
                      className="font-medium hover:text-primary truncate block"
                    >
                      {p.member?.full_name} <span className="text-xs text-muted-foreground">({p.member?.member_id})</span>
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {p.kind === "plan" ? "Plan" : "TopUp"} {p.plan_number} · {p.remaining_passes}/{p.total_passes} left · expires {new Date(p.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold shrink-0 ${isActive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                    {isActive ? "ACTIVE" : "EXPIRED"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
