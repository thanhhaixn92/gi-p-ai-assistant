// Streaming chat + structured task extraction for Phó Giám đốc Phạm Quang Giáp
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_CODES = [
  "hanh_chinh_quan_tri",
  "to_chuc_can_bo",
  "ke_hoach_tai_chinh",
  "khoa_hoc_cong_nghe",
  "hop_tac_quoc_te",
  "du_bao_canh_bao",
  "quan_trac",
  "thong_tin_du_lieu",
  "dao_tao_boi_duong",
];
const ASSIGNMENT_CODES = ["phong_chong_thien_tai", "an_toan_lao_dong", "cai_cach_hanh_chinh"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const BASE_SYSTEM = `Bạn là Trợ lý AI cao cấp của Phó Giám đốc Phạm Quang Giáp tại Trung tâm Khí tượng Thuỷ văn (theo Quyết định 143).
Phong cách: tiếng Việt hành chính, ngắn gọn, chuyên nghiệp, ưu tiên gạch đầu dòng và bảng khi phù hợp.

Bối cảnh hệ thống quản lý gồm 9 lĩnh vực và 3 nhiệm vụ kiêm nhiệm:
- Lĩnh vực (category_code): ${CATEGORY_CODES.join(", ")}.
- Kiêm nhiệm (assignment_code): ${ASSIGNMENT_CODES.join(", ")}.

Khi tóm tắt: dùng cấu trúc "Bối cảnh / Nội dung chính / Đề xuất hành động".
Tránh suy đoán số liệu chưa có; nếu thiếu dữ kiện hãy hỏi lại ngắn gọn.`;

const EXTRACT_SYSTEM = `${BASE_SYSTEM}

NHIỆM VỤ HIỆN TẠI: Người dùng mô tả 1 công việc cần tạo task. Hãy GỌI HÀM extract_task để trả về dữ liệu có cấu trúc.
Quy tắc:
- title: ngắn gọn ≤ 120 ký tự, viết hoa chữ cái đầu, không kết thúc bằng dấu chấm.
- description: chi tiết tiếng Việt, có thể nhiều dòng, có thể để trống nếu user không nói thêm.
- priority: low|medium|high|urgent (mặc định medium; "gấp/khẩn/ngay" → urgent; "quan trọng" → high).
- category_code: chỉ dùng đúng 1 mã trong danh sách Lĩnh vực, hoặc null.
- assignment_code: chỉ dùng đúng 1 mã trong danh sách Kiêm nhiệm, hoặc null.
- LƯU Ý: chỉ chọn MỘT trong category_code HOẶC assignment_code, cái còn lại PHẢI null.
- due_date: ISO 8601 (vd "2026-04-30T17:00:00.000Z") nếu suy luận được, ngược lại null. Quy ước: "ngày mai" = +1 ngày 17:00, "tuần sau" = thứ 2 tuần kế tiếp 09:00, "cuối tuần" = chủ nhật 17:00, "cuối tháng" = ngày cuối tháng 17:00.
- confidence: 0..1 — độ tự tin về việc đã hiểu đúng yêu cầu.
- missing_fields: liệt kê các trường người dùng CHƯA nói rõ (vd ["due_date", "category_code"]).
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY chưa cấu hình");

    // ==== Mode: extract_task — non-streaming, tool-calling để lấy structured output ====
    if (mode === "extract_task") {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: EXTRACT_SYSTEM }, ...messages],
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
        "\n\nNGỮ CẢNH: Tóm tắt nội dung được cung cấp theo cấu trúc hành chính 3 phần (Bối cảnh / Nội dung chính / Đề xuất hành động).";
    } else if (mode === "analyze") {
      systemContent +=
        "\n\nNGỮ CẢNH: Phân tích báo cáo - đưa nhận định khách quan + 3-5 đề xuất hành động ưu tiên.";
    } else if (mode === "weekly_plan") {
      systemContent +=
        "\n\nNGỮ CẢNH: Lập kế hoạch tuần dạng bảng (Thứ | Buổi | Công việc | Lĩnh vực | Ưu tiên).";
    } else {
      // chat thuần — KHÔNG yêu cầu sinh JSON nữa, vì tạo task đã chuyển sang luồng riêng
      systemContent +=
        '\n\nNếu người dùng mô tả 1 công việc muốn tạo task, hãy nhắc họ bấm nút "Tạo task" trong khung trợ lý để xác nhận từng trường.';
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
