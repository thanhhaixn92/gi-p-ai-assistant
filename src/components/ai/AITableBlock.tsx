import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table2 } from "lucide-react";

interface Props {
  raw: string;
}

function parseTable(raw: string): { headers: string[]; rows: string[][] } | null {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  // Hỗ trợ cả TSV (\t), pipe-table (| a | b |), và CSV đơn giản (,)
  const detectSep = (line: string): string => {
    if (line.includes("\t")) return "\t";
    if (line.includes("|")) return "|";
    if (line.includes(",")) return ",";
    return "\t";
  };

  const sep = detectSep(lines[0]);
  const split = (l: string) => {
    const parts = l.split(sep).map((c) => c.trim());
    if (sep === "|") {
      // bỏ ô rỗng đầu/cuối do "| a | b |"
      if (parts.length && parts[0] === "") parts.shift();
      if (parts.length && parts[parts.length - 1] === "") parts.pop();
    }
    return parts;
  };

  const headers = split(lines[0]);
  const bodyLines = lines.slice(1).filter((l) => !/^[|:\s-]+$/.test(l)); // bỏ dòng "|---|---|"
  const rows = bodyLines.map(split);
  if (headers.length === 0) return null;
  return { headers, rows };
}

export function AITableBlock({ raw }: Props) {
  const parsed = parseTable(raw);
  if (!parsed) return null;
  const { headers, rows } = parsed;

  return (
    <div className="rounded-lg border border-border bg-card/50 my-2 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <Table2 className="h-3.5 w-3.5 text-accent" />
        Bảng dữ liệu
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i} className="text-xs font-semibold text-foreground">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri}>
                {headers.map((_, ci) => (
                  <TableCell key={ci} className="text-xs py-2">
                    {row[ci] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
