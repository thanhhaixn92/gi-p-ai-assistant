import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Calendar, Briefcase, Layers, Tag, Clock } from "lucide-react";
import { useTask, useDeleteTask } from "@/hooks/useTasks";
import { useDepartments } from "@/hooks/useDepartments";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import { PRIORITY_META, STATUS_META } from "@/types/task";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { cn } from "@/lib/utils";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: task, isLoading, error } = useTask(id);
  const { data: departments = [] } = useDepartments();
  const taxonomies = useTaxonomies();
  const del = useDeleteTask();
  const [editOpen, setEditOpen] = useState(false);

  if (!id) return <Navigate to="/" replace />;

  const categoryName = task?.category_code
    ? taxonomies.data?.categories.find((c) => c.code === task.category_code)?.name
    : null;
  const assignmentName = task?.assignment_code
    ? taxonomies.data?.assignments.find((a) => a.code === task.assignment_code)?.name
    : null;
  const deptNames = (task?.department_codes ?? [])
    .map((code) => departments.find((d) => d.code === code)?.name)
    .filter(Boolean) as string[];

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm(`Xoá công việc "${task.title}"?`)) return;
    await del.mutateAsync(task.id);
    window.history.length > 1 ? window.history.back() : (window.location.href = "/");
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-4xl">
        <BackButton fallback="/" />

        {isLoading && (
          <Card>
            <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Card><CardContent className="py-8 text-sm text-destructive">Không tải được công việc.</CardContent></Card>
        )}

        {!isLoading && !error && !task && (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">Không tìm thấy công việc này.</CardContent></Card>
        )}

        {task && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-xl">{task.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className={cn("text-xs", STATUS_META[task.status].tone)}>
                        {STATUS_META[task.status].label}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", PRIORITY_META[task.priority].tone)}>
                        Ưu tiên: {PRIORITY_META[task.priority].label}
                      </Badge>
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(task.due_date).toLocaleString("vi-VN")}
                        </span>
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
                {task.description ? (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                    {task.description}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">(Không có mô tả)</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {categoryName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>Lĩnh vực: <strong className="text-foreground">{categoryName}</strong></span>
                    </div>
                  )}
                  {assignmentName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4 text-accent" />
                      <span>Kiêm nhiệm: <strong className="text-foreground">{assignmentName}</strong></span>
                    </div>
                  )}
                  {deptNames.length > 0 && (
                    <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                      <Briefcase className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Bộ phận: <strong className="text-foreground">{deptNames.join(", ")}</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Tạo: {new Date(task.created_at).toLocaleString("vi-VN")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    · Cập nhật: {new Date(task.updated_at).toLocaleString("vi-VN")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <TaskDetailDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
