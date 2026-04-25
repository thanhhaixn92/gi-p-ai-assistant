import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useCreateTask } from "@/hooks/useTasks";
import { PRIORITY_META, STATUS_META, STATUS_ORDER, TaskPriority, TaskStatus } from "@/types/task";
import { DepartmentPicker } from "./DepartmentPicker";

interface Item { code: string; name: string; }

interface Props {
  trigger?: React.ReactNode;
  defaultCategoryCode?: string;
  defaultAssignmentCode?: string;
  defaultStatus?: TaskStatus;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function CreateTaskDialog({
  trigger, defaultCategoryCode, defaultAssignmentCode, defaultStatus = "todo",
  open: openProp, onOpenChange,
}: Props) {
  const isControlled = openProp !== undefined;
  const [openState, setOpenState] = useState(false);
  const open = isControlled ? openProp! : openState;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setOpenState(v);
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [categoryCode, setCategoryCode] = useState<string>(defaultCategoryCode ?? "none");
  const [assignmentCode, setAssignmentCode] = useState<string>(defaultAssignmentCode ?? "none");
  const [departmentCodes, setDepartmentCodes] = useState<string[]>([]);

  const [categories, setCategories] = useState<Item[]>([]);
  const [assignments, setAssignments] = useState<Item[]>([]);

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

  useEffect(() => {
    if (open) {
      setStatus(defaultStatus);
      setCategoryCode(defaultCategoryCode ?? "none");
      setAssignmentCode(defaultAssignmentCode ?? "none");
    }
  }, [open, defaultStatus, defaultCategoryCode, defaultAssignmentCode]);

  const createTask = useCreateTask();

  const reset = () => {
    setTitle(""); setDescription(""); setPriority("medium"); setDueDate("");
    setDepartmentCodes([]);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!title.trim() || createTask.isPending) return;
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category_code: categoryCode === "none" ? null : categoryCode,
        assignment_code: assignmentCode === "none" ? null : assignmentCode,
        department_codes: departmentCodes,
      });
      reset();
      setOpen(false);
    } catch (err) {
      console.error("Create task failed", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>Tạo task mới</DialogTitle>
            <DialogDescription>Ghi nhận một công việc cần xử lý theo Quyết định 143.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
              <Input
                id="title" required autoFocus value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Phê duyệt phương án dẫn tàu container 50.000 DWT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Mô tả</Label>
              <Textarea
                id="desc" value={description} rows={3}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bối cảnh, yêu cầu, người liên quan..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                    ))}
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
              <Label htmlFor="due">Hạn xử lý</Label>
              <Input id="due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lĩnh vực</Label>
                <Select value={categoryCode} onValueChange={setCategoryCode}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không gắn —</SelectItem>
                    {categories.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kiêm nhiệm</Label>
                <Select value={assignmentCode} onValueChange={setAssignmentCode}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không gắn —</SelectItem>
                    {assignments.map((a) => <SelectItem key={a.code} value={a.code}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bộ phận xử lý</Label>
              <DepartmentPicker value={departmentCodes} onChange={setDepartmentCodes} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createTask.isPending || !title.trim()}
            >
              {createTask.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Tạo task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
