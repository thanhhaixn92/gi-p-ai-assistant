import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, FileText, LayoutDashboard, type LucideIcon, ShieldCheck, Wrench, TrendingUp, Wallet, Users, Building2, Scale, GraduationCap, Handshake, LifeBuoy, Award, Sparkles } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck, Wrench, TrendingUp, Wallet, Users, Building2, Scale, GraduationCap, Handshake,
  Anchor, LifeBuoy, Award,
};

interface Item { code: string; name: string; icon: string | null; }

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [categories, setCategories] = useState<Item[]>([]);
  const [assignments, setAssignments] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const [c, a] = await Promise.all([
        supabase.from("categories").select("code,name,icon").order("sort_order"),
        supabase.from("assignments").select("code,name,icon").order("sort_order"),
      ]);
      if (c.data) setCategories(c.data);
      if (a.data) setAssignments(a.data);
    })();
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
      isActive
        ? "bg-sidebar-accent text-sidebar-primary font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent/60"
    }`;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-accent text-accent-foreground shadow-md">
            <Anchor className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">PG.D Hoa tiêu</p>
              <p className="text-[11px] text-sidebar-foreground/70 leading-tight truncate">Miền Bắc</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tổng quan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <NavLink to="/" end className={linkCls}>
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Bảng điều khiển</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/ghi-chu"} tooltip="Ghi chú">
                  <NavLink to="/ghi-chu" className={linkCls}>
                    <FileText className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Ghi chú</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>9 Lĩnh vực công tác</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((it) => {
                const Icon = iconMap[it.icon ?? ""] ?? LayoutDashboard;
                const to = `/linh-vuc/${it.code.toLowerCase()}`;
                return (
                  <SidebarMenuItem key={it.code}>
                    <SidebarMenuButton asChild isActive={location.pathname === to} tooltip={it.name}>
                      <NavLink to={to} className={linkCls}>
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{it.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Kiêm nhiệm</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {assignments.map((it) => {
                const Icon = iconMap[it.icon ?? ""] ?? Award;
                const to = `/kiem-nhiem/${it.code.toLowerCase()}`;
                return (
                  <SidebarMenuItem key={it.code}>
                    <SidebarMenuButton asChild isActive={location.pathname === to} tooltip={it.name}>
                      <NavLink to={to} className={linkCls}>
                        <Icon className="h-4 w-4 shrink-0 text-sidebar-primary" />
                        {!collapsed && <span className="truncate">{it.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <p className="px-2 py-2 text-[11px] text-sidebar-foreground/60">
            QĐ 143/QĐ-CTHTHHMB
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
