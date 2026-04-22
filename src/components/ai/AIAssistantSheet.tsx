import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Send, Loader2, Trash2, ListTodo, FileText, BarChart3, CalendarDays } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "chat" | "create_task" | "summarize" | "analyze" | "weekly_plan";

interface AIAssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_ACTIONS: { mode: Mode; label: string; icon: any; placeholder: string }[] = [
  { mode: "create_task", label: "Tạo task", icon: ListTodo, placeholder: "Mô tả công việc cần tạo... (vd: Tuần sau họp hội đồng an toàn lao động, chuẩn bị báo cáo Q1)" },
  { mode: "summarize", label: "Tóm tắt", icon: FileText, placeholder: "Dán nội dung cần tóm tắt..." },
  { mode: "analyze", label: "Phân tích", icon: BarChart3, placeholder: "Dán nội dung báo cáo cần phân tích..." },
  { mode: "weekly_plan", label: "Kế hoạch tuần", icon: CalendarDays, placeholder: "Mô tả các đầu việc tuần này, AI sẽ xếp lịch..." },
];

export function AIAssistantSheet({ open, onOpenChange }: AIAssistantSheetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [conversationId] = useState<string>(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load lịch sử khi mở lần đầu
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("ai_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data.filter((m) => m.role !== "system").map((m) => ({ role: m.role as any, content: m.content })));
        }
      });
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const persistMessage = async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    await supabase.from("ai_messages").insert({
      user_id: user.id,
      conversation_id: conversationId,
      role,
      content,
    });
  };

  const send = async (text?: string, useMode: Mode = mode) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Msg = { role: "user", content };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    persistMessage("user", content);

    let assistant = "";
    const upsert = (chunk: string) => {
      assistant += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistant } : m));
        }
        return [...prev, { role: "assistant", content: assistant }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          mode: useMode,
        }),
      });

      if (resp.status === 429) { toast.error("Đã vượt giới hạn yêu cầu AI, thử lại sau ít phút"); setLoading(false); return; }
      if (resp.status === 402) { toast.error("Hết tín dụng AI - cần nạp thêm trong Lovable workspace"); setLoading(false); return; }
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Trợ lý AI
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
        <ScrollArea className="flex-1 px-5 py-4" ref={scrollRef as any}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-12">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-accent/60" />
              <p className="font-medium text-foreground mb-1">Xin chào Phó Giám đốc</p>
              <p>Chọn một lệnh nhanh hoặc gõ câu hỏi bên dưới.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={m.role === "user" ? "bg-primary text-primary-foreground text-xs" : "bg-accent/20 text-accent text-xs"}>
                      {m.role === "user" ? "PQG" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-headings:my-2 prose-pre:my-2">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent/20 text-accent text-xs">AI</AvatarFallback></Avatar>
                  <div className="rounded-lg px-3 py-2 bg-muted text-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang soạn...
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Composer */}
        <div className="border-t p-3 space-y-2">
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
            <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-10 w-10 shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
