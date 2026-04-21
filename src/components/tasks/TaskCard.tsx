import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MoreHorizontal, Trash2, ArrowRight } from "lucide-react";
import { PRIORITY_META, STATUS_META, STATUS_ORDER, type Task } from "@/types/task";
import { useChangeStatus, useDeleteTask } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

function formatDue(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const formatted = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  let tone = "text-muted-foreground";
  let label = formatted;
  if (diffDays < 0) { tone = "text-destructive"; label = `Quá hạn ${formatted}`; }
  else if (diffDays === 0) { tone = "text-warning"; label = "Hôm nay"; }
  else if (diffDays === 1) { tone = "text-warning"; label = "Ngày mai"; }
  else if (diffDays <= 3) { tone = "text-info"; label = `Còn ${diffDays} ngày`; }
  return { label, tone };
}

export function TaskCard({ task }: { task: Task }) {
  const changeStatus = useChangeStatus();
  const del = useDeleteTask();
  const due = formatDue(task.due_date);
  const pri = PRIORITY_META[task.priority];

  return (
    <Card className="p-3 shadow-card hover:shadow-elegant transition-shadow border-border/60 group">
      <div className="flex items-start gap-2">
        <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", pri.dot)} title={pri.label} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 font-medium", pri.tone)}>
              {pri.label}
            </Badge>
            {due && (
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", due.tone)}>
                <Calendar className="h-3 w-3" /> {due.label}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Chuyển trạng thái</DropdownMenuLabel>
            {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
              <DropdownMenuItem key={s} onClick={() => changeStatus(task.id, s)}>
                <ArrowRight className="h-3.5 w-3.5 mr-2" /> {STATUS_META[s].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => del.mutate(task.id)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Xoá task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
