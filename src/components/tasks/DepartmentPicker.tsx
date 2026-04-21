import { useEffect, useMemo, useState } from "react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Plus, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDepartments, useCreateDepartment, useDeleteDepartment,
} from "@/hooks/useDepartments";

interface Props {
  value: string[]; // department codes
  onChange: (codes: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DepartmentPicker({ value, onChange, placeholder = "Chọn bộ phận xử lý...", disabled }: Props) {
  const { data: departments = [], isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const byCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.code, d.name);
    return m;
  }, [departments]);

  // Drop selected codes that no longer exist (e.g. deleted)
  useEffect(() => {
    if (!departments.length) return;
    const valid = value.filter((c) => byCode.has(c));
    if (valid.length !== value.length) onChange(valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  const toggle = (code: string) => {
    if (value.includes(code)) onChange(value.filter((c) => c !== code));
    else onChange([...value, code]);
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;
    try {
      const created = await createDept.mutateAsync(name);
      onChange([...value, created.code]);
      setSearch("");
    } catch {
      // toast handled in hook
    }
  };

  const exactMatch = departments.some((d) => d.name.toLowerCase() === search.trim().toLowerCase());
  const canCreate = search.trim().length > 0 && !exactMatch;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn("w-full justify-between font-normal", value.length === 0 && "text-muted-foreground")}
          >
            <span className="truncate">
              {value.length === 0 ? placeholder : `Đã chọn ${value.length} bộ phận`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[280px]" align="start">
          <Command shouldFilter>
            <CommandInput
              placeholder="Tìm hoặc gõ bộ phận mới..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">Đang tải...</div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="py-3 text-xs text-muted-foreground">Chưa có bộ phận nào.</div>
                  </CommandEmpty>
                  {departments.length > 0 && (
                    <CommandGroup heading="Danh sách bộ phận">
                      {departments.map((d) => {
                        const selected = value.includes(d.code);
                        return (
                          <CommandItem
                            key={d.code}
                            value={d.name}
                            onSelect={() => toggle(d.code)}
                            className="flex items-center gap-2"
                          >
                            <Check className={cn("h-4 w-4", selected ? "opacity-100 text-primary" : "opacity-0")} />
                            <span className="flex-1 truncate">{d.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Xoá "${d.name}" khỏi danh sách bộ phận?`)) {
                                  deleteDept.mutate(d.id);
                                }
                              }}
                              className="opacity-50 hover:opacity-100 hover:text-destructive transition-opacity"
                              title="Xoá khỏi danh sách"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                  {canCreate && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          value={`__create__${search}`}
                          onSelect={handleCreate}
                          disabled={createDept.isPending}
                        >
                          {createDept.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2 text-primary" />
                          )}
                          <span>Thêm bộ phận: <strong>"{search.trim()}"</strong></span>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <Badge key={code} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
              <span className="text-xs">{byCode.get(code) ?? code}</span>
              <button
                type="button"
                onClick={() => toggle(code)}
                className="hover:text-destructive p-0.5"
                aria-label="Bỏ chọn"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
