import { Home, Play, Settings, Folder, LayoutList, LayoutDashboard, FlaskConical, TestTube, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import * as React from "react";

const navItems = [
  { title: "Sample Tracker system", url: "/", icon: Home },
  { title: "Guided Workflow", url: "/guided-workflow", icon: Play },
  { title: "Instrument Management", url: "/instrument-bookings", icon: Folder },
  { title: "Workflow Manager", url: "/workflow-manager", icon: Settings },
  { title: "Sample Finder", url: "/sample-finder", icon: LayoutList },
  { title: "Analysis Scheduler", url: "/hplc-sequence-table", icon: LayoutDashboard },
  { title: "Solvent Management", url: "/solvent-management", icon: FlaskConical },
  { title: "Column Management", url: "/column-management", icon: TestTube },
  { title: "Activity Log", url: "/activity-log", icon: LayoutList },
  // Preparation Report entry has been removed for hiding.
];

export function AppSidebar() {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel
            className="text-2xl font-extrabold mb-4 tracking-tighter px-4 pt-5 pb-4 bg-primary/70 text-primary-foreground rounded-xl shadow-xl mx-2 mt-4 backdrop-blur-md"
            style={{
              letterSpacing: "-0.02em",
              boxShadow: "0 4px 24px 0 rgb(51 65 85 / 8%)",
            }}
          >
            Lab Tracker
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, idx) => (
                <SidebarMenuItem key={item.url} className="relative">
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className={`transition-all duration-200 group 
                      hover:bg-accent/40 hover:backdrop-blur 
                      hover:text-primary 
                      ${
                        location.pathname === item.url
                          ? "bg-accent/60 text-primary font-extrabold shadow-md scale-[1.03]"
                          : "bg-white/60 dark:bg-gray-900/60"
                      }
                      rounded-lg px-3 py-2 my-1 flex items-center gap-3 overflow-hidden
                      border border-transparent
                      active:scale-100 focus-visible:ring-2 focus-visible:ring-primary/60
                    `}
                  >
                    <Link
                      to={item.url}
                      className="flex items-center gap-3 w-full h-full"
                      style={{
                        minHeight: "2.5rem",
                      }}
                      tabIndex={0}
                    >
                      <item.icon className={`w-5 h-5 transition-transform mr-2 group-hover:scale-110`} />
                      <span className="truncate text-base tracking-tight">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            {/* Divider & subtle fade */}
            <div className="mt-6 h-0.5 w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-2 rounded-full" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
