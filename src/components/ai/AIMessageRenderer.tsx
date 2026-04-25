import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { AIChecklistBlock } from "./AIChecklistBlock";
import { AITableBlock } from "./AITableBlock";
import { AIActionButtons } from "./AIActionButtons";
import { toast } from "sonner";
import { useTaxonomies, prettifyCodes } from "@/hooks/useTaxonomies";

type BlockType = "summary" | "checklist" | "table" | "actions" | "cite" | "text";

interface Block {
  type: BlockType;
  content: string;
}

const FENCE_RE = /```(summary|checklist|table|actions|cite)\s*\n([\s\S]*?)```/g;

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(content)) !== null) {
    if (m.index > lastIdx) {
      const txt = content.slice(lastIdx, m.index).trim();
      if (txt) blocks.push({ type: "text", content: txt });
    }
    blocks.push({ type: m[1] as BlockType, content: m[2].trim() });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < content.length) {
    const txt = content.slice(lastIdx).trim();
    if (txt) blocks.push({ type: "text", content: txt });
  }
  return blocks;
}

interface Props {
  content: string;
  isStreaming?: boolean;
  onCreateTask?: (prompt: string) => void;
}

const LONG_THRESHOLD = 800;

function CodeWithCopy({ children, className }: { children?: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const isBlock = className?.includes("language-") || String(children).includes("\n");
  if (!isBlock) {
    return <code className="px-1 py-0.5 rounded bg-muted text-[0.85em] break-words">{children}</code>;
  }
  const text = String(children).replace(/\n$/, "");
  return (
    <div className="relative group my-2">
      <pre className="rounded-md bg-muted/70 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words border border-border">
        <code>{text}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded p-1 hover:bg-accent/10"
        title="Sao chép"
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
      </button>
    </div>
  );
}

export function AIMessageRenderer({ content, isStreaming, onCreateTask }: Props) {
  const { data: tax } = useTaxonomies();
  const codeMap = useMemo(() => tax?.codeToName ?? new Map<string, string>(), [tax?.codeToName]);

  // Prettify mã code → tên tiếng Việt cho mọi nội dung văn bản (trừ block actions giữ path)
  const prettyContent = useMemo(() => prettifyCodes(content, codeMap), [content, codeMap]);
  const blocks = useMemo(() => parseBlocks(prettyContent), [prettyContent]);
  const [expanded, setExpanded] = useState(false);

  if (!content) {
    return <span className="text-muted-foreground italic text-sm">đang xử lý…</span>;
  }

  // Nếu rất dài và chưa expanded → chỉ render phần đầu
  const isLong = prettyContent.length > LONG_THRESHOLD;
  const visibleContent = isLong && !expanded ? prettyContent.slice(0, LONG_THRESHOLD) : prettyContent;
  const visibleBlocks = isLong && !expanded ? parseBlocks(visibleContent) : blocks;

  const handleCopyText = () => {
    navigator.clipboard.writeText(prettyContent);
    toast.success("Đã sao chép");
  };

  const markdownComponents: Components = {
    code: CodeWithCopy,
    pre: ({ children }) => <>{children}</>,
  };

  return (
    <div className="space-y-1">
      {visibleBlocks.map((b, i) => {
        if (b.type === "summary") {
          return (
            <div
              key={i}
              className="rounded-lg border border-accent/40 bg-gradient-to-br from-accent/10 to-primary/5 p-3 my-1"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <Badge variant="outline" className="text-[10px] h-5 border-accent/50 text-accent">
                  TÓM TẮT
                </Badge>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0.5 prose-p:text-sm prose-strong:text-foreground text-foreground">
                <ReactMarkdown>{b.content}</ReactMarkdown>
              </div>
            </div>
          );
        }
        if (b.type === "checklist") {
          return <AIChecklistBlock key={i} raw={b.content} onCreateTask={onCreateTask} />;
        }
        if (b.type === "table") {
          return <AITableBlock key={i} raw={b.content} />;
        }
        if (b.type === "actions") {
          return <AIActionButtons key={i} raw={b.content} onCreateTask={onCreateTask} />;
        }
        if (b.type === "cite") {
          return (
            <div
              key={i}
              className="flex items-start gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 my-2 text-[11px] italic text-muted-foreground"
            >
              <BookOpen className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="break-words">{b.content}</span>
            </div>
          );
        }
        // text block
        return (
          <div
            key={i}
            className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2 prose-pre:my-0 [&_*]:max-w-full [&_table]:block [&_table]:overflow-x-auto"
          >
            <ReactMarkdown components={markdownComponents}>
              {b.content}
            </ReactMarkdown>
          </div>
        );
      })}

      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-accent/70 animate-pulse ml-0.5 align-middle" />
      )}

      {isLong && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3 mr-1" /> Thu gọn</>
            ) : (
              <><ChevronDown className="h-3 w-3 mr-1" /> Mở rộng ({prettyContent.length - LONG_THRESHOLD} ký tự)</>
            )}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopyText}>
            <Copy className="h-3 w-3 mr-1" /> Sao chép
          </Button>
        </div>
      )}
    </div>
  );
}
