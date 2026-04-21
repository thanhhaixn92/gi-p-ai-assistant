import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader, StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Plus, type LucideIcon,
  ShieldCheck, Wrench, TrendingUp, Wallet, Users, Building2, Scale, GraduationCap, Handshake,
  CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck, Wrench, TrendingUp, Wallet, Users, Building2, Scale, GraduationCap, Handshake,
};

interface Cat { code: string; name: string; description: string | null; icon: string | null; }

const CategoryPage = () => {
  const { code } = useParams<{ code: string }>();
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("categories")
        .select("code,name,description,icon")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (!data) setNotFound(true);
      else setCat(data);
      setLoading(false);
    })();
  }, [code]);

  if (notFound) return <Navigate to="/" replace />;

  const Icon = cat?.icon ? iconMap[cat.icon] ?? FileText : FileText;

  return (
    <AppLayout>
      <PageHeader
        title={loading ? "Đang tải..." : cat?.name ?? ""}
        subtitle={cat?.description ?? undefined}
        badge={<Badge variant="outline" className="gap-1.5"><FileText className="h-3 w-3" /> Lĩnh vực công tác</Badge>}
      >
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Tạo task</Button>
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Việc mở" value={0} icon={Clock} tone="primary" />
        <StatCard label="Hoàn thành" value={0} icon={CheckCircle2} tone="success" />
        <StatCard label="Quá hạn" value={0} icon={AlertTriangle} tone="warning" />
        <StatCard label="Văn bản" value={0} icon={FileText} tone="info" />
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{cat?.name}</CardTitle>
                <CardDescription>{cat?.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Khu vực task & ghi chú của lĩnh vực này sẽ được kích hoạt ở Phase 4–5.
              </p>
              <p className="text-xs text-muted-foreground/80 mt-2">
                MVP hiện tại tập trung vào nền tảng, bố cục và phân chia phụ trách.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default CategoryPage;
