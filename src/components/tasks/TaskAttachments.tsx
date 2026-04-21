import { useRef } from "react";
import {
  useTaskAttachments, useUploadAttachment, useDeleteAttachment,
  getAttachmentSignedUrl, type TaskAttachment,
} from "@/hooks/useTaskAttachments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  FileText, FileSpreadsheet, FileImage, File as FileIcon,
  Download, Trash2, Upload, Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Props { taskId: string }

function fileIcon(mime: string | null) {
  if (!mime) return FileIcon;
  if (mime.startsWith("image/")) return FileImage;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("word") || mime.includes("document")) return FileText;
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return FileSpreadsheet;
  return FileIcon;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function TaskAttachments({ taskId }: Props) {
  const { data: attachments = [], isLoading } = useTaskAttachments(taskId);
  const upload = useUploadAttachment(taskId);
  const del = useDeleteAttachment(taskId);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try { await upload.mutateAsync(file); } catch { /* toast in hook */ }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = async (att: TaskAttachment) => {
    try {
      const url = await getAttachmentSignedUrl(att.storage_path);
      window.open(url, "_blank", "noopener");
    } catch (e: unknown) {
      toast.error("Không lấy được đường dẫn", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Tài liệu đính kèm ({attachments.length})</Label>
        <Button
          type="button" size="sm" variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
          Tải file
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.csv,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*,text/plain,text/csv,application/zip"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">PDF · Word · Excel · PowerPoint · Ảnh · ZIP — tối đa 25MB / file</p>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Đang tải...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Chưa có file đính kèm.</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((a) => {
            const Icon = fileIcon(a.mime_type);
            return (
              <Card key={a.id} className="p-2 flex items-center gap-2 group">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.file_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatSize(a.size_bytes)} · {new Date(a.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(a)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button" variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => { if (confirm(`Xoá file "${a.file_name}"?`)) del.mutate(a); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
