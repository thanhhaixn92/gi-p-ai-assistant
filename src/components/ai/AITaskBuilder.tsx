import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, ListTodo, Check, X, Pencil, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreateTask } from "@/hooks/useTasks";
import { PRIORITY_META, type TaskPriority } from "@/types/task";

interface Item { code: string; name: string }

export interface AIDraftTask {
  title: string;
  description: string;
  priority: TaskPriority;
  category_code: string | null;
  assignment_code: string | null;
  due_date: string | null;
  confidence: number;
  missing_fields: string[];
  clarifying_question: string;
}

interface Props {
  /** Mô tả tự nhiên user gõ trong khung chat */
  userPrompt: string;
  /** Khi user bấm "Tạo task" thành công hoặc "Huỷ" */
  onClose: (created: boolean) => void;
}

const STEPS = ["extract", "checklist", "review"] as const;
type Step = typeof STEPS[number];

const FIELD_LABEL: Record<string, string> = {
  title: "Tiêu đề",
  description: "Mô tả",
  priority: "Mức ưu tiên",
  category_code: "Lĩnh vực phụ trách",
  assignment_code: "Nhiệm vụ kiêm nhiệm",
  due_date: "Hạn hoàn thành",
};

// Giá trị mặc định khi user BỎ TICK (không dùng giá trị AI đề xuất)
const DEFAULTS = {
  priority: "medium" as TaskPriority,
  due_date: null as string | null,
  category_code: null as string | null,
  assignment_code: null as string | null,
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function AITaskBuilder({ userPrompt, onClose }: Props) {
  const [step, setStep] = useState<Step>("extract");
  const [draft, setDraft] = useState<AIDraftTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Item[]>([]);
  const [assignments, setAssignments] = useState<Item[]>([]);
  /** Các trường user đã CHẤP NHẬN giá trị AI đề xuất. Mặc định: tick hết */
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const createTask = useCreateTask();

  // Load danh mục lĩnh vực + kiêm nhiệm
  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("code,name").order("sort_order"),
      supabase.from("assignments").select("code,name").order("sort_order"),
    ]).then(([c, a]) => {
      setCategories((c.data ?? []) as Item[]);
      setAssignments((a.data ?? []) as Item[]);
    });
  }, []);

  // Gọi AI để extract task ngay khi mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            mode: "extract_task",
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (resp.status === 429) throw new Error("Đã vượt giới hạn yêu cầu AI, thử lại sau ít phút");
        if (resp.status === 402) throw new Error("Hết tín dụng AI - cần nạp thêm trong workspace");
        if (resp.status === 401) throw new Error("Phiên đăng nhập không hợp lệ");
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(j.error || "Lỗi gọi trợ lý AI");
        }
        const data = await resp.json();
        if (cancelled) return;
        const taskData = data.task as AIDraftTask;
        setDraft(taskData);
        // Tự động tick HẾT các trường có giá trị AI đề xuất hợp lệ
        setConfirmed({
          title: !!taskData.title?.trim(),
          priority: !!taskData.priority,
          due_date: !!taskData.due_date,
          category_code: !!taskData.category_code,
          assignment_code: !!taskData.assignment_code,
          description: !!taskData.description?.trim(),
        });
        setStep("checklist");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Lỗi không xác định");
      }
    })();
    return () => { cancelled = true; };
  }, [userPrompt]);

  const update = <K extends keyof AIDraftTask>(k: K, v: AIDraftTask[K]) => {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  };

  const toggleConfirm = (field: string, value: boolean) => {
    setConfirmed((c) => ({ ...c, [field]: value }));
  };

  /** Lấy giá trị cuối cùng của 1 trường: tick → giá trị AI/đã sửa, bỏ tick → default */
  const finalValue = <K extends keyof typeof DEFAULTS>(field: K): (typeof DEFAULTS)[K] => {
    if (!draft) return DEFAULTS[field];
    return (confirmed[field] ? (draft[field] as any) : DEFAULTS[field]) as (typeof DEFAULTS)[K];
  };

  const handleCreate = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Tiêu đề không được trống");
      return;
    }
    // Validate code 1 lần nữa client-side và áp dụng default khi bỏ tick
    const catRaw = finalValue("category_code");
    const asgRaw = finalValue("assignment_code");
    const cat = catRaw && categories.find((c) => c.code === catRaw) ? catRaw : null;
    const asg = asgRaw && assignments.find((a) => a.code === asgRaw) ? asgRaw : null;
    // Mô tả: tick → giá trị draft, bỏ tick → để rỗng
    const desc = confirmed.description ? draft.description?.trim() : "";
    try {
      await createTask.mutateAsync({
        title: draft.title.trim(),
        description: desc || null,
        priority: finalValue("priority"),
        // Chỉ giữ 1 trong 2: ưu tiên category nếu cả hai cùng có
        category_code: cat ?? null,
        assignment_code: cat ? null : (asg ?? null),
        due_date: finalValue("due_date"),
        status: "todo",
      });
      onClose(true);
    } catch {
      // hook đã toast
    }
  };

  // ===== UI states =====
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <X className="h-4 w-4" /> Không thể trích xuất task
        </div>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => onClose(false)}>Đóng</Button>
      </div>
    );
  }

  if (step === "extract" || !draft) {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>AI đang phân tích yêu cầu...</span>
      </div>
    );
  }

  // Helper render giá trị "preview" khi đã tick (giá trị AI đề xuất)
  const previewPriority = (
    <Badge variant="outline" className={PRIORITY_META[draft.priority].tone}>
      {PRIORITY_META[draft.priority].label}
    </Badge>
  );
  const previewDueDate = draft.due_date
    ? <span>{new Date(draft.due_date).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
    : <span className="text-muted-foreground italic">không đặt hạn</span>;
  const previewCategory = draft.category_code
    ? <span>{categories.find((c) => c.code === draft.category_code)?.name ?? draft.category_code}</span>
    : <span className="text-muted-foreground italic">không thuộc lĩnh vực cụ thể</span>;
  const previewAssignment = draft.assignment_code
    ? <span>{assignments.find((a) => a.code === draft.assignment_code)?.name ?? draft.assignment_code}</span>
    : <span className="text-muted-foreground italic">không phải kiêm nhiệm</span>;

  // ===== Step 2: Checklist xác nhận từng trường =====
  if (step === "checklist") {
    type Row = {
      key: string;
      preview: React.ReactNode;
      editor: React.ReactNode;
      defaultLabel: string;
    };
    const fieldRows: Row[] = [
      {
        key: "title",
        preview: <span className="font-medium break-words">{draft.title}</span>,
        editor: (
          <Input
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            className="h-8 text-sm"
            maxLength={200}
          />
        ),
        defaultLabel: "(bắt buộc)",
      },
      {
        key: "priority",
        preview: previewPriority,
        editor: (
          <Select value={draft.priority} onValueChange={(v) => update("priority", v as TaskPriority)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
        defaultLabel: "mặc định: Trung bình",
      },
      {
        key: "due_date",
        preview: previewDueDate,
        editor: (
          <Input
            type="datetime-local"
            value={toLocalInput(draft.due_date)}
            onChange={(e) => update("due_date", fromLocalInput(e.target.value))}
            className="h-8 text-sm"
          />
        ),
        defaultLabel: "mặc định: không đặt hạn",
      },
      {
        key: "category_code",
        preview: previewCategory,
        editor: (
          <Select
            value={draft.category_code ?? "none"}
            onValueChange={(v) => {
              update("category_code", v === "none" ? null : v);
              if (v !== "none") update("assignment_code", null);
            }}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Không —</SelectItem>
              {categories.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ),
        defaultLabel: "mặc định: không gán lĩnh vực",
      },
      {
        key: "assignment_code",
        preview: previewAssignment,
        editor: (
          <Select
            value={draft.assignment_code ?? "none"}
            onValueChange={(v) => {
              update("assignment_code", v === "none" ? null : v);
              if (v !== "none") update("category_code", null);
            }}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Không —</SelectItem>
              {assignments.map((a) => <SelectItem key={a.code} value={a.code}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ),
        defaultLabel: "mặc định: không kiêm nhiệm",
      },
    ];

    const canCreate = !!draft.title.trim() && !createTask.isPending;

    return (
      <div className="rounded-lg border border-accent/40 bg-card p-3 space-y-3 shadow-sm">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            AI đã tự động phân tích và <strong className="text-foreground">tick sẵn</strong> các trường. Bấm <strong className="text-foreground">"Tạo task"</strong> để dùng nguyên đề xuất, hoặc bỏ tick để dùng giá trị mặc định / sửa trực tiếp.
            {draft.clarifying_question && (
              <p className="mt-1 italic">💭 {draft.clarifying_question}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {fieldRows.map((row) => {
            const isConfirmed = !!confirmed[row.key];
            const isTitle = row.key === "title";
            return (
              <div
                key={row.key}
                className={`rounded-md border p-2 transition-colors ${
                  isConfirmed ? "border-success/40 bg-success/5" : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={`cf-${row.key}`}
                    checked={isConfirmed}
                    onCheckedChange={(v) => toggleConfirm(row.key, !!v)}
                    disabled={isTitle}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label htmlFor={`cf-${row.key}`} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {FIELD_LABEL[row.key]}
                      <span className="text-[10px] text-muted-foreground/70">· {row.defaultLabel}</span>
                    </Label>
                    {isConfirmed ? (
                      <div className="text-sm break-words">{row.preview}</div>
                    ) : (
                      isTitle ? row.editor : (
                        <div className="text-xs italic text-muted-foreground">
                          → sẽ dùng {row.defaultLabel.replace(/^mặc định:\s*/, "")}
                        </div>
                      )
                    )}
                  </div>
                  {isConfirmed && !isTitle && (
                    <button
                      type="button"
                      onClick={() => toggleConfirm(row.key, false)}
                      className="text-xs text-muted-foreground hover:text-foreground p-1"
                      title="Bỏ tick để dùng mặc định"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {/* Editor inline khi đang tick — cho phép sửa nhanh giá trị AI đề xuất */}
                {isConfirmed && !isTitle && (
                  <div className="mt-2 pl-6">
                    {row.editor}
                  </div>
                )}
              </div>
            );
          })}

          {/* Mô tả: textarea riêng, có checkbox để bỏ */}
          <div className={`rounded-md border p-2 space-y-1 transition-colors ${
            confirmed.description ? "border-success/40 bg-success/5" : "border-border bg-muted/20"
          }`}>
            <div className="flex items-start gap-2">
              <Checkbox
                id="cf-description"
                checked={!!confirmed.description}
                onCheckedChange={(v) => toggleConfirm("description", !!v)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor="cf-description" className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {FIELD_LABEL.description}
                  <span className="text-[10px] text-muted-foreground/70">· mặc định: để trống</span>
                </Label>
                {confirmed.description ? (
                  <Textarea
                    value={draft.description}
                    onChange={(e) => update("description", e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                    placeholder="Mô tả chi tiết task..."
                  />
                ) : (
                  <div className="text-xs italic text-muted-foreground">→ sẽ để trống</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" className="h-8" onClick={() => onClose(false)}>
            Huỷ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setStep("review")}
            title="Xem trước task trước khi tạo"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" /> Xem trước
          </Button>
          <Button
            size="sm"
            className="h-8 flex-1"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            {createTask.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Đang tạo...</>
            ) : (
              <><Check className="h-3.5 w-3.5 mr-1.5" /> Tạo task ngay</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ===== Step 3: Review preview cuối cùng (tuỳ chọn) =====
  // Hiển thị các giá trị "thực" sẽ được tạo (đã áp dụng default cho ô bỏ tick)
  const previewFinal = {
    priority: finalValue("priority"),
    due_date: finalValue("due_date"),
    category_code: finalValue("category_code"),
    assignment_code: finalValue("assignment_code"),
    description: confirmed.description ? draft.description : "",
  };
  // Đảm bảo chỉ 1 trong 2 code
  const finalCategory = previewFinal.category_code;
  const finalAssignment = finalCategory ? null : previewFinal.assignment_code;

  return (
    <div className="rounded-lg border border-accent/60 bg-accent/5 p-3 space-y-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ListTodo className="h-4 w-4 text-accent" />
        Xem trước task — xác nhận để tạo
      </div>

      <div className="rounded-md border bg-card p-3 space-y-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tiêu đề</p>
          <p className="text-sm font-semibold break-words">{draft.title}</p>
        </div>
        {previewFinal.description && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Mô tả</p>
            <p className="text-xs whitespace-pre-wrap break-words">{previewFinal.description}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className={PRIORITY_META[previewFinal.priority].tone}>
            {PRIORITY_META[previewFinal.priority].label}
          </Badge>
          {previewFinal.due_date && (
            <Badge variant="outline" className="text-[10px]">
              Hạn: {new Date(previewFinal.due_date).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
            </Badge>
          )}
          {finalCategory && (
            <Badge variant="outline" className="text-[10px]">
              Lĩnh vực: {categories.find((c) => c.code === finalCategory)?.name ?? finalCategory}
            </Badge>
          )}
          {finalAssignment && (
            <Badge variant="outline" className="text-[10px]">
              Kiêm nhiệm: {assignments.find((a) => a.code === finalAssignment)?.name ?? finalAssignment}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={() => setStep("checklist")}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Sửa lại
        </Button>
        <Button
          size="sm"
          className="h-8 flex-1"
          disabled={createTask.isPending}
          onClick={handleCreate}
        >
          {createTask.isPending ? (
            <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Đang tạo...</>
          ) : (
            <><Check className="h-3.5 w-3.5 mr-1.5" /> Xác nhận tạo task</>
          )}
        </Button>
      </div>
    </div>
  );
}
