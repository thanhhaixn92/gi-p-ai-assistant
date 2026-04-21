import { useMemo, useState } from "react";
import { useTasks, type TaskFilters } from "@/hooks/useTasks";
import { STATUS_META, STATUS_ORDER, type TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends TaskFilters {
  title?: string;
}

export function KanbanBoard({ title = "Bảng công việc", category_code, assignment_code }: Props) {
  const { data: tasks = [], isLoading } = useTasks({ category_code, assignment_code });
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, typeof tasks> = {
      todo: [], doing: [], review: [], done: [], blocked: [],
    };
    for (const t of tasks) g[t.status].push(t);
    return g;
  }, [tasks]);

  const openCreate = (s: TaskStatus) => { setCreateStatus(s); setCreateOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <CreateTaskDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultStatus={createStatus}
          defaultCategoryCode={category_code}
          defaultAssignmentCode={assignment_code}
        />
        <Button size="sm" onClick={() => openCreate("todo")}>
          <Plus className="h-4 w-4 mr-1.5" /> Tạo task
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 lg:overflow-x-auto">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", STATUS_META[s].tone)}>
                  {STATUS_META[s].label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{grouped[s].length}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreate(s)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 min-h-[120px]">
              {isLoading ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : grouped[s].length === 0 ? (
                <button
                  onClick={() => openCreate(s)}
                  className="flex flex-col items-center justify-center py-6 px-3 rounded-md border border-dashed border-border/60 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-muted/30 transition-colors"
                >
                  <Inbox className="h-4 w-4 mb-1" />
                  Chưa có task
                </button>
              ) : (
                grouped[s].map((t) => <TaskCard key={t.id} task={t} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
