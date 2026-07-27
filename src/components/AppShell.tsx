import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Users, LayoutDashboard, CalendarCheck, Gamepad2, ScrollText, Dumbbell, History, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/members", label: "Members", icon: Users },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/plans", label: "Plans", icon: ScrollText },
  { to: "/history", label: "History", icon: History },
] as const;

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <div className="w-9 h-9 rounded-xl gradient-brand grid place-items-center text-primary-foreground shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fitnfreakk</div>
            <div className="font-bold -mt-0.5 text-gradient-brand text-base">Funzone</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                      <Link to={n.to}>
                        <n.icon />
                        <span>{n.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border h-12 flex items-center gap-2 px-3">
            <SidebarTrigger />
            <div className="text-sm font-semibold text-muted-foreground">Fitnfreakk Funzone</div>
          </header>
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
