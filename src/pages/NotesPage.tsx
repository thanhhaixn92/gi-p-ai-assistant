import { AppLayout } from "@/components/layout/AppLayout";
import { NotesGrid } from "@/components/notes/NotesGrid";

export default function NotesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Ghi chú</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toàn bộ ghi chú nhanh, biên bản, ý tưởng theo các lĩnh vực và chức danh kiêm nhiệm.
          </p>
        </header>
        <NotesGrid title="Tất cả ghi chú" />
      </div>
    </AppLayout>
  );
}
