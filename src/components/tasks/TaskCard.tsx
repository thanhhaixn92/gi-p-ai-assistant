import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MoreHorizontal, Trash2, ArrowRight, Clock, Briefcase, Paperclip } from "lucide-react";
import { PRIORITY_META, STATUS_META, STATUS_ORDER, type Task } from "@/types/task";
import { useChangeStatus, useDeleteTask } from "@/hooks/useTasks";
import { useDepartments } from "@/hooks/useDepartments";
import { cn } from "@/lib/utils";
import { useTaskAttachments } from "@/hooks/useTaskAttachments";

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

function relativeCreated(d: string) {
  const diffMs = Date.now() - new Date(d).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  const changeStatus = useChangeStatus();
  const del = useDeleteTask();
  const due = formatDue(task.due_date);
  const pri = PRIORITY_META[task.priority];

  const { data: departments = [] } = useDepartments();
  const { data: attachments = [] } = useTaskAttachments(task.id);
  const deptNames = (task.department_codes ?? [])
    .map((code) => departments.find((d) => d.code === code)?.name)
    .filter(Boolean) as string[];

  const goDetail = () => navigate(`/cong-viec/${task.id}`);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={goDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goDetail();
        }
      }}
      className="p-3 shadow-card hover:shadow-elegant transition-shadow border-border/60 group cursor-pointer"
    >
      <div className="flex items-start gap-2">
        <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", pri.dot)} title={pri.label} />
        <div className="flex-1 min-w-0">
          <div className="text-left text-sm font-medium leading-snug text-foreground hover:text-primary transition-colors">
            {task.title}
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          {deptNames.length > 0 && (
            <div className="flex items-start gap-1 mt-2 text-[11px] text-muted-foreground">
              <Briefcase className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{deptNames.join(", ")}</span>
            </div>
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
            {attachments.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Paperclip className="h-3 w-3" /> {attachments.length}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
              <Clock className="h-3 w-3" /> {relativeCreated(task.created_at)}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Chuyển trạng thái</DropdownMenuLabel>
            {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
              <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); changeStatus(task.id, s); }}>
                <ArrowRight className="h-3.5 w-3.5 mr-2" /> {STATUS_META[s].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Xoá task "${task.title}"?`)) del.mutate(task.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Xoá task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
