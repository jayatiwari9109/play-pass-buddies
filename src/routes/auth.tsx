import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Mail, Lock } from "lucide-react";
import heroImg from "@/assets/funzone-hero.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Fitnfreakk Funzone" },
      { name: "description", content: "Sign in to manage members, passes, and slot bookings at Fitnfreakk Funzone." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Hero */}
      <div className="relative hidden lg:block">
        <img
          src={heroImg}
          alt="Fitnfreakk Funzone game arena"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-brand grid place-items-center text-primary-foreground">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Fitnfreakk</div>
              <div className="text-2xl font-bold text-gradient-brand -mt-0.5">Funzone</div>
            </div>
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Games. Passes. <span className="text-gradient-brand">Slots.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pool · Table Tennis · Air Hockey · Carrom · Dart — all your members and bookings in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md card-surface p-6 md:p-8">
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl gradient-brand grid place-items-center text-primary-foreground">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Fitnfreakk</div>
              <div className="text-xl font-bold text-gradient-brand -mt-0.5">Funzone</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Sign in to manage your funzone." : "Register to get started."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input border border-border rounded-md pl-9 pr-3 py-2.5 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Password</span>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input border border-border rounded-md pl-9 pr-3 py-2.5 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </label>

            <button
              disabled={busy}
              type="submit"
              className="w-full mt-2 py-2.5 rounded-md gradient-brand text-primary-foreground font-bold disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-semibold text-primary hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
