import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  AI_MODELS,
  AISettings,
  DEFAULT_AI_SETTINGS,
  TONE_OPTIONS,
  useAISettings,
} from "@/hooks/useAISettings";
import { Bot, RotateCcw, Save, Sparkles, User, History } from "lucide-react";

export default function AISettingsPage() {
  const { settings, isLoading, update, isSaving, reset, isResetting } = useAISettings();
  const [draft, setDraft] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(settings);
    setDirty(false);
  }, [settings]);

  const patch = (p: Partial<AISettings>) => {
    setDraft((d) => ({ ...d, ...p }));
    setDirty(true);
  };

  const onSave = async () => {
    try {
      await update(draft);
      toast({ title: "Đã lưu cài đặt AI" });
      setDirty(false);
    } catch (e) {
      toast({
        title: "Lưu thất bại",
        description: e instanceof Error ? e.message : "Lỗi không xác định",
        variant: "destructive",
      });
    }
  };

  const onReset = async () => {
    try {
      await reset();
      toast({ title: "Đã khôi phục mặc định" });
    } catch (e) {
      toast({
        title: "Khôi phục thất bại",
        description: e instanceof Error ? e.message : "Lỗi không xác định",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Cài đặt Trợ lý AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tuỳ chỉnh model, phong cách và bối cảnh để AI trả lời sát với nhu cầu của anh.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReset} disabled={isResetting}>
              <RotateCcw className="h-4 w-4" />
              Khôi phục mặc định
            </Button>
            <Button onClick={onSave} disabled={!dirty || isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </header>

        {/* Model + temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" /> Model & độ sáng tạo
            </CardTitle>
            <CardDescription>
              Model mạnh hơn = chất lượng tốt hơn nhưng chi phí cao hơn. Mặc định Gemini 2.5 Flash phù hợp đa số.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Model AI</Label>
              <Select value={draft.model} onValueChange={(v) => patch({ model: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs text-muted-foreground">{m.hint}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Độ sáng tạo (temperature)</Label>
                <span className="text-sm font-mono text-primary">{draft.temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[draft.temperature]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={(v) => patch({ temperature: v[0] })}
              />
              <p className="text-xs text-muted-foreground">
                0 = trả lời chính xác, lặp lại được. 1 = cân bằng. 2 = sáng tạo cao, có thể "bịa".
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Phong cách */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" /> Phong cách trả lời
            </CardTitle>
            <CardDescription>Chọn cách AI giao tiếp mặc định.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TONE_OPTIONS.map((t) => {
                const active = draft.tone === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => patch({ tone: t.value })}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                  >
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Tự động đề xuất tạo task</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Khi tắt, AI chỉ đề xuất tạo task khi anh yêu cầu rõ ràng.
                </p>
              </div>
              <Switch
                checked={draft.auto_create_tasks}
                onCheckedChange={(v) => patch({ auto_create_tasks: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ngữ cảnh cá nhân */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Ngữ cảnh cá nhân
            </CardTitle>
            <CardDescription>
              Thông tin anh muốn AI luôn nhớ — sẽ được chèn vào mọi cuộc trò chuyện.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Bối cảnh cá nhân</Label>
              <Textarea
                rows={4}
                placeholder="Ví dụ: Tôi đang phụ trách an toàn hàng hải và đầu tư xây dựng. Ưu tiên báo cáo theo tuần."
                value={draft.personal_context}
                onChange={(e) => patch({ personal_context: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Chỉ dẫn hệ thống tuỳ chỉnh (nâng cao)</Label>
              <Textarea
                rows={5}
                placeholder="Ví dụ: Khi trả lời số liệu tài chính, luôn quy đổi sang tỷ VND. Khi nhắc văn bản pháp lý, nêu cả số hiệu và ngày ban hành."
                value={draft.custom_system_prompt}
                onChange={(e) => patch({ custom_system_prompt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Chỉ dẫn này được thêm vào sau system prompt mặc định. Để trống nếu không cần.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lịch sử */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" /> Lịch sử hội thoại
            </CardTitle>
            <CardDescription>Số tin nhắn cũ AI đọc lại để giữ ngữ cảnh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Số tin nhắn ngữ cảnh tối đa</Label>
                <span className="text-sm font-mono text-primary">{draft.max_history}</span>
              </div>
              <Slider
                value={[draft.max_history]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => patch({ max_history: v[0] })}
              />
              <p className="text-xs text-muted-foreground">
                0 = không giữ lịch sử (mỗi câu hỏi là cuộc trò chuyện mới). 20 = mặc định, đủ cho hầu hết tình huống.
                Cao hơn = chính xác hơn nhưng tốn tín dụng AI.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pb-4">
          <Button variant="outline" onClick={onReset} disabled={isResetting}>
            <RotateCcw className="h-4 w-4" />
            Khôi phục mặc định
          </Button>
          <Button onClick={onSave} disabled={!dirty || isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
