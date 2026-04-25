import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Send, Trash2, ListTodo, FileText, BarChart3, CalendarDays, Mic, Loader2, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AITaskBuilder } from "./AITaskBuilder";
import { AIMessageRenderer } from "./AIMessageRenderer";

type Mode = "chat" | "create_task" | "summarize" | "analyze" | "weekly_plan";

type Msg =
  | { kind: "text"; role: "user" | "assistant"; content: string; ts?: number; streaming?: boolean }
  | { kind: "task_builder"; role: "assistant"; userPrompt: string; done?: boolean };

interface AIAssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_ACTIONS: { mode: Mode; label: string; icon: LucideIcon; placeholder: string }[] = [
  { mode: "create_task", label: "Tạo task", icon: ListTodo, placeholder: "Mô tả công việc cần tạo... (vd: Tuần sau họp hội đồng an toàn lao động, chuẩn bị báo cáo Q1)" },
  { mode: "summarize", label: "Tóm tắt", icon: FileText, placeholder: "Dán nội dung cần tóm tắt..." },
  { mode: "analyze", label: "Phân tích", icon: BarChart3, placeholder: "Dán nội dung báo cáo cần phân tích..." },
  { mode: "weekly_plan", label: "Kế hoạch tuần", icon: CalendarDays, placeholder: "Mô tả các đầu việc tuần này, AI sẽ xếp lịch..." },
];

const QUICK_REPLIES: { label: string; prompt: string }[] = [
  { label: "Phân tích sâu hơn", prompt: "Phân tích sâu hơn ý vừa rồi, bổ sung số liệu / căn cứ nếu có." },
  { label: "Tóm tắt ngắn lại", prompt: "Tóm tắt câu trả lời trên trong 3 gạch đầu dòng ngắn." },
  { label: "Đề xuất hành động", prompt: "Từ nội dung trên, đề xuất 3-5 hành động ưu tiên kèm task tạo nhanh." },
  { label: "Lập kế hoạch tuần", prompt: "Dựa trên nội dung trên, lập kế hoạch tuần dạng bảng." },
];

function formatTime(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function AIAssistantSheet({ open, onOpenChange }: AIAssistantSheetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [conversationId] = useState<string>(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load lịch sử text khi mở lần đầu
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(
            data
              .filter((m) => m.role !== "system")
              .map((m) => ({
                kind: "text",
                role: m.role as "user" | "assistant",
                content: m.content,
                ts: new Date(m.created_at).getTime(),
              })),
          );
        }
      });
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const persistMessage = async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    await supabase.from("ai_messages").insert({
      user_id: user.id,
      conversation_id: conversationId,
      role,
      content,
    });
  };

  const openTaskBuilder = (prompt: string) => {
    setMessages((p) => [
      ...p,
      { kind: "text", role: "user", content: prompt, ts: Date.now() },
      { kind: "task_builder", role: "assistant", userPrompt: prompt },
    ]);
    persistMessage("user", prompt);
  };

  const send = async (text?: string, useMode: Mode = mode) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Msg = { kind: "text", role: "user", content, ts: Date.now() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    persistMessage("user", content);

    if (useMode === "create_task") {
      setMessages((p) => [...p, { kind: "task_builder", role: "assistant", userPrompt: content }]);
      setMode("chat");
      return;
    }

    setLoading(true);
    let assistant = "";
    const startedAt = Date.now();
    const upsert = (chunk: string) => {
      assistant += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.kind === "text" && last.role === "assistant" && last.streaming) {
          return prev.map((m, i) =>
            i === prev.length - 1 && m.kind === "text" ? { ...m, content: assistant } : m,
          );
        }
        return [...prev, { kind: "text", role: "assistant", content: assistant, ts: startedAt, streaming: true }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const history = messages
        .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
        .map((m) => ({ role: m.role, content: m.content }));
      // Lấy access token thực của user để edge function biết user
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [...history, { role: "user", content }],
          mode: useMode,
        }),
      });

      if (resp.status === 429) { toast.error("Đã vượt giới hạn yêu cầu AI, thử lại sau ít phút"); setLoading(false); return; }
      if (resp.status === 402) { toast.error("Hết tín dụng AI - cần nạp thêm trong workspace"); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Lỗi gọi trợ lý AI"); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim()) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      // mark streaming = false
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.kind === "text" && m.streaming ? { ...m, streaming: false } : m,
        ),
      );

      if (assistant) persistMessage("assistant", assistant);
    } catch (err) {
      console.error(err);
      toast.error("Mất kết nối với trợ lý AI");
    } finally {
      setLoading(false);
      setMode("chat");
    }
  };

  const clearChat = async () => {
    if (!user) return;
    if (!confirm("Xoá toàn bộ lịch sử chat AI?")) return;
    await supabase.from("ai_messages").delete().eq("user_id", user.id);
    setMessages([]);
    toast.success("Đã xoá lịch sử");
  };

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.kind === "text" && m.role === "assistant" && !m.streaming) return i;
    }
    return -1;
  })();
  const latestMessage = messages[messages.length - 1];
  const showLoadingSkeleton = loading && latestMessage?.kind === "text" && !latestMessage.streaming;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold">Trợ lý AI</span>
                <span className="text-[10px] text-muted-foreground font-normal">Gemini 2.5 Flash</span>
              </div>
            </SheetTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Quick actions */}
        <div className="px-5 py-3 border-b grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((qa) => (
            <Button
              key={qa.mode}
              variant={mode === qa.mode ? "default" : "outline"}
              size="sm"
              className="justify-start h-9"
              onClick={() => { setMode(qa.mode); setInput(""); }}
            >
              <qa.icon className="h-4 w-4 mr-2" />
              {qa.label}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
          <div className="px-5 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-12">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Sparkles className="h-7 w-7 text-primary-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">Xin chào Phó Giám đốc</p>
                <p>Chọn một lệnh nhanh hoặc gõ câu hỏi bên dưới.</p>
                <p className="mt-2 text-xs">Mẹo: dùng <strong>Tạo task</strong> để AI hỗ trợ tạo task có xác nhận từng bước.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => {
                  if (m.kind === "task_builder") {
                    return (
                      <div key={i} className="flex gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {m.done ? (
                            <div className="rounded-lg border border-success/40 bg-success/5 px-3 py-2 text-sm text-foreground">
                              ✅ Đã tạo task thành công.
                            </div>
                          ) : (
                            <AITaskBuilder
                              userPrompt={m.userPrompt}
                              onClose={(created) => {
                                if (created) {
                                  setMessages((prev) =>
                                    prev.map((x, idx) =>
                                      idx === i && x.kind === "task_builder" ? { ...x, done: true } : x,
                                    ),
                                  );
                                } else {
                                  setMessages((prev) => prev.filter((_, idx) => idx !== i));
                                }
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  }

                  const isUser = m.role === "user";
                  const isLastAssistant = i === lastAssistantIdx;

                  return (
                    <div key={i} className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                      {isUser ? (
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">PQG</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`min-w-0 flex-1 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2 max-w-[88%] text-sm break-words overflow-hidden ${
                            isUser
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-card border border-border shadow-sm rounded-tl-sm w-full"
                          }`}
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap break-words">{m.content}</div>
                          ) : (
                            <AIMessageRenderer
                              content={m.content}
                              isStreaming={m.streaming}
                              onCreateTask={openTaskBuilder}
                            />
                          )}
                        </div>
                        <div className={`text-[10px] text-muted-foreground mt-1 px-1 ${isUser ? "text-right" : ""}`}>
                          {isUser ? formatTime(m.ts) : `${formatTime(m.ts)}${!m.streaming ? " · Gemini Flash" : ""}`}
                        </div>

                        {/* Quick replies dưới tin nhắn AI cuối cùng */}
                        {!isUser && isLastAssistant && !m.streaming && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {QUICK_REPLIES.map((qr) => (
                              <button
                                key={qr.label}
                                type="button"
                                onClick={() => send(qr.prompt, "chat")}
                                className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-background hover:bg-accent/10 hover:border-accent/40 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {qr.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {showLoadingSkeleton && (
                  <div className="flex gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-card border border-border shadow-sm flex-1 max-w-[88%] space-y-1.5">
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Composer */}
        <div className="border-t p-3 space-y-2 shrink-0">
          {mode !== "chat" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <span>Chế độ:</span>
              <span className="font-medium text-foreground">{QUICK_ACTIONS.find((q) => q.mode === mode)?.label}</span>
              <button onClick={() => setMode("chat")} className="ml-auto text-xs text-primary hover:underline">Huỷ</button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={mode !== "chat" ? QUICK_ACTIONS.find((q) => q.mode === mode)?.placeholder : "Hỏi trợ lý AI... (Shift+Enter xuống dòng)"}
              className="min-h-[60px] max-h-32 resize-none"
              disabled={loading}
            />
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-[28px] w-10"
                disabled
                title="Nhập bằng giọng nói (sắp ra mắt)"
              >
                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-[28px] w-10">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground px-1">
            💡 AI sẽ trả lời với <strong>Tóm tắt</strong>, <strong>Checklist tick được</strong>, <strong>Bảng</strong> & <strong>Nút hành động</strong> để anh thao tác nhanh.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
