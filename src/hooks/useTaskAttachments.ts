import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
}

const MAX_SIZE = 25 * 1024 * 1024;

const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "text/plain",
  "text/csv",
  "application/zip",
]);

export function useTaskAttachments(taskId: string | null) {
  return useQuery({
    queryKey: ["task-attachments", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TaskAttachment[];
    },
  });
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

export function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Chưa đăng nhập");
      if (file.size > MAX_SIZE) throw new Error(`File vượt quá 25MB`);
      if (file.type && !ALLOWED.has(file.type)) {
        throw new Error(`Định dạng không hỗ trợ: ${file.type || "không xác định"}`);
      }

      const path = `${user.id}/${taskId}/${Date.now()}_${safeName(file.name)}`;

      const { error: upErr } = await supabase.storage
        .from("task-files")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          file_name: file.name,
          storage_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
        })
        .select()
        .single();
      if (error) {
        // rollback storage on db failure
        await supabase.storage.from("task-files").remove([path]);
        throw error;
      }
      return data as TaskAttachment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-attachments", taskId] });
      toast.success("Đã tải lên file đính kèm");
    },
    onError: (e: Error) => toast.error("Tải lên thất bại", { description: e.message }),
  });
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (att: TaskAttachment) => {
      const { error: rmErr } = await supabase.storage
        .from("task-files")
        .remove([att.storage_path]);
      if (rmErr) throw rmErr;
      const { error } = await supabase.from("task_attachments").delete().eq("id", att.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-attachments", taskId] });
      toast.success("Đã xoá file");
    },
    onError: (e: Error) => toast.error("Xoá thất bại", { description: e.message }),
  });
}

export async function getAttachmentSignedUrl(storage_path: string) {
  const { data, error } = await supabase.storage
    .from("task-files")
    .createSignedUrl(storage_path, 60 * 10); // 10 minutes
  if (error) throw error;
  return data.signedUrl;
}
