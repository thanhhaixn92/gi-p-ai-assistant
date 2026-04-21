import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { useCreateNote, useUpdateNote } from "@/hooks/useNotes";
import type { Note } from "@/types/note";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Item { code: string; name: string; }

interface Props {
  trigger?: React.ReactNode;
  defaultCategoryCode?: string;
  defaultAssignmentCode?: string;
  note?: Note;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function NoteEditorDialog({
  trigger, defaultCategoryCode, defaultAssignmentCode, note,
  open: openProp, onOpenChange,
}: Props) {
  const isControlled = openProp !== undefined;
  const [openState, setOpenState] = useState(false);
  const open = isControlled ? openProp! : openState;
  const setOpen = (v: boolean) => { isControlled ? onOpenChange?.(v) : setOpenState(v); };

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [categoryCode, setCategoryCode] = useState<string>("none");
  const [assignmentCode, setAssignmentCode] = useState<string>("none");

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
    if (!open) return;
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags ?? []);
      setCategoryCode(note.category_code ?? "none");
      setAssignmentCode(note.assignment_code ?? "none");
    } else {
      setTitle(""); setContent(""); setTags([]); setTagInput("");
      setCategoryCode(defaultCategoryCode ?? "none");
      setAssignmentCode(defaultAssignmentCode ?? "none");
    }
  }, [open, note, defaultCategoryCode, defaultAssignmentCode]);

  const create = useCreateNote();
  const update = useUpdateNote();
  const isPending = create.isPending || update.isPending;

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, "");
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
  };
  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || isPending) return;
    const payload = {
      title: title.trim(),
      content,
      tags,
      category_code: categoryCode === "none" ? null : categoryCode,
      assignment_code: assignmentCode === "none" ? null : assignmentCode,
    };
    try {
      if (note) {
        await update.mutateAsync({ id: note.id, patch: payload });
      } else {
        await create.mutateAsync(payload);
      }
      setOpen(false);
    } catch (err) {
      console.error("Save note failed", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Sửa ghi chú" : "Ghi chú mới"}</DialogTitle>
          <DialogDescription>Hỗ trợ Markdown. Gắn lĩnh vực/kiêm nhiệm và tag để dễ tìm.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="note-title">Tiêu đề <span className="text-destructive">*</span></Label>
            <Input
              id="note-title" value={title} autoFocus
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Họp giao ban tuần 17 - Phòng An toàn"
            />
          </div>

          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Tabs defaultValue="edit">
              <TabsList className="grid grid-cols-2 w-full sm:w-64">
                <TabsTrigger value="edit">Soạn</TabsTrigger>
                <TabsTrigger value="preview">Xem trước</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={content} rows={10}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"## Nội dung\n- Vấn đề chính\n- Hành động cần thực hiện\n\n**Kết luận:** ..."}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[240px] rounded-md border bg-muted/30 p-4 prose prose-sm max-w-none dark:prose-invert">
                  {content.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">Chưa có nội dung.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(""); } }}
                placeholder={tags.length ? "" : "Nhập tag rồi Enter..."}
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
              />
            </div>
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
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
          <Button type="button" onClick={handleSave} disabled={isPending || !title.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {note ? "Lưu thay đổi" : "Tạo ghi chú"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
