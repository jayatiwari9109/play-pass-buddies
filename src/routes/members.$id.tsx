import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Member, Pass, Booking } from "@/lib/types";
import { isPassActive } from "@/lib/types";
import { formatSlot, type PlanRow } from "@/lib/plans";
import { ArrowLeft, Plus } from "lucide-react";

export const Route = createFileRoute("/members/$id")({
  head: () => ({ meta: [{ title: "Member | Fitnfreakk Funzone" }] }),
  component: MemberDetail,
});

function MemberDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [showActivate, setShowActivate] = useState<null | "plan" | "topup">(null);

  const { data: member } = useQuery({
    queryKey: ["member", id],
    queryFn: async (): Promise<Member | null> => {
      const { data, error } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: passes } = useQuery({
    queryKey: ["passes", id],
    queryFn: async (): Promise<Pass[]> => {
      const { data, error } = await supabase
        .from("passes")
        .select("*")
        .eq("member_id", id)
        .order("activated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["bookings-member", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, slot_date, slot_hour, game:games(name)")
        .eq("member_id", id)
        .order("slot_date", { ascending: false })
        .order("slot_hour", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allPlans } = useQuery({
    queryKey: ["plans-all"],
    queryFn: async (): Promise<PlanRow[]> => {
      const { data, error } = await supabase.from("plans").select("*").eq("is_active", true).order("kind").order("plan_number");
      if (error) throw error;
      return (data || []) as PlanRow[];
    },
  });

  const activatePass = useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const plan = (allPlans || []).find((p) => p.id === planId);
      if (!plan) throw new Error("Invalid plan");
      const activated = new Date();
      const expires = new Date(activated.getTime() + plan.validity_days * 86400000);
      const { error } = await supabase.from("passes").insert({
        member_id: id,
        kind: plan.kind,
        plan_number: plan.plan_number,
        total_passes: plan.passes,
        remaining_passes: plan.passes,
        validity_days: plan.validity_days,
        activated_at: activated.toISOString(),
        expires_at: expires.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pass activated");
      setShowActivate(null);
      qc.invalidateQueries({ queryKey: ["passes", id] });
      qc.invalidateQueries({ queryKey: ["passes-all"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = (passes || []).filter(isPassActive);
  const totalRemaining = active.reduce((s, p) => s + p.remaining_passes, 0);
  const nearestExpiry = active
    .map((p) => new Date(p.expires_at).getTime())
    .sort((a, b) => a - b)[0];

  if (!member) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/members" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to members
      </Link>

      <div className="card-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{member.full_name}</h1>
            <p className="text-muted-foreground text-sm">
              ID: {member.member_id} · {member.mobile} · Age {member.age}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-bold ${
              active.length > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
            }`}
          >
            {active.length > 0 ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Passes Remaining" value={totalRemaining} />
          <Stat
            label="Next Expiry"
            value={nearestExpiry ? new Date(nearestExpiry).toLocaleDateString() : "—"}
          />
          <Stat label="Total Bookings" value={bookings?.length ?? 0} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowActivate("plan")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Activate Plan
          </button>
          <button
            onClick={() => setShowActivate("topup")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Topup
          </button>
        </div>
      </div>

      {showActivate && (
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              {showActivate === "plan" ? "Choose Plan" : "Choose Topup"}
            </h2>
            <button onClick={() => setShowActivate(null)} className="text-xs text-muted-foreground">
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(allPlans || []).filter((p) => p.kind === showActivate).map((p) => (
              <button
                key={p.id}
                disabled={activatePass.isPending}
                onClick={() => activatePass.mutate({ planId: p.id })}
                className="border border-border rounded-lg p-3 text-left hover:border-primary transition-colors disabled:opacity-50"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {showActivate === "plan" ? "Plan" : "TopUp"} {p.plan_number}
                </div>
                {p.label && <div className="text-xs text-muted-foreground">{p.label}</div>}
                <div className="text-lg font-bold">{p.passes} passes</div>
                <div className="text-xs text-muted-foreground">{p.validity_days} days validity</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card-surface p-4">
        <h2 className="font-semibold mb-3">Pass History</h2>
        {(passes || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No passes yet. Activate one above.</p>
        ) : (
          <div className="grid gap-2">
            {passes!.map((p) => {
              const isActive = isPassActive(p);
              return (
                <div key={p.id} className="border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">
                      {p.kind === "plan" ? "Plan" : "TopUp"} {p.plan_number} · {p.total_passes} passes
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.activated_at).toLocaleDateString()} →{" "}
                      {new Date(p.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                      {p.remaining_passes}/{p.total_passes} left
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        isActive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "EXPIRED"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-surface p-4">
        <h2 className="font-semibold mb-3">Games History</h2>
        {(bookings || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="grid gap-1.5">
            {bookings!.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <div>
                  <span className="font-medium">{b.game?.name}</span>
                  <span className="text-muted-foreground text-xs ml-2">{formatSlot(b.slot_hour)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{b.slot_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
