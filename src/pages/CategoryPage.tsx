import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import {
  FileText, type LucideIcon,
  ShieldCheck, Wrench, TrendingUp, Wallet, Users, Building2, Scale, GraduationCap, Handshake,
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
        badge={
          <Badge variant="outline" className="gap-1.5">
            <Icon className="h-3 w-3" /> Lĩnh vực công tác
          </Badge>
        }
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <KanbanBoard
          title={`Công việc — ${cat?.name}`}
          category_code={cat?.code}
        />
      )}
    </AppLayout>
  );
};

export default CategoryPage;
