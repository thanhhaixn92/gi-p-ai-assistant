import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react";
import type { Note } from "@/types/note";
import { useDeleteNote, useUpdateNote } from "@/hooks/useNotes";
import { NoteEditorDialog } from "./NoteEditorDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  note: Note;
  categoryName?: string;
  assignmentName?: string;
}

export function NoteCard({ note, categoryName, assignmentName }: Props) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const update = useUpdateNote();
  const del = useDeleteNote();

  const togglePin = () => update.mutate({ id: note.id, patch: { is_pinned: !note.is_pinned } });

  const handleDelete = () => {
    if (window.confirm(`Xoá ghi chú "${note.title}"?`)) del.mutate(note.id);
  };

  const goDetail = () => navigate(`/ghi-chu/${note.id}`);

  const updated = new Date(note.updated_at).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={goDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goDetail();
          }
        }}
        className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow group cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {note.is_pinned && <Pin className="h-3.5 w-3.5 text-accent fill-accent shrink-0" />}
              <h3 className="font-semibold text-sm leading-tight truncate">{note.title}</h3>
            </div>
            <p className="text-[11px] text-muted-foreground">Cập nhật {updated}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}>
                <Pencil className="h-4 w-4 mr-2" /> Sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(); }}>
                {note.is_pinned
                  ? <><PinOff className="h-4 w-4 mr-2" /> Bỏ ghim</>
                  : <><Pin className="h-4 w-4 mr-2" /> Ghim đầu</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {note.content.trim() && (
          <div className="text-xs text-muted-foreground line-clamp-4 prose prose-xs max-w-none [&_*]:!text-xs [&_*]:!my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content.length > 280 ? note.content.slice(0, 280) + "..." : note.content}
            </ReactMarkdown>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto">
          {(note.tags ?? []).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">#{t}</Badge>
          ))}
          {categoryName && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">
              {categoryName}
            </Badge>
          )}
          {assignmentName && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/40 text-accent">
              {assignmentName}
            </Badge>
          )}
        </div>
      </Card>

      <NoteEditorDialog open={editOpen} onOpenChange={setEditOpen} note={note} />
    </>
  );
}
