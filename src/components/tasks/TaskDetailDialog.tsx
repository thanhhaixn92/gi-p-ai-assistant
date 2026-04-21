import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Trash2, Calendar as CalendarIcon, Tag, Layers, Briefcase } from "lucide-react";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import {
  PRIORITY_META, STATUS_META, STATUS_ORDER,
  type Task, type TaskPriority, type TaskStatus,
} from "@/types/task";
import { DepartmentPicker } from "./DepartmentPicker";
import { TaskContacts } from "./TaskContacts";
import { TaskAttachments } from "./TaskAttachments";

interface Item { code: string; name: string; }

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function toLocalInput(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function TaskDetailDialog({ task, open, onOpenChange }: Props) {
  const update = useUpdateTask();
  const del = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [categoryCode, setCategoryCode] = useState<string>("none");
  const [assignmentCode, setAssignmentCode] = useState<string>("none");
  const [departmentCodes, setDepartmentCodes] = useState<string[]>([]);

  const [categories, setCategories] = useState<Item[]>([]);
  const [assignments, setAssignments] = useState<Item[]>([]);

  // Hydrate when task changes / dialog opens
  useEffect(() => {
    if (!task || !open) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(toLocalInput(task.due_date));
    setCategoryCode(task.category_code ?? "none");
    setAssignmentCode(task.assignment_code ?? "none");
    setDepartmentCodes((task as Task & { department_codes?: string[] }).department_codes ?? []);
  }, [task, open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [c, a] = await Promise.all([
        supabase.from("categories").select("code,name").order("sort_order"),
        supabase.from("assignments").select("code,name").order("sort_order"),
      ]);
      if (c.data) setCategories(c.data);
      if (a.data) setAssignments(a.data);
    })();
  }, [open]);

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim() || update.isPending) return;
    try {
      await update.mutateAsync({
        id: task.id,
        patch: {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          category_code: categoryCode === "none" ? null : categoryCode,
          assignment_code: assignmentCode === "none" ? null : assignmentCode,
          department_codes: departmentCodes,
          completed_at:
            status === "done"
              ? task.completed_at ?? new Date().toISOString()
              : null,
        },
      });
      onOpenChange(false);
    } catch { /* toast in hook */ }
  };

  const handleDelete = async () => {
    if (!confirm(`Xoá task "${task.title}"?\nMọi liên hệ và file đính kèm sẽ bị xoá theo.`)) return;
    try {
      await del.mutateAsync(task.id);
      onOpenChange(false);
    } catch { /* toast in hook */ }
  };

  const created = new Date(task.created_at).toLocaleString("vi-VN");
  const updated = new Date(task.updated_at).toLocaleString("vi-VN");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="pr-8 text-base">Chi tiết công việc</DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            Tạo: {created} · Cập nhật: {updated}
          </p>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 bg-transparent px-5">
            <TabsTrigger value="info" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none h-10">
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none h-10">
              Liên hệ
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none h-10">
              Tài liệu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="px-5 py-4 space-y-4 m-0">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Mô tả</Label>
              <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ưu tiên</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due" className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> Hạn xử lý</Label>
              <Input id="due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Lĩnh vực</Label>
                <Select value={categoryCode} onValueChange={setCategoryCode}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không gắn —</SelectItem>
                    {categories.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Kiêm nhiệm</Label>
                <Select value={assignmentCode} onValueChange={setAssignmentCode}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không gắn —</SelectItem>
                    {assignments.map((a) => <SelectItem key={a.code} value={a.code}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Bộ phận xử lý</Label>
              <DepartmentPicker value={departmentCodes} onChange={setDepartmentCodes} />
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="px-5 py-4 m-0">
            <TaskContacts taskId={task.id} />
          </TabsContent>

          <TabsContent value="files" className="px-5 py-4 m-0">
            <TaskAttachments taskId={task.id} />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t bg-muted/30 sticky bottom-0">
          <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Xoá
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={update.isPending || !title.trim()}>
              {update.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
