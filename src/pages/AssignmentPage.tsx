import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { Anchor, LifeBuoy, Award, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = { Anchor, LifeBuoy, Award };

interface Asn { code: string; name: string; description: string | null; icon: string | null; }

const AssignmentPage = () => {
  const { code } = useParams<{ code: string }>();
  const [asn, setAsn] = useState<Asn | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("assignments")
        .select("code,name,description,icon")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (!data) setNotFound(true);
      else setAsn(data);
      setLoading(false);
    })();
  }, [code]);

  if (notFound) return <Navigate to="/" replace />;
  const Icon = asn?.icon ? iconMap[asn.icon] ?? Award : Award;

  return (
    <AppLayout>
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-6">
        <div className="gradient-hero text-primary-foreground px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Badge className="bg-accent text-accent-foreground hover:bg-accent mb-3 gap-1.5">
            <Award className="h-3 w-3" /> Chức danh kiêm nhiệm
          </Badge>
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 rounded-xl bg-accent text-accent-foreground items-center justify-center shrink-0 shadow-md">
              <Icon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {loading ? "Đang tải..." : asn?.name}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1.5 max-w-2xl">{asn?.description}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <KanbanBoard
          title={`Công việc — ${asn?.name}`}
          assignment_code={asn?.code}
        />
      )}
    </AppLayout>
  );
};

export default AssignmentPage;
