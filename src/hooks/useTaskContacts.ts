import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TaskContact {
  id: string;
  task_id: string;
  user_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
}

export interface TaskContactInput {
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
}

export function useTaskContacts(taskId: string | null) {
  return useQuery({
    queryKey: ["task-contacts", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_contacts")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TaskContact[];
    },
  });
}

export function useAddTaskContact(taskId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: TaskContactInput) => {
      if (!user) throw new Error("Chưa đăng nhập");
      if (!input.name.trim()) throw new Error("Họ tên không được trống");
      const { data, error } = await supabase
        .from("task_contacts")
        .insert({
          task_id: taskId,
          user_id: user.id,
          name: input.name.trim(),
          role: input.role?.trim() || null,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          note: input.note?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TaskContact;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-contacts", taskId] });
      toast.success("Đã thêm liên hệ");
    },
    onError: (e: Error) => toast.error("Thêm liên hệ thất bại", { description: e.message }),
  });
}

export function useDeleteTaskContact(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-contacts", taskId] });
    },
    onError: (e: Error) => toast.error("Xoá thất bại", { description: e.message }),
  });
}
