import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "in" | "out";

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState(session ? "in" : "out");
    });
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state === "loading") return;
    if (state === "out" && pathname !== "/auth") {
      navigate({ to: "/auth", replace: true });
    } else if (state === "in" && pathname === "/auth") {
      navigate({ to: "/", replace: true });
    }
  }, [state, pathname, navigate]);

  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  // Render children regardless — auth page handles /auth, shell handles rest.
  // But when signed out on non-auth route, avoid flashing protected UI.
  if (state === "out" && pathname !== "/auth") return null;
  if (state === "in" && pathname === "/auth") return null;

  return <>{children}</>;
}
