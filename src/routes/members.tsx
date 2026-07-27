// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useState } from "react";
// import { toast } from "sonner";
// import { supabase } from "@/integrations/supabase/client";
// import type { Member, Pass } from "@/lib/types";
// import { Search, UserPlus } from "lucide-react";

// export const Route = createFileRoute("/members")({
//   head: () => ({ meta: [{ title: "Members | Fitnfreakk Funzone" }] }),
//   component: MembersPage,
// });

// function MembersPage() {
//   const qc = useQueryClient();
//   const [showForm, setShowForm] = useState(false);
//   const [search, setSearch] = useState("");
//   const [form, setForm] = useState({ full_name: "", age: "", mobile: "", member_id: "" });

//   const { data: members } = useQuery({
//     queryKey: ["members"],
//     queryFn: async (): Promise<Member[]> => {
//       const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
//       if (error) throw error;
//       return data || [];
//     },
//   });

//   const { data: passes } = useQuery({
//     queryKey: ["passes-all"],
//     queryFn: async (): Promise<Pass[]> => {
//       const { data, error } = await supabase.from("passes").select("*");
//       if (error) throw error;
//       return data || [];
//     },
//   });

//   const addMember = useMutation({
//     mutationFn: async () => {
//       if (!form.full_name.trim() || !form.mobile.trim() || !form.member_id.trim() || !form.age) {
//         throw new Error("Please fill all fields");
//       }
//       const age = parseInt(form.age);
//       if (isNaN(age) || age < 1 || age > 120) throw new Error("Invalid age");
//       const { error } = await supabase.from("members").insert({
//         full_name: form.full_name.trim(),
//         age,
//         mobile: form.mobile.trim(),
//         member_id: form.member_id.trim(),
//       });
//       if (error) throw error;
//     },
//     onSuccess: () => {
//       toast.success("Member added");
//       setForm({ full_name: "", age: "", mobile: "", member_id: "" });
//       setShowForm(false);
//       qc.invalidateQueries({ queryKey: ["members"] });
//       qc.invalidateQueries({ queryKey: ["stats"] });
//     },
//     onError: (e: Error) => toast.error(e.message),
//   });

//   const activeMap = new Map<string, boolean>();
//   (passes || []).forEach((p) => {
//     if (new Date(p.expires_at) > new Date() && p.remaining_passes > 0) activeMap.set(p.member_id, true);
//   });

//   const filtered = (members || []).filter((m) => {
//     const q = search.toLowerCase();
//     return !q || m.full_name.toLowerCase().includes(q) || m.member_id.toLowerCase().includes(q) || m.mobile.includes(q);
//   });

//   return (
//     <div className="space-y-5">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <h1 className="text-3xl font-bold">Members</h1>
//           <p className="text-muted-foreground text-sm">{members?.length ?? 0} total</p>
//         </div>
//         <button
//           onClick={() => setShowForm((s) => !s)}
//           className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm"
//         >
//           <UserPlus className="w-4 h-4" />
//           Add Member
//         </button>
//       </div>

//       {showForm && (
//         <div className="card-surface p-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//             <Input placeholder="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
//             <Input placeholder="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
//             <Input placeholder="Mobile no." value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
//             <Input placeholder="Member ID" value={form.member_id} onChange={(v) => setForm({ ...form, member_id: v })} />
//           </div>
//           <div className="mt-3 flex justify-end gap-2">
//             <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm rounded-md bg-secondary">
//               Cancel
//             </button>
//             <button
//               disabled={addMember.isPending}
//               onClick={() => addMember.mutate()}
//               className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-60"
//             >
//               {addMember.isPending ? "Saving…" : "Save Member"}
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search by name, member ID or mobile"
//           className="w-full pl-9 pr-3 py-2 rounded-md bg-input border border-border text-sm"
//         />
//       </div>

//       <div className="grid gap-2">
//         {filtered.map((m) => {
//           const active = activeMap.get(m.id);
//           return (
//             <Link
//               key={m.id}
//               to="/members/$id"
//               params={{ id: m.id }}
//               className="card-surface p-3 flex items-center justify-between hover:border-primary/50 transition-colors"
//             >
//               <div className="min-w-0">
//                 <div className="font-semibold truncate">{m.full_name}</div>
//                 <div className="text-xs text-muted-foreground">
//                   {m.member_id} · {m.mobile} · Age {m.age}
//                 </div>
//               </div>
//               <span
//                 className={`text-xs px-2 py-1 rounded-full font-semibold ${
//                   active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
//                 }`}
//               >
//                 {active ? "ACTIVE" : "INACTIVE"}
//               </span>
//             </Link>
//           );
//         })}
//         {filtered.length === 0 && (
//           <div className="text-center text-muted-foreground text-sm py-10">No members yet</div>
//         )}
//       </div>
//     </div>
//   );
// }

// function Input({
//   placeholder,
//   value,
//   onChange,
//   type = "text",
// }: {
//   placeholder: string;
//   value: string;
//   onChange: (v: string) => void;
//   type?: string;
// }) {
//   return (
//     <input
//       type={type}
//       placeholder={placeholder}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       className="px-3 py-2 rounded-md bg-input border border-border text-sm w-full"
//     />
//   );
// }
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Member, Pass } from "@/lib/types";
import { Search, UserPlus } from "lucide-react";

export const Route = createFileRoute("/members")({
  head: () => ({ meta: [{ title: "Members | Fitnfreakk Funzone" }] }),
  component: MembersPage,
});

function MembersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ full_name: "", age: "", mobile: "", member_id: "" });

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
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

  // Safe Activation Mutation
  const quickActivate = useMutation({
    mutationFn: async (memberId: string) => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("passes").insert({
        member_id: memberId,
        kind: "plan",
        plan_name: "Active Pass",
        total_passes: 10,
        remaining_passes: 10,
        expires_at: expiresAt,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member activated successfully!");
      qc.invalidateQueries({ queryKey: ["passes-all"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to activate member"),
  });

  const addMember = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim() || !form.mobile.trim() || !form.member_id.trim() || !form.age) {
        throw new Error("Please fill all required fields");
      }
      const age = parseInt(form.age);
      if (isNaN(age) || age < 1 || age > 120) throw new Error("Enter a valid age");

      const { error } = await supabase.from("members").insert({
        full_name: form.full_name.trim(),
        age,
        mobile: form.mobile.trim(),
        member_id: form.member_id.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added!");
      setForm({ full_name: "", age: "", mobile: "", member_id: "" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add member"),
  });

  const activeMap = new Map<string, boolean>();
  (passes || []).forEach((p) => {
    if (new Date(p.expires_at) > new Date() && p.remaining_passes > 0) {
      activeMap.set(p.member_id, true);
    }
  });

  const filtered = (members || []).filter((m) => {
    const q = search.toLowerCase();
    return (
      !q ||
      m.full_name.toLowerCase().includes(q) ||
      m.member_id.toLowerCase().includes(q) ||
      m.mobile.includes(q)
    );
  });

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground text-sm">{members?.length ?? 0} total registered</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? "Close Form" : "Add Member"}
        </button>
      </div>

      {showForm && (
        <div className="card-surface p-4 border rounded-lg space-y-3 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
            <Input placeholder="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
            <Input placeholder="Mobile no." value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
            <Input placeholder="Member ID" value={form.member_id} onChange={(v) => setForm({ ...form, member_id: v })} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm rounded-md bg-secondary">
              Cancel
            </button>
            <button
              disabled={addMember.isPending}
              onClick={() => addMember.mutate()}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              {addMember.isPending ? "Saving..." : "Save Member"}
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, member ID or mobile"
          className="w-full pl-9 pr-3 py-2 rounded-md bg-input border border-border text-sm"
        />
      </div>

      {loadingMembers ? (
        <div className="text-center text-muted-foreground py-10">Loading members...</div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((m) => {
            const active = activeMap.get(m.id);
            return (
              <Link
                key={m.id}
                to="/members/$id"
                params={{ id: m.id }}
                className="card-surface p-3 flex items-center justify-between border rounded-md hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate uppercase">{m.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.member_id} · {m.mobile} · Age {m.age}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {active ? "ACTIVE" : "INACTIVE"}
                  </span>

                  {!active && (
                    <button
                      disabled={quickActivate.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        quickActivate.mutate(m.id);
                      }}
                      className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                    >
                      {quickActivate.isPending ? "..." : "Activate"}
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-10">No members found</div>
          )}
        </div>
      )}
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-md bg-input border border-border text-sm w-full"
    />
  );
}
