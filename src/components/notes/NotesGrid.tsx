import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Search, X } from "lucide-react";
import { useAllTags, useNotes } from "@/hooks/useNotes";
import { NoteCard } from "./NoteCard";
import { NoteEditorDialog } from "./NoteEditorDialog";

interface Props {
  categoryCode?: string;
  assignmentCode?: string;
  title?: string;
}

export function NotesGrid({ categoryCode, assignmentCode, title = "Ghi chú" }: Props) {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: notes, isLoading } = useNotes({
    category_code: categoryCode,
    assignment_code: assignmentCode,
    search,
    tag,
  });
  const { data: tags } = useAllTags();

  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [asgMap, setAsgMap] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const [c, a] = await Promise.all([
        supabase.from("categories").select("code,name"),
        supabase.from("assignments").select("code,name"),
      ]);
      if (c.data) setCatMap(Object.fromEntries(c.data.map((r) => [r.code, r.name])));
      if (a.data) setAsgMap(Object.fromEntries(a.data.map((r) => [r.code, r.name])));
    })();
  }, []);

  const visibleTags = useMemo(() => (tags ?? []).slice(0, 12), [tags]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> {title}
          </h2>
          <p className="text-sm text-muted-foreground">{notes?.length ?? 0} ghi chú</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Ghi chú mới
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc nội dung..."
            className="pl-9"
          />
        </div>
        {tag && (
          <Button variant="outline" size="sm" onClick={() => setTag(undefined)}>
            #{tag} <X className="h-3 w-3 ml-1.5" />
          </Button>
        )}
      </div>

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((t) => (
            <Badge
              key={t}
              variant={tag === t ? "default" : "secondary"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => setTag(tag === t ? undefined : t)}
            >
              #{t}
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !notes?.length ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Chưa có ghi chú nào</p>
          <p className="text-xs text-muted-foreground mt-1">Bắt đầu ghi nhận thông tin nhanh, biên bản, ý tưởng...</p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Tạo ghi chú đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              categoryName={n.category_code ? catMap[n.category_code] : undefined}
              assignmentName={n.assignment_code ? asgMap[n.assignment_code] : undefined}
            />
          ))}
        </div>
      )}

      <NoteEditorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCategoryCode={categoryCode}
        defaultAssignmentCode={assignmentCode}
      />
    </div>
  );
}
