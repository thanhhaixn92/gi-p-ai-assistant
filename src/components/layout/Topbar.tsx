import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, Plus, Search, Sparkles, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { AIAssistantSheet } from "@/components/ai/AIAssistantSheet";
import { toast } from "sonner";

export function Topbar() {
  const { user, signOut } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-2 sm:gap-4 border-b bg-background/80 backdrop-blur px-3 sm:px-4">
      <SidebarTrigger className="shrink-0" />

      <div className="flex-1 max-w-xl relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm task, ghi chú, lĩnh vực..."
          className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4" />
      </Button>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      <Button size="sm" className="hidden md:inline-flex" onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" /> Tạo task
      </Button>

      <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => setAiOpen(true)}>
        <Sparkles className="h-4 w-4 mr-1.5 text-accent" /> AI
      </Button>

      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setAiOpen(true)}>
        <Sparkles className="h-4 w-4 text-accent" />
      </Button>

      <AIAssistantSheet open={aiOpen} onOpenChange={setAiOpen} />

      <Button variant="ghost" size="icon" onClick={() => toast.info("Chưa có thông báo mới")}>
        <Bell className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 px-1.5 gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">PQG</AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline text-sm font-medium">Phạm Quang Giáp</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">Phạm Quang Giáp</span>
              <span className="text-xs text-muted-foreground font-normal truncate">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem><User className="h-4 w-4 mr-2" /> Hồ sơ</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
