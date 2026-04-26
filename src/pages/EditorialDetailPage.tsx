import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Clock, History, FileEdit } from "lucide-react";
import {
  useEditorialSession,
  useEditorialSessions,
  useEditorialVersions,
} from "@/hooks/useEditorialSessions";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import {
  ARTICLE_TYPE_LABEL, TASK_TYPE_LABEL, TONE_LABEL, SESSION_STATUS_LABEL,
} from "@/types/editorial";
import { SessionEditorDialog } from "@/components/editorial/SessionEditorDialog";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function EditorialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, error } = useEditorialSession(id);
  const { data: versions = [] } = useEditorialVersions(id);
  const { remove } = useEditorialSessions();
  const taxonomies = useTaxonomies();
  const [editOpen, setEditOpen] = useState(false);

  if (!id) return <Navigate to="/bien-tap" replace />;

  const categoryName = session?.category_code
    ? taxonomies.data?.categories.find((c) => c.code === session.category_code)?.name
    : null;
  const assignmentName = session?.assignment_code
    ? taxonomies.data?.assignments.find((a) => a.code === session.assignment_code)?.name
    : null;

  const handleDelete = async () => {
    if (!session) return;
    if (!confirm(`Xoá phiên "${session.title}"?`)) return;
    await remove.mutateAsync(session.id);
    toast({ title: "Đã xoá phiên" });
    window.history.length > 1 ? window.history.back() : (window.location.href = "/bien-tap");
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-5xl">
        <BackButton fallback="/bien-tap" />

        {isLoading && (
          <Card>
            <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Card><CardContent className="py-8 text-sm text-destructive">Không tải được phiên biên tập.</CardContent></Card>
        )}

        {!isLoading && !error && !session && (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">Không tìm thấy phiên biên tập này.</CardContent></Card>
        )}

        {session && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileEdit className="h-5 w-5 text-primary shrink-0" />
                      {session.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="secondary">{ARTICLE_TYPE_LABEL[session.article_type]}</Badge>
                      <Badge variant="outline">{TASK_TYPE_LABEL[session.task_type]}</Badge>
                      <Badge variant="outline">{TONE_LABEL[session.tone]}</Badge>
                      <Badge>{SESSION_STATUS_LABEL[session.status]}</Badge>
                      {categoryName && (
                        <Badge variant="outline" className="border-primary/40 text-primary">{categoryName}</Badge>
                      )}
                      {assignmentName && (
                        <Badge variant="outline" className="border-accent/40 text-accent">{assignmentName}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4 mr-1.5" /> Chỉnh sửa
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-1.5" /> Xoá
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {session.brief && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1.5 text-muted-foreground">Yêu cầu</h3>
                    <p className="text-sm whitespace-pre-wrap">{session.brief}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-1.5 text-muted-foreground">Nội dung hiện tại</h3>
                  {session.current_content?.trim() ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border bg-muted/20 p-4">
                      {session.current_content}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">(Chưa có nội dung. Bấm "Chỉnh sửa" để soạn.)</p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Tạo: {new Date(session.created_at).toLocaleString("vi-VN")}
                  </span>
                  <span>· Cập nhật: {new Date(session.updated_at).toLocaleString("vi-VN")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Phiên bản đã lưu ({versions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Chưa có phiên bản nào. Mở "Chỉnh sửa" để lưu phiên bản đầu tiên.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {versions.map((v) => (
                      <li key={v.id} className="flex items-start gap-3 text-sm border rounded-md p-2.5">
                        <Badge variant="secondary" className="shrink-0">v{v.version_number}</Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: vi })}
                          </p>
                          {v.note && <p className="text-xs mt-0.5">{v.note}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <SessionEditorDialog
              session={session}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
