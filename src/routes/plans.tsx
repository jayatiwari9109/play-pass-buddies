import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PlanRow } from "@/lib/plans";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Plans | Fitnfreakk Funzone" }] }),
  component: PlansPage,
});

function PlansPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"plan" | "topup">("plan");
  const [form, setForm] = useState({ plan_number: "", label: "", passes: "", validity_days: "" });
  const [editing, setEditing] = useState<Record<string, { passes: string; validity_days: string; label: string; plan_number: string }>>({});

  const { data: plans } = useQuery({
    queryKey: ["plans-all"],
    queryFn: async (): Promise<PlanRow[]> => {
      const { data, error } = await supabase.from("plans").select("*").order("kind").order("plan_number");
      if (error) throw error;
      return (data || []) as PlanRow[];
    },
  });

  const list = (plans || []).filter((p) => p.kind === tab);

  const addPlan = useMutation({
    mutationFn: async () => {
      const num = parseInt(form.plan_number);
      const passes = parseInt(form.passes);
      const validity = parseInt(form.validity_days);
      if (isNaN(num) || isNaN(passes) || isNaN(validity)) throw new Error("All numbers required");
      const { error } = await supabase.from("plans").insert({
        kind: tab,
        plan_number: num,
        label: form.label.trim() || null,
        passes,
        validity_days: validity,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added");
      setForm({ plan_number: "", label: "", passes: "", validity_days: "" });
      qc.invalidateQueries({ queryKey: ["plans-all"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PlanRow> }) => {
      const { error } = await supabase.from("plans").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["plans-all"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["plans-all"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (p: PlanRow) => {
    setEditing((s) => ({
      ...s,
      [p.id]: {
        passes: String(p.passes),
        validity_days: String(p.validity_days),
        label: p.label || "",
        plan_number: String(p.plan_number),
      },
    }));
  };
  const cancelEdit = (id: string) => setEditing((s) => { const n = { ...s }; delete n[id]; return n; });
  const saveEdit = (id: string) => {
    const e = editing[id];
    if (!e) return;
    const passes = parseInt(e.passes);
    const validity = parseInt(e.validity_days);
    const num = parseInt(e.plan_number);
    if (isNaN(passes) || isNaN(validity) || isNaN(num)) {
      toast.error("Invalid numbers");
      return;
    }
    updatePlan.mutate(
      { id, patch: { passes, validity_days: validity, plan_number: num, label: e.label.trim() || null } },
      { onSuccess: () => cancelEdit(id) },
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Pass Plans</h1>
        <p className="text-muted-foreground text-sm">Add, edit, or remove plans and topups.</p>
      </div>

      <div className="flex gap-2">
        {(["plan", "topup"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${
              tab === k ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}
          >
            {k === "plan" ? "Plans" : "Topups"}
          </button>
        ))}
      </div>

      <div className="card-surface p-4">
        <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
          Add new {tab === "plan" ? "Plan" : "Topup"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input
            placeholder="No."
            value={form.plan_number}
            type="number"
            onChange={(e) => setForm({ ...form, plan_number: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Label (optional)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm md:col-span-2"
          />
          <input
            placeholder="Passes"
            value={form.passes}
            type="number"
            onChange={(e) => setForm({ ...form, passes: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Validity (days)"
            value={form.validity_days}
            type="number"
            onChange={(e) => setForm({ ...form, validity_days: e.target.value })}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => addPlan.mutate()}
            disabled={addPlan.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="card-surface p-4">
        <h2 className="font-semibold mb-3">{tab === "plan" ? "Plans" : "Topups"} ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          <div className="grid gap-2">
            {list.map((p) => {
              const isEdit = editing[p.id];
              return (
                <div key={p.id} className="border border-border rounded-lg p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                  {isEdit ? (
                    <>
                      <input
                        value={isEdit.plan_number}
                        onChange={(e) => setEditing((s) => ({ ...s, [p.id]: { ...s[p.id], plan_number: e.target.value } }))}
                        className="bg-input border border-border rounded px-2 py-1 text-sm"
                        placeholder="No."
                      />
                      <input
                        value={isEdit.label}
                        onChange={(e) => setEditing((s) => ({ ...s, [p.id]: { ...s[p.id], label: e.target.value } }))}
                        className="bg-input border border-border rounded px-2 py-1 text-sm md:col-span-2"
                        placeholder="Label"
                      />
                      <input
                        value={isEdit.passes}
                        onChange={(e) => setEditing((s) => ({ ...s, [p.id]: { ...s[p.id], passes: e.target.value } }))}
                        className="bg-input border border-border rounded px-2 py-1 text-sm"
                        placeholder="Passes"
                      />
                      <input
                        value={isEdit.validity_days}
                        onChange={(e) => setEditing((s) => ({ ...s, [p.id]: { ...s[p.id], validity_days: e.target.value } }))}
                        className="bg-input border border-border rounded px-2 py-1 text-sm"
                        placeholder="Days"
                      />
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => saveEdit(p.id)} className="p-2 rounded bg-primary text-primary-foreground"><Check className="w-4 h-4" /></button>
                        <button onClick={() => cancelEdit(p.id)} className="p-2 rounded bg-secondary"><X className="w-4 h-4" /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        {tab === "plan" ? "Plan" : "TopUp"} {p.plan_number}
                      </div>
                      <div className="md:col-span-2 text-sm">{p.label || <span className="text-muted-foreground">—</span>}</div>
                      <div className="text-sm font-semibold">{p.passes} passes</div>
                      <div className="text-sm text-muted-foreground">{p.validity_days} days</div>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => startEdit(p)} className="p-2 rounded bg-secondary hover:bg-secondary/70"><Pencil className="w-4 h-4" /></button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this?")) deletePlan.mutate(p.id);
                          }}
                          className="p-2 rounded bg-destructive/20 text-destructive hover:bg-destructive/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
