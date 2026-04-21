import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export const STATUS_META: Record<TaskStatus, { label: string; tone: string }> = {
  todo:    { label: "Việc cần làm", tone: "bg-muted text-foreground" },
  doing:   { label: "Đang làm",     tone: "bg-info/15 text-info" },
  review:  { label: "Chờ duyệt",    tone: "bg-warning/15 text-warning" },
  done:    { label: "Hoàn thành",   tone: "bg-success/15 text-success" },
  blocked: { label: "Tạm hoãn",     tone: "bg-destructive/15 text-destructive" },
};

export const STATUS_ORDER: TaskStatus[] = ["todo", "doing", "review", "done", "blocked"];

export const PRIORITY_META: Record<TaskPriority, { label: string; tone: string; dot: string }> = {
  low:    { label: "Thấp",       tone: "border-border text-muted-foreground",  dot: "bg-muted-foreground" },
  medium: { label: "Trung bình", tone: "border-info/40 text-info",             dot: "bg-info" },
  high:   { label: "Cao",        tone: "border-warning/50 text-warning",       dot: "bg-warning" },
  urgent: { label: "Khẩn",       tone: "border-destructive/50 text-destructive", dot: "bg-destructive" },
};
