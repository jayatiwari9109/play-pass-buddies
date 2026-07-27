import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SLOT_HOURS, formatSlot } from "@/lib/plans";
import { Users, Ticket, CalendarCheck, Gamepad2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Dashboard | Fitnfreakk Funzone" }],
  }),
  component: Dashboard,
});

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Dashboard() {
  const [date, setDate] = useState(todayStr());

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [members, games, passes, bookingsToday] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("games").select("id", { count: "exact", head: true }),
        supabase.from("passes").select("id, expires_at, remaining_passes"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("slot_date", todayStr()),
      ]);
      const activePasses = (passes.data || []).filter(
        (p) => new Date(p.expires_at) > new Date() && p.remaining_passes > 0,
      ).length;
      return {
        members: members.count ?? 0,
        games: games.count ?? 0,
        activePasses,
        bookingsToday: bookingsToday.count ?? 0,
      };
    },
  });

  const { data: schedule } = useQuery({
    queryKey: ["schedule", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, slot_hour, game:games(id,name,max_players), member:members(id,full_name,member_id)")
        .eq("slot_date", date)
        .order("slot_hour");
      if (error) throw error;
      return data || [];
    },
  });

  const grouped = SLOT_HOURS.map((h) => ({
    hour: h,
    items: (schedule || []).filter((b: any) => b.slot_hour === h),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Slot-wise gym members playing games</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-input text-foreground rounded-md px-3 py-2 border border-border"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Members" value={stats?.members ?? "…"} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Active Passes" value={stats?.activePasses ?? "…"} icon={<Ticket className="w-5 h-5" />} />
        <StatCard label="Games" value={stats?.games ?? "…"} icon={<Gamepad2 className="w-5 h-5" />} />
        <StatCard label="Today's Bookings" value={stats?.bookingsToday ?? "…"} icon={<CalendarCheck className="w-5 h-5" />} />
      </div>

      <div className="card-surface p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Slot Schedule</h2>
          <Link
            to="/bookings"
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold"
          >
            + Add Booking
          </Link>
        </div>
        <div className="grid gap-3">
          {grouped.map((g) => (
            <div key={g.hour} className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/40 px-3 py-2 flex items-center justify-between">
                <div className="font-semibold text-sm">{formatSlot(g.hour)}</div>
                <div className="text-xs text-muted-foreground">{g.items.length} playing</div>
              </div>
              {g.items.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">— empty —</div>
              ) : (
                <div className="divide-y divide-border">
                  {g.items.map((b: any) => (
                    <div key={b.id} className="px-3 py-2 flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{b.member?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{b.member?.member_id}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold">
                        {b.game?.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="card-surface p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg gradient-brand grid place-items-center text-primary-foreground">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
