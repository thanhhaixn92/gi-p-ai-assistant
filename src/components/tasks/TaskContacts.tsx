import { useState } from "react";
import { useTaskContacts, useAddTaskContact, useDeleteTaskContact } from "@/hooks/useTaskContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Phone, Plus, Trash2, User2, Loader2 } from "lucide-react";

interface Props { taskId: string }

export function TaskContacts({ taskId }: Props) {
  const { data: contacts = [], isLoading } = useTaskContacts(taskId);
  const add = useAddTaskContact(taskId);
  const del = useDeleteTaskContact(taskId);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const reset = () => { setName(""); setRole(""); setPhone(""); setEmail(""); setNote(""); };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await add.mutateAsync({ name, role, phone, email, note });
      reset();
      setOpen(false);
    } catch { /* toast in hook */ }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Liên hệ liên quan ({contacts.length})</Label>
        {!open && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm liên hệ
          </Button>
        )}
      </div>

      {open && (
        <Card className="p-3 space-y-2 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Họ tên *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Chức vụ / Đơn vị</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Trưởng phòng KT" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SĐT</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912xxxxxx" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@vd.vn" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ghi chú</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Vai trò trong việc..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => { reset(); setOpen(false); }}>Huỷ</Button>
            <Button type="button" size="sm" onClick={handleAdd} disabled={add.isPending || !name.trim()}>
              {add.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              Lưu
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Đang tải...</p>
      ) : contacts.length === 0 && !open ? (
        <p className="text-xs text-muted-foreground italic">Chưa có liên hệ.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <Card key={c.id} className="p-2.5 flex items-start gap-2 group">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium leading-tight truncate">
                  {c.name}
                  {c.role && <span className="text-xs text-muted-foreground font-normal"> · {c.role}</span>}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3 w-3" /> {c.email}
                    </a>
                  )}
                </div>
                {c.note && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.note}</p>}
              </div>
              <Button
                type="button" variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() => { if (confirm(`Xoá liên hệ "${c.name}"?`)) del.mutate(c.id); }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
