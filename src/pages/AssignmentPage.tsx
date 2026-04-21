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
  Anchor, LifeBuoy, Award, type LucideIcon,
  CheckCircle2, AlertTriangle, Calendar, Users, FileText, Plus,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = { Anchor, LifeBuoy, Award };

interface Asn { code: string; name: string; description: string | null; icon: string | null; }

// Bảng tham số riêng cho từng kiêm nhiệm
const PRESETS: Record<string, { stats: { label: string; value: string | number; tone: "primary" | "accent" | "success" | "warning" | "info"; icon: LucideIcon }[]; sections: { title: string; desc: string }[] }> = {
  CT_HDAT: {
    stats: [
      { label: "Cuộc họp HĐ An toàn", value: 4, tone: "primary", icon: Calendar },
      { label: "Sự cố theo dõi", value: 0, tone: "success", icon: CheckCircle2 },
      { label: "Nguy cơ phát hiện", value: 2, tone: "warning", icon: AlertTriangle },
      { label: "Thành viên hội đồng", value: 9, tone: "info", icon: Users },
    ],
    sections: [
      { title: "Nghị quyết / Kết luận", desc: "Văn bản kết luận của Hội đồng An toàn" },
      { title: "Sự cố – Sự việc đang theo dõi", desc: "Danh mục các vụ việc cần xử lý" },
      { title: "Lịch họp định kỳ", desc: "Họp tháng / quý / đột xuất" },
    ],
  },
  TR_BCH_PCTT: {
    stats: [
      { label: "Cảnh báo đang theo dõi", value: 0, tone: "warning", icon: AlertTriangle },
      { label: "Phương án ứng phó", value: 6, tone: "primary", icon: FileText },
      { label: "Diễn tập trong năm", value: 2, tone: "success", icon: CheckCircle2 },
      { label: "Lực lượng thường trực", value: 24, tone: "info", icon: Users },
    ],
    sections: [
      { title: "Cảnh báo thời tiết / Thiên tai", desc: "Theo dõi bão, áp thấp, triều cường" },
      { title: "Phương án PCTT-TKCN", desc: "Kế hoạch ứng phó theo cấp độ" },
      { title: "Lực lượng & Phương tiện", desc: "Nhân lực, tàu, trang thiết bị thường trực" },
    ],
  },
  CT_HD_TDKT: {
    stats: [
      { label: "Đề nghị khen thưởng", value: 7, tone: "primary", icon: Award },
      { label: "Đã phê duyệt", value: 12, tone: "success", icon: CheckCircle2 },
      { label: "Đang xem xét kỷ luật", value: 1, tone: "warning", icon: AlertTriangle },
      { label: "Phong trào thi đua", value: 5, tone: "info", icon: Calendar },
    ],
    sections: [
      { title: "Hồ sơ khen thưởng", desc: "Danh mục đề nghị, phê duyệt, trao tặng" },
      { title: "Phong trào thi đua", desc: "Các phong trào đang triển khai" },
      { title: "Kỷ luật – Kiểm điểm", desc: "Hồ sơ xử lý vi phạm theo quy chế" },
    ],
  },
};

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
  const preset = asn ? PRESETS[asn.code] : undefined;

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
            <Button size="sm" variant="secondary" className="hidden sm:inline-flex shrink-0">
              <Plus className="h-4 w-4 mr-1.5" /> Tạo task
            </Button>
          </div>
        </div>
      </div>

      {loading || !preset ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            {preset.stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {preset.sections.map((sec) => (
              <Card key={sec.title} className="shadow-card border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">{sec.title}</CardTitle>
                  <CardDescription>{sec.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                    Sẽ kích hoạt ở Phase 4–5
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default AssignmentPage;
