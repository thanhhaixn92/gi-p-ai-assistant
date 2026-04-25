// Streaming chat + structured task extraction cho Phó Giám đốc Phạm Quang Giáp
// Công ty TNHH MTV Hoa tiêu hàng hải miền Bắc
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Danh mục thực tế trong DB — KHÔNG hardcode tên xấu nữa
const CATEGORIES: { code: string; name: string }[] = [
  { code: "AT_HH", name: "An toàn hàng hải" },
  { code: "KH_KT", name: "Kỹ thuật - Công nghệ" },
  { code: "SX_KD", name: "Sản xuất - Kinh doanh" },
  { code: "TC_KT", name: "Tài chính - Kế toán" },
  { code: "TC_HC", name: "Tổ chức - Hành chính" },
  { code: "DT_XD", name: "Đầu tư - Xây dựng" },
  { code: "PL_TT", name: "Pháp lý - Thanh tra" },
  { code: "DN_DT", name: "Đoàn thể - Đào tạo" },
  { code: "HT_QT", name: "Hợp tác - Quan hệ" },
];

const ASSIGNMENTS: { code: string; name: string }[] = [
  { code: "CT_HDAT", name: "Chủ tịch Hội đồng An toàn" },
  { code: "TR_BCH_PCTT", name: "Trưởng Ban Chỉ huy PCTT-TKCN" },
  { code: "CT_HD_TDKT", name: "Chủ tịch Hội đồng Thi đua - Khen thưởng" },
];

const CATEGORY_CODES = CATEGORIES.map((c) => c.code);
const ASSIGNMENT_CODES = ASSIGNMENTS.map((a) => a.code);
const PRIORITIES = ["low", "medium", "high", "urgent"];

const TAXONOMY_BLOCK = `
DANH MỤC LĨNH VỰC PHỤ TRÁCH (category_code → tên):
${CATEGORIES.map((c) => `- ${c.code} = ${c.name}`).join("\n")}

DANH MỤC NHIỆM VỤ KIÊM NHIỆM (assignment_code → tên):
${ASSIGNMENTS.map((a) => `- ${a.code} = ${a.name}`).join("\n")}`;

const BASE_SYSTEM = `Bạn là Trợ lý AI cao cấp của ông Phạm Quang Giáp — Phó Giám đốc Công ty TNHH MTV Hoa tiêu hàng hải miền Bắc (NORTHERN VIETNAM MARITIME PILOTAGE COMPANY LIMITED).

Phong cách: tiếng Việt hành chính, ngắn gọn, chuyên nghiệp; ưu tiên gạch đầu dòng và bảng khi phù hợp. Tránh suy đoán số liệu chưa có; nếu thiếu dữ kiện hãy hỏi lại ngắn gọn.

${TAXONOMY_BLOCK}

QUY TẮC HIỂN THỊ TÊN:
- Khi nhắc đến lĩnh vực / kiêm nhiệm trong văn bản trả lời (summary, checklist, table, cite, văn bản giải thích), LUÔN dùng TÊN ĐẦY ĐỦ tiếng Việt (vd: "An toàn hàng hải"), KHÔNG hiện mã code thô (vd: "AT_HH").
- Chỉ dùng mã code trong khối \`\`\`actions\`\`\` ở dạng đường dẫn (ví dụ: open: /linh-vuc/AT_HH).

==== ĐỊNH DẠNG TRẢ LỜI BẮT BUỘC ====
Frontend render câu trả lời theo các KHỐI ĐẶC BIỆT bọc trong code fence. HÃY ƯU TIÊN dùng các khối này thay vì văn bản dài:

1. \`\`\`summary
<1-3 câu tóm tắt cốt lõi, in đậm các từ khoá quan trọng>
\`\`\`
→ LUÔN đặt ĐẦU câu trả lời nếu nội dung > 2 câu.

2. \`\`\`checklist
[ ] Việc cần làm 1
[ ] Việc cần làm 2
[x] Việc đã hoàn thành
\`\`\`
→ Dùng khi liệt kê việc cần làm / các bước. Mỗi dòng bắt đầu bằng "[ ]" hoặc "[x]".

3. \`\`\`table
Cột 1\tCột 2\tCột 3
Giá trị A\tGiá trị B\tGiá trị C
\`\`\`
→ Dùng cho dữ liệu dạng bảng (kế hoạch tuần, phân công, so sánh...). Phân tách bằng TAB hoặc dấu "|".

4. \`\`\`actions
create_task: Tiêu đề task gợi ý
create_note: Tiêu đề ghi chú | Nội dung ghi chú
open: /linh-vuc/AT_HH
\`\`\`
→ Đề xuất hành động bấm 1 click. Chỉ dùng khi thực sự gợi mở hành động cụ thể.

5. \`\`\`cite
QĐ 143/2024-PGĐ, Điều 5 khoản 2
\`\`\`
→ Dùng khi trích dẫn căn cứ pháp lý / nguồn.

NGUYÊN TẮC:
- Trả lời ngắn 1-2 câu (chào hỏi, hỏi đáp đơn giản) → trả lời thường, không cần khối.
- Có liệt kê việc → BẮT BUỘC dùng \`\`\`checklist\`\`\`.
- Có dữ liệu so sánh / lịch / phân công → BẮT BUỘC dùng \`\`\`table\`\`\`.
- Văn bản giải thích bổ sung viết bằng markdown thường, đặt giữa các khối.
- KHÔNG bọc lồng các khối vào nhau.`;

const EXTRACT_SYSTEM = `${BASE_SYSTEM}

NHIỆM VỤ HIỆN TẠI: Người dùng mô tả 1 công việc cần tạo task. Hãy GỌI HÀM extract_task để trả về dữ liệu có cấu trúc.

Quy tắc bắt buộc:
- title: ngắn gọn ≤ 120 ký tự, viết hoa chữ cái đầu, không kết thúc bằng dấu chấm.
- description: chi tiết tiếng Việt — TỰ ĐỘNG TỔNG HỢP từ thông tin user cung cấp + suy luận hợp lý (mục đích, đầu việc cụ thể, lưu ý). Tối thiểu 1 câu, có thể nhiều dòng.
- priority: low|medium|high|urgent (mặc định medium; "gấp/khẩn/ngay" → urgent; "quan trọng" → high).
- category_code: chỉ dùng đúng 1 mã trong CATEGORY_CODES, hoặc null. Khi user nhắc tới hoa tiêu / luồng tàu / cảng → AT_HH; tới tài chính / kế toán / ngân sách → TC_KT; nhân sự / tổ chức / hành chính → TC_HC; đầu tư / xây dựng / dự án → DT_XD; pháp lý / thanh tra / kiểm tra → PL_TT; đoàn thể / đào tạo / công đoàn → DN_DT; hợp tác / đối ngoại / quốc tế → HT_QT; sản xuất / doanh thu / khách hàng → SX_KD; kỹ thuật / thiết bị / công nghệ → KH_KT.
- assignment_code: chỉ dùng đúng 1 mã trong ASSIGNMENT_CODES, hoặc null. PCTT / phòng chống thiên tai / cứu nạn → TR_BCH_PCTT; thi đua / khen thưởng → CT_HD_TDKT; hội đồng an toàn / cấp phép an toàn → CT_HDAT.
- LƯU Ý NGHIÊM NGẶT: chỉ chọn MỘT trong category_code HOẶC assignment_code, cái còn lại PHẢI null.
- due_date: ISO 8601 (vd "2026-04-30T17:00:00.000Z") nếu suy luận được, ngược lại null. Quy ước: "ngày mai" = +1 ngày 17:00, "tuần sau" = thứ 2 tuần kế tiếp 09:00, "cuối tuần" = chủ nhật 17:00, "cuối tháng" = ngày cuối tháng 17:00.
- confidence: 0..1 — độ tự tin về việc đã hiểu đúng yêu cầu.
- missing_fields: chỉ liệt kê các trường user thực sự CHƯA cung cấp đủ tín hiệu để suy luận (vd ["due_date"] nếu không có manh mối thời gian).
- clarifying_question: câu hỏi ngắn (≤ 1 câu) gợi ý người dùng bổ sung — hoặc chuỗi rỗng nếu đã đủ.`;

const EXTRACT_TOOL = {
  type: "function",
  function: {
    name: "extract_task",
    description: "Trích xuất task có cấu trúc từ mô tả của người dùng",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Tiêu đề ngắn gọn ≤ 120 ký tự" },
        description: { type: "string", description: "Mô tả chi tiết, có thể rỗng" },
        priority: { type: "string", enum: PRIORITIES },
        category_code: {
          type: ["string", "null"],
          enum: [...CATEGORY_CODES, null],
          description: "Mã lĩnh vực hoặc null",
        },
        assignment_code: {
          type: ["string", "null"],
          enum: [...ASSIGNMENT_CODES, null],
          description: "Mã kiêm nhiệm hoặc null",
        },
        due_date: {
          type: ["string", "null"],
          description: "ISO 8601 hoặc null",
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        missing_fields: {
          type: "array",
          items: { type: "string" },
        },
        clarifying_question: { type: "string" },
      },
      required: [
        "title",
        "description",
        "priority",
        "category_code",
        "assignment_code",
        "due_date",
        "confidence",
        "missing_fields",
        "clarifying_question",
      ],
      additionalProperties: false,
    },
  },
};

type AISettings = {
  model: string;
  temperature: number;
  tone: string;
  max_history: number;
  custom_system_prompt: string;
  personal_context: string;
  auto_create_tasks: boolean;
};

const DEFAULT_SETTINGS: AISettings = {
  model: "google/gemini-2.5-flash",
  temperature: 0.7,
  tone: "professional",
  max_history: 20,
  custom_system_prompt: "",
  personal_context: "",
  auto_create_tasks: true,
};

const ALLOWED_MODELS = new Set([
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
]);

const TONE_HINTS: Record<string, string> = {
  professional: "Phong cách: hành chính chuyên nghiệp, trang trọng, súc tích.",
  friendly: "Phong cách: thân thiện, gần gũi, vẫn lịch sự và rõ ràng.",
  concise: "Phong cách: cực ngắn gọn, trả lời thẳng vào ý chính, ưu tiên gạch đầu dòng tối giản.",
  detailed: "Phong cách: chi tiết, giải thích đầy đủ, có ví dụ và bối cảnh khi cần.",
};

async function authenticate(
  req: Request,
): Promise<{ userId: string; supabase: any } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Chưa đăng nhập" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    return new Response(JSON.stringify({ error: "Phiên đăng nhập không hợp lệ" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId: data.user.id, supabase };
}

async function loadSettings(supabase: any, userId: string): Promise<AISettings> {
  const { data } = await supabase
    .from("ai_settings")
    .select("model,temperature,tone,max_history,custom_system_prompt,personal_context,auto_create_tasks")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  const row = data as Record<string, any>;
  return {
    model: typeof row.model === "string" && ALLOWED_MODELS.has(row.model) ? row.model : DEFAULT_SETTINGS.model,
    temperature: typeof row.temperature === "number" ? row.temperature : DEFAULT_SETTINGS.temperature,
    tone: typeof row.tone === "string" ? row.tone : DEFAULT_SETTINGS.tone,
    max_history: typeof row.max_history === "number" ? row.max_history : DEFAULT_SETTINGS.max_history,
    custom_system_prompt: typeof row.custom_system_prompt === "string" ? row.custom_system_prompt : "",
    personal_context: typeof row.personal_context === "string" ? row.personal_context : "",
    auto_create_tasks: typeof row.auto_create_tasks === "boolean" ? row.auto_create_tasks : true,
  };
}

function buildSystem(base: string, settings: AISettings): string {
  const blocks = [base];
  const toneHint = TONE_HINTS[settings.tone];
  if (toneHint) blocks.push(`PHONG CÁCH RIÊNG: ${toneHint}`);
  if (settings.personal_context.trim()) {
    blocks.push(`BỐI CẢNH CÁ NHÂN (từ người dùng):\n${settings.personal_context.trim()}`);
  }
  if (settings.custom_system_prompt.trim()) {
    blocks.push(`CHỈ DẪN BỔ SUNG (từ người dùng):\n${settings.custom_system_prompt.trim()}`);
  }
  if (!settings.auto_create_tasks) {
    blocks.push("LƯU Ý: KHÔNG tự động đề xuất khối ```actions``` create_task; chỉ đề xuất khi user yêu cầu rõ ràng.");
  }
  return blocks.join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Xác thực JWT user trước khi xử lý
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;

    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY chưa cấu hình");

    // Đọc cài đặt AI cá nhân
    const settings = await loadSettings(auth.supabase, auth.userId);

    // Cắt history theo max_history (giữ lại N tin nhắn cuối)
    const trimmedMessages = Array.isArray(messages)
      ? messages.slice(-Math.max(1, settings.max_history))
      : [];

    // ==== Mode: extract_task — non-streaming, tool-calling để lấy structured output ====
    if (mode === "extract_task") {
      const extractSystem = buildSystem(EXTRACT_SYSTEM, settings);
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: settings.model,
          temperature: settings.temperature,
          messages: [{ role: "system", content: extractSystem }, ...trimmedMessages],
          tools: [EXTRACT_TOOL],
          tool_choice: { type: "function", function: { name: "extract_task" } },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          return new Response(JSON.stringify({ error: "Đã vượt giới hạn yêu cầu, thử lại sau." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (resp.status === 402) {
          return new Response(JSON.stringify({ error: "Hết tín dụng AI." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await resp.text();
        console.error("extract_task gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "Lỗi gọi AI gateway" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "AI không trả về structured task" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let task: Record<string, unknown> = {};
      try {
        task = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Parse tool args fail:", e, toolCall.function.arguments);
        return new Response(JSON.stringify({ error: "AI trả về JSON không hợp lệ" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Sanitize phía server để chắc chắn dữ liệu hợp lệ
      const sanitized = {
        title: String(task.title ?? "").slice(0, 200).trim() || "Công việc mới",
        description: task.description ? String(task.description) : "",
        priority: PRIORITIES.includes(task.priority as string) ? task.priority : "medium",
        category_code:
          task.category_code && CATEGORY_CODES.includes(task.category_code as string)
            ? task.category_code
            : null,
        assignment_code:
          task.assignment_code && ASSIGNMENT_CODES.includes(task.assignment_code as string)
            ? task.assignment_code
            : null,
        due_date: task.due_date ? String(task.due_date) : null,
        confidence: typeof task.confidence === "number" ? task.confidence : 0.5,
        missing_fields: Array.isArray(task.missing_fields) ? task.missing_fields : [],
        clarifying_question: task.clarifying_question ? String(task.clarifying_question) : "",
      };

      // Nếu cả 2 code cùng có giá trị → ưu tiên category, bỏ assignment
      if (sanitized.category_code && sanitized.assignment_code) {
        sanitized.assignment_code = null;
      }

      // Validate due_date
      if (sanitized.due_date) {
        const d = new Date(sanitized.due_date as string);
        if (Number.isNaN(d.getTime())) sanitized.due_date = null;
        else sanitized.due_date = d.toISOString();
      }

      return new Response(JSON.stringify({ task: sanitized }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==== Các mode còn lại: streaming chat thông thường ====
    let systemContent = BASE_SYSTEM;
    if (mode === "summarize") {
      systemContent +=
        "\n\nNGỮ CẢNH: Tóm tắt nội dung. Trả về 1 khối ```summary``` ngắn gọn ở đầu, sau đó ```checklist``` các điểm chính, cuối cùng ```actions``` đề xuất 1-2 hành động (vd create_task / create_note).";
    } else if (mode === "analyze") {
      systemContent +=
        "\n\nNGỮ CẢNH: Phân tích báo cáo. Trả về ```summary``` nhận định, ```table``` so sánh số liệu (nếu có), ```checklist``` 3-5 đề xuất hành động ưu tiên, và ```cite``` căn cứ.";
    } else if (mode === "weekly_plan") {
      systemContent +=
        "\n\nNGỮ CẢNH: Lập kế hoạch tuần. BẮT BUỘC trả về 1 khối ```table``` với header: Thứ\\tBuổi\\tCông việc\\tLĩnh vực\\tƯu tiên. Cột Lĩnh vực dùng TÊN TIẾNG VIỆT đầy đủ (vd: \"An toàn hàng hải\"), KHÔNG dùng mã. Sau đó ```actions``` create_task cho 2-3 việc quan trọng nhất.";
    } else {
      // chat thuần
      systemContent +=
        '\n\nNếu người dùng mô tả 1 công việc muốn tạo task, hãy gợi ý bằng khối ```actions``` với create_task: <tiêu đề>, hoặc nhắc họ bấm nút "Tạo task" trong khung trợ lý.';
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: systemContent }, ...messages],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đã vượt giới hạn yêu cầu, vui lòng thử lại sau." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Hết tín dụng AI - cần nạp thêm tại Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Lỗi gọi AI gateway" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi không xác định" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
