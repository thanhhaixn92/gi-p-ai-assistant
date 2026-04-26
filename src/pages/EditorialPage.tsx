import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useEditorialSessions } from "@/hooks/useEditorialSessions";
import {
  ARTICLE_TYPE_LABEL, TASK_TYPE_LABEL, TONE_LABEL, SESSION_STATUS_LABEL,
  type EditorialArticleType, type EditorialTaskType, type EditorialTone,
} from "@/types/editorial";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import { FileEdit, Plus, Sparkles, Trash2, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { SessionEditorDialog } from "@/components/editorial/SessionEditorDialog";

export default function EditorialPage() {
  const { sessionsQuery, create, remove } = useEditorialSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const taxonomies = useTaxonomies();
  const categories = useMemo(() => taxonomies.data?.categories ?? [], [taxonomies.data?.categories]);
  const assignments = useMemo(() => taxonomies.data?.assignments ?? [], [taxonomies.data?.assignments]);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [articleType, setArticleType] = useState<EditorialArticleType>("news");
  const [taskType, setTaskType] = useState<EditorialTaskType>("generate");
  const [tone, setTone] = useState<EditorialTone>("formal");
  const [brief, setBrief] = useState("");
  const [categoryCode, setCategoryCode] = useState<string>("none");
  const [assignmentCode, setAssignmentCode] = useState<string>("none");

  const reset = () => {
    setTitle(""); setArticleType("news"); setTaskType("generate");
    setTone("formal"); setBrief(""); setCategoryCode("none"); setAssignmentCode("none");
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast({ title: "Cần tiêu đề phiên", variant: "destructive" }); return; }
    try {
      await create.mutateAsync({
        title: title.trim(),
        article_type: articleType,
        task_type: taskType,
        tone,
        brief: brief.trim(),
        category_code: categoryCode === "none" ? null : categoryCode,
        assignment_code: assignmentCode === "none" ? null : assignmentCode,
      });
      toast({ title: "Đã tạo phiên biên tập" });
      reset();
      setOpen(false);
    } catch (e) {
      toast({ title: "Không tạo được phiên", description: String((e as Error).message), variant: "destructive" });
    }
  };

  const sessions = sessionsQuery.data ?? [];
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  const handleOpenSession = (id: string) => {
    setSelectedSessionId(id);
    setEditorOpen(true);
  };

  const taxonomyName = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.code, c.name));
    assignments.forEach((a) => map.set(a.code, a.name));
    return map;
  }, [categories, assignments]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileEdit className="h-6 w-6 text-primary" />
              Trợ lý biên tập
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Soạn tin – báo cáo – kế hoạch với AI. Gắn nguồn, sinh hình minh hoạ, xuất Word/PDF.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Phiên mới</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo phiên biên tập</DialogTitle>
                <DialogDescription>
                  Mô tả ngắn gọn yêu cầu. Anh có thể sinh nội dung, tinh chỉnh, gắn ảnh ở các bước sau.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Tiêu đề phiên *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Tin về Lễ ra quân đầu năm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Loại bài</Label>
                    <Select value={articleType} onValueChange={(v) => setArticleType(v as EditorialArticleType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ARTICLE_TYPE_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tác vụ</Label>
                    <Select value={taskType} onValueChange={(v) => setTaskType(v as EditorialTaskType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_TYPE_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Giọng văn</Label>
                    <Select value={tone} onValueChange={(v) => setTone(v as EditorialTone)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TONE_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Lĩnh vực</Label>
                    <Select value={categoryCode} onValueChange={setCategoryCode}>
                      <SelectTrigger><SelectValue placeholder="(Không chọn)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Không chọn)</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kiêm nhiệm</Label>
                    <Select value={assignmentCode} onValueChange={setAssignmentCode}>
                      <SelectTrigger><SelectValue placeholder="(Không chọn)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Không chọn)</SelectItem>
                        {assignments.map((a) => (
                          <SelectItem key={a.code} value={a.code}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Mô tả yêu cầu</Label>
                  <Textarea value={brief} onChange={(e) => setBrief(e.target.value)}
                    rows={5}
                    placeholder="VD: Viết tin 250-300 từ về lễ ra quân, có dẫn lời lãnh đạo, kèm 1 ảnh khí thế..." />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
                <Button onClick={handleCreate} disabled={create.isPending} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Tạo phiên
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {sessionsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileEdit className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Chưa có phiên biên tập nào</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bấm "Phiên mới" để bắt đầu soạn bài đầu tiên.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => {
              const isSelected = s.id === selectedSessionId;
              return (
                <Card
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenSession(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenSession(s.id);
                    }
                  }}
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{s.title}</CardTitle>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Xoá phiên "${s.title}"?`)) {
                            await remove.mutateAsync(s.id);
                            if (selectedSessionId === s.id) {
                              setSelectedSessionId(null);
                              setEditorOpen(false);
                            }
                            toast({ title: "Đã xoá phiên" });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true, locale: vi })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{ARTICLE_TYPE_LABEL[s.article_type]}</Badge>
                      <Badge variant="outline">{TASK_TYPE_LABEL[s.task_type]}</Badge>
                      <Badge variant="outline">{TONE_LABEL[s.tone]}</Badge>
                      <Badge>{SESSION_STATUS_LABEL[s.status]}</Badge>
                    </div>
                    {(s.category_code || s.assignment_code) && (
                      <p className="text-xs text-muted-foreground">
                        {s.category_code ? taxonomyName.get(s.category_code) ?? s.category_code : ""}
                        {s.assignment_code ? ` · ${taxonomyName.get(s.assignment_code) ?? s.assignment_code}` : ""}
                      </p>
                    )}
                    {s.brief && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{s.brief}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4 text-xs text-muted-foreground">
            {selectedSession
              ? <>Đang chọn: <strong>{selectedSession.title}</strong></>
              : "Chọn một phiên biên tập để xem và chỉnh sửa."}
          </CardContent>
        </Card>
      </div>

      <SessionEditorDialog
        session={selectedSession}
        open={editorOpen}
        onOpenChange={(v) => {
          setEditorOpen(v);
          if (!v) setSelectedSessionId(null);
        }}
      />
    </AppLayout>
  );
}
