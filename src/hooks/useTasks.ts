import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Task, TaskInsert, TaskUpdate, TaskStatus } from "@/types/task";
import { toast } from "sonner";

export interface TaskFilters {
  category_code?: string;
  assignment_code?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (filters.category_code) q = q.eq("category_code", filters.category_code);
      if (filters.assignment_code) q = q.eq("assignment_code", filters.assignment_code);

      const { data, error } = await q;
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useTask(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["task", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as Task | null) ?? null;
    },
  });
}

export function useTaskStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["task-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("status, due_date, completed_at");
      if (error) throw error;
      const rows = data ?? [];
      const now = new Date();
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      return {
        total: rows.length,
        open: rows.filter((r) => r.status !== "done").length,
        doneThisWeek: rows.filter((r) => r.status === "done" && r.completed_at && new Date(r.completed_at) >= weekAgo).length,
        review: rows.filter((r) => r.status === "review").length,
        overdue: rows.filter((r) => r.status !== "done" && r.due_date && new Date(r.due_date) < now).length,
      };
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<TaskInsert, "user_id">) => {
      if (!user) throw new Error("Chưa đăng nhập");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
      toast.success("Đã tạo task");
    },
    onError: (e: Error) => toast.error("Tạo task thất bại", { description: e.message }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TaskUpdate }) => {
      const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
      if (data?.id) qc.invalidateQueries({ queryKey: ["task", data.id] });
    },
    onError: (e: Error) => toast.error("Cập nhật thất bại", { description: e.message }),
  });
}

export function useChangeStatus() {
  const update = useUpdateTask();
  return (id: string, status: TaskStatus) =>
    update.mutate({
      id,
      patch: { status, completed_at: status === "done" ? new Date().toISOString() : null },
    });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
      toast.success("Đã xoá task");
    },
    onError: (e: Error) => toast.error("Xoá thất bại", { description: e.message }),
  });
}
