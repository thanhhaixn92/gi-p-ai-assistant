import { Button } from "@/components/ui/button";
import { ListTodo, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateNote } from "@/hooks/useNotes";
import { toast } from "sonner";

interface Props {
  raw: string;
  onCreateTask?: (prompt: string) => void;
}

type Action =
  | { type: "create_task"; payload: string }
  | { type: "create_note"; title: string; content: string }
  | { type: "open"; path: string };

function parseActions(raw: string): Action[] {
  const acts: Action[] = [];
  raw.split("\n").map((l) => l.trim()).filter(Boolean).forEach((line) => {
    // bỏ "- " hoặc "* " đầu dòng
    const cleaned = line.replace(/^[-*]\s*/, "");
    const ct = cleaned.match(/^create_task\s*:\s*(.+)$/i);
    if (ct) { acts.push({ type: "create_task", payload: ct[1].trim() }); return; }
    const cn = cleaned.match(/^create_note\s*:\s*(.+)$/i);
    if (cn) {
      const [titlePart, ...rest] = cn[1].split("|");
      acts.push({
        type: "create_note",
        title: titlePart.trim(),
        content: rest.join("|").trim(),
      });
      return;
    }
    const op = cleaned.match(/^open\s*:\s*(\/\S+)$/i);
    if (op) { acts.push({ type: "open", path: op[1].trim() }); return; }
  });
  return acts;
}

export function AIActionButtons({ raw, onCreateTask }: Props) {
  const navigate = useNavigate();
  const createNote = useCreateNote();
  const actions = parseActions(raw);
  if (actions.length === 0) return null;

  const handle = async (a: Action) => {
    if (a.type === "create_task") {
      onCreateTask?.(a.payload);
    } else if (a.type === "create_note") {
      try {
        await createNote.mutateAsync({
          title: a.title || "Ghi chú từ AI",
          content: a.content || a.title,
          tags: ["ai"],
          is_pinned: false,
          category_code: null,
          assignment_code: null,
        });
      } catch {
        // toast handled by hook
      }
    } else if (a.type === "open") {
      navigate(a.path);
      toast.success(`Mở ${a.path}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 my-2">
      {actions.map((a, i) => {
        let label = "";
        let Icon = ArrowRight;
        if (a.type === "create_task") { label = `Tạo task: ${a.payload.slice(0, 40)}${a.payload.length > 40 ? "…" : ""}`; Icon = ListTodo; }
        else if (a.type === "create_note") { label = `Lưu ghi chú: ${a.title.slice(0, 40)}${a.title.length > 40 ? "…" : ""}`; Icon = FileText; }
        else if (a.type === "open") { label = `Mở ${a.path}`; Icon = ArrowRight; }
        return (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="h-8 text-xs border-accent/40 hover:bg-accent/10"
            onClick={() => handle(a)}
          >
            <Icon className="h-3.5 w-3.5 mr-1.5 text-accent" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
