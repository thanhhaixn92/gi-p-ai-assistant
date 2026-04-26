import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { listVersions, snapshotVersion } from "@/services/editorialService";
import { useEditorialSessions } from "@/hooks/useEditorialSessions";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import {
  ARTICLE_TYPE_LABEL, TASK_TYPE_LABEL, TONE_LABEL, SESSION_STATUS_LABEL,
  type EditorialSession, type EditorialArticleType, type EditorialTaskType,
  type EditorialTone, type EditorialSessionStatus,
} from "@/types/editorial";
import { toast } from "@/hooks/use-toast";
import { History, Save, RotateCcw, Bookmark, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  session: EditorialSession | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SessionEditorDialog({ session, open, onOpenChange }: Props) {
  const { update } = useEditorialSessions();
  const taxonomies = useTaxonomies();
  const qc = useQueryClient();
  const categories = useMemo(() => taxonomies.data?.categories ?? [], [taxonomies.data?.categories]);
  const assignments = useMemo(() => taxonomies.data?.assignments ?? [], [taxonomies.data?.assignments]);

  const [title, setTitle] = useState("");
  const [articleType, setArticleType] = useState<EditorialArticleType>("news");
  const [taskType, setTaskType] = useState<EditorialTaskType>("generate");
  const [tone, setTone] = useState<EditorialTone>("formal");
  const [status, setStatus] = useState<EditorialSessionStatus>("draft");
  const [categoryCode, setCategoryCode] = useState<string>("none");
  const [assignmentCode, setAssignmentCode] = useState<string>("none");
  const [brief, setBrief] = useState("");
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);

  useEffect(() => {
    if (!session) return;
    setTitle(session.title);
    setArticleType(session.article_type);
    setTaskType(session.task_type);
    setTone(session.tone);
    setStatus(session.status);
    setCategoryCode(session.category_code ?? "none");
    setAssignmentCode(session.assignment_code ?? "none");
    setBrief(session.brief ?? "");
    setContent(session.current_content ?? "");
    setOriginalContent(session.current_content ?? "");
  }, [session]);

  const versionsQuery = useQuery({
    queryKey: ["editorial_versions", session?.id],
    enabled: !!session?.id && open,
    queryFn: () => listVersions(session!.id),
  });

  if (!session) return null;

  const contentChanged = content !== originalContent;

  const handleSave = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({
        id: session.id,
        patch: {
          title: title.trim() || session.title,
          article_type: articleType,
          task_type: taskType,
          tone,
          status,
          category_code: categoryCode === "none" ? null : categoryCode,
          assignment_code: assignmentCode === "none" ? null : assignmentCode,
          brief,
          current_content: content,
        },
      });
      setOriginalContent(content);
      toast({ title: "Đã lưu phiên biên tập" });
    } catch (e) {
      toast({ title: "Lưu thất bại", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSnapshot = async () => {
    setSnapshotting(true);
    try {
      await snapshotVersion(session.id, content, "Lưu thủ công từ giao diện biên tập");
      await qc.invalidateQueries({ queryKey: ["editorial_versions", session.id] });
      toast({ title: "Đã lưu phiên bản" });
    } catch (e) {
      toast({ title: "Không lưu được phiên bản", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSnapshotting(false);
    }
  };

  const handleRestore = (versionContent: string, versionNumber: number) => {
    setContent(versionContent);
    toast({
      title: `Đã nạp phiên bản #${versionNumber}`,
      description: "Bấm 'Lưu thay đổi' để áp dụng.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="line-clamp-2">Phiên biên tập</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin và nội dung. Có thể lưu phiên bản để quay lại sau.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-5 pb-4">
            <div className="space-y-1.5">
              <Label>Tiêu đề *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as EditorialSessionStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SESSION_STATUS_LABEL).map(([k, v]) => (
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label>Mô tả yêu cầu (brief)</Label>
              <Textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Nội dung hiện tại</Label>
                {contentChanged && (
                  <Badge variant="outline" className="text-xs">Có thay đổi chưa lưu</Badge>
                )}
              </div>
              <Textarea
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung bài viết. AI sẽ sinh nội dung ở giai đoạn sau — anh có thể tự gõ ở đây."
                className="font-mono text-sm"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Lịch sử phiên bản</h3>
                <Badge variant="secondary" className="ml-auto">
                  {versionsQuery.data?.length ?? 0} phiên bản
                </Badge>
              </div>
              {versionsQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Đang tải...</p>
              ) : versionsQuery.error ? (
                <p className="text-xs text-destructive">Lỗi tải phiên bản</p>
              ) : (versionsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Chưa có phiên bản nào. Bấm "Lưu phiên bản" để chụp lại nội dung hiện tại.
                </p>
              ) : (
                <div className="space-y-2">
                  {versionsQuery.data!.map((v) => (
                    <div key={v.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge>v{v.version_number}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        {v.note && <p className="text-xs text-muted-foreground mt-1">{v.note}</p>}
                        <p className="text-xs mt-1 line-clamp-2 text-foreground/70">
                          {v.content.slice(0, 200) || "(trống)"}
                        </p>
                      </div>
                      <Button
                        size="sm" variant="outline" className="shrink-0 gap-1"
                        onClick={() => handleRestore(v.content, v.version_number)}
                      >
                        <RotateCcw className="h-3 w-3" /> Khôi phục
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-1">
            <X className="h-4 w-4" /> Đóng
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSnapshot}
              disabled={snapshotting || !content}
              className="gap-1"
            >
              <Bookmark className="h-4 w-4" /> {snapshotting ? "Đang lưu..." : "Lưu phiên bản"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1">
              <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
