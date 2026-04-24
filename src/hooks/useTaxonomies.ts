import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaxonomyItem {
  code: string;
  name: string;
}

/** Cache categories + assignments dùng chung cho các component AI */
export function useTaxonomies() {
  return useQuery({
    queryKey: ["taxonomies"],
    staleTime: 1000 * 60 * 30, // 30 phút
    queryFn: async () => {
      const [c, a] = await Promise.all([
        supabase.from("categories").select("code,name").order("sort_order"),
        supabase.from("assignments").select("code,name").order("sort_order"),
      ]);
      const categories = (c.data ?? []) as TaxonomyItem[];
      const assignments = (a.data ?? []) as TaxonomyItem[];
      const codeToName = new Map<string, string>();
      categories.forEach((x) => codeToName.set(x.code, x.name));
      assignments.forEach((x) => codeToName.set(x.code, x.name));
      return { categories, assignments, codeToName };
    },
  });
}

/** Thay mọi mã code (dạng AT_HH, TR_BCH_PCTT...) trong text bằng tên tiếng Việt đầy đủ */
export function prettifyCodes(text: string, codeToName: Map<string, string>): string {
  if (!text || codeToName.size === 0) return text;
  // Match các token dạng UPPER_SNAKE: 2-6 cụm chữ in hoa nối bằng "_", tối đa 30 ký tự
  return text.replace(/\b([A-Z]{2,}(?:_[A-Z0-9]{2,}){1,4})\b/g, (m) => {
    return codeToName.get(m) ?? m;
  });
}
