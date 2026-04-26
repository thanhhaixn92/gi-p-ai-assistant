import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Pin, Clock } from "lucide-react";
import { useNote, useDeleteNote } from "@/hooks/useNotes";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import { NoteEditorDialog } from "@/components/notes/NoteEditorDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: note, isLoading, error } = useNote(id);
  const taxonomies = useTaxonomies();
  const del = useDeleteNote();
  const [editOpen, setEditOpen] = useState(false);

  if (!id) return <Navigate to="/ghi-chu" replace />;

  const categoryName = note?.category_code
    ? taxonomies.data?.categories.find((c) => c.code === note.category_code)?.name
    : null;
  const assignmentName = note?.assignment_code
    ? taxonomies.data?.assignments.find((a) => a.code === note.assignment_code)?.name
    : null;

  const handleDelete = async () => {
    if (!note) return;
    if (!confirm(`Xoá ghi chú "${note.title}"?`)) return;
    await del.mutateAsync(note.id);
    window.history.length > 1 ? window.history.back() : (window.location.href = "/ghi-chu");
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-4xl">
        <BackButton fallback="/ghi-chu" />

        {isLoading && (
          <Card>
            <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Card><CardContent className="py-8 text-sm text-destructive">Không tải được ghi chú.</CardContent></Card>
        )}

        {!isLoading && !error && !note && (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">Không tìm thấy ghi chú này.</CardContent></Card>
        )}

        {note && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {note.is_pinned && <Pin className="h-4 w-4 text-accent fill-accent" />}
                      {note.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {(note.tags ?? []).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">#{t}</Badge>
                      ))}
                      {categoryName && (
                        <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                          {categoryName}
                        </Badge>
                      )}
                      {assignmentName && (
                        <Badge variant="outline" className="text-xs border-accent/40 text-accent">
                          {assignmentName}
                        </Badge>
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
              <CardContent className="space-y-4">
                {note.content?.trim() ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">(Ghi chú trống)</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Tạo: {new Date(note.created_at).toLocaleString("vi-VN")}
                  </span>
                  <span>· Cập nhật: {new Date(note.updated_at).toLocaleString("vi-VN")}</span>
                </div>
              </CardContent>
            </Card>

            <NoteEditorDialog note={note} open={editOpen} onOpenChange={setEditOpen} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
