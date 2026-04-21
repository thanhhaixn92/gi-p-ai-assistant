import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader, StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { useTaskStats } from "@/hooks/useTasks";
import {
  CheckCircle2, Clock, AlertTriangle, FileText, Anchor, LifeBuoy, Award,
  ArrowRight, Calendar, type LucideIcon,
  ShieldCheck, Wrench, TrendingUp, Wallet, Users, Building2, Scale, GraduationCap, Handshake,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck, Wrench, TrendingUp, Wallet, Users, Building2, Scale, GraduationCap, Handshake,
  Anchor, LifeBuoy, Award,
};

interface Item { code: string; name: string; description: string | null; icon: string | null; }

const Index = () => {
  const [categories, setCategories] = useState<Item[]>([]);
  const [assignments, setAssignments] = useState<Item[]>([]);
  const { data: stats } = useTaskStats();

  useEffect(() => {
    (async () => {
      const [c, a] = await Promise.all([
        supabase.from("categories").select("code,name,description,icon").order("sort_order"),
        supabase.from("assignments").select("code,name,description,icon").order("sort_order"),
      ]);
      if (c.data) setCategories(c.data);
      if (a.data) setAssignments(a.data);
    })();
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <AppLayout>
      <PageHeader
        title="Bảng điều khiển Phó Giám đốc"
        subtitle="Tổng quan công việc theo Quyết định 143/QĐ-CTHTHHMB — 9 lĩnh vực phụ trách và 3 chức danh kiêm nhiệm."
        badge={
          <Badge variant="secondary" className="gap-1.5">
            <Calendar className="h-3 w-3" /> {today}
          </Badge>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Việc đang xử lý" value={stats?.open ?? 0} icon={Clock} tone="primary" />
        <StatCard label="Hoàn thành tuần" value={stats?.doneThisWeek ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Cần phê duyệt" value={stats?.review ?? 0} icon={AlertTriangle} tone="warning" />
        <StatCard label="Quá hạn" value={stats?.overdue ?? 0} icon={AlertTriangle} tone="info" />
      </div>

      {/* Kanban toàn bộ */}
      <section className="mb-10">
        <KanbanBoard title="Bảng công việc tổng hợp" />
      </section>

      {/* 3 Kiêm nhiệm */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">3 Chức danh kiêm nhiệm</h2>
            <p className="text-sm text-muted-foreground">Truy cập nhanh các bảng điều khiển chuyên biệt</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {assignments.map((a) => {
            const Icon = iconMap[a.icon ?? ""] ?? Award;
            return (
              <Link key={a.code} to={`/kiem-nhiem/${a.code.toLowerCase()}`} className="group">
                <Card className="h-full overflow-hidden border-border/60 shadow-card hover:shadow-elegant transition-all">
                  <div className="h-1.5 gradient-accent" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base leading-snug">{a.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">{a.description}</CardDescription>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:gap-2 gap-1.5 transition-all">
                      Mở bảng điều khiển <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 9 lĩnh vực */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">9 Lĩnh vực công tác</h2>
            <p className="text-sm text-muted-foreground">Phân công theo Quyết định 143</p>
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = iconMap[c.icon ?? ""] ?? FileText;
            return (
              <Link key={c.code} to={`/linh-vuc/${c.code.toLowerCase()}`}>
                <Card className="h-full border-border/60 shadow-card hover:shadow-elegant hover:border-primary/40 transition-all">
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-snug">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
};

export default Index;
