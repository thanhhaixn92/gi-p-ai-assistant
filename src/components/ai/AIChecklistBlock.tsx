import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks } from "lucide-react";

interface Props {
  raw: string;
  onCreateTask?: (title: string) => void;
}

interface Item {
  text: string;
  initialChecked: boolean;
}

function parseChecklist(raw: string): Item[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      // Hỗ trợ "[ ] ...", "[x] ...", "- [ ] ...", "* [ ] ...", "1. [ ] ..."
      const m = line.match(/^(?:[-*]|\d+\.)?\s*\[([ xX])\]\s*(.+)$/);
      if (m) return { text: m[2].trim(), initialChecked: m[1].toLowerCase() === "x" };
      // fallback: dòng gạch đầu dòng thường
      const m2 = line.match(/^(?:[-*]|\d+\.)\s*(.+)$/);
      if (m2) return { text: m2[1].trim(), initialChecked: false };
      return { text: line, initialChecked: false };
    });
}

export function AIChecklistBlock({ raw, onCreateTask }: Props) {
  const items = parseChecklist(raw);
  const [checked, setChecked] = useState<boolean[]>(() => items.map((i) => i.initialChecked));

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 my-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
        <ListChecks className="h-3.5 w-3.5 text-accent" />
        Việc cần làm
      </div>
      <ul className="space-y-1.5">
        {items.map((it, idx) => {
          const isChecked = checked[idx];
          return (
            <li key={idx} className="flex items-start gap-2 group">
              <Checkbox
                id={`cl-${idx}`}
                checked={isChecked}
                onCheckedChange={(v) =>
                  setChecked((prev) => prev.map((c, i) => (i === idx ? !!v : c)))
                }
                className="mt-0.5"
              />
              <label
                htmlFor={`cl-${idx}`}
                className={`flex-1 text-sm cursor-pointer break-words ${
                  isChecked ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {it.text}
              </label>
              {onCreateTask && !isChecked && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => onCreateTask(it.text)}
                  title="Tạo task từ dòng này"
                >
                  <Plus className="h-3 w-3 mr-0.5" /> Task
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
