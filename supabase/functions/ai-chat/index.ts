// Streaming chat with Lovable AI Gateway for Phó Giám đốc Phạm Quang Giáp
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Bạn là Trợ lý AI cao cấp của Phó Giám đốc Phạm Quang Giáp tại Trung tâm Khí tượng Thuỷ văn (theo Quyết định 143).
Phong cách: tiếng Việt hành chính, ngắn gọn, chuyên nghiệp, ưu tiên gạch đầu dòng và bảng khi phù hợp.
Bối cảnh hệ thống quản lý gồm 9 lĩnh vực và 3 nhiệm vụ kiêm nhiệm:
- Lĩnh vực: hành chính-quản trị, tổ chức-cán bộ, kế hoạch-tài chính, khoa học-công nghệ, hợp tác quốc tế, dự báo-cảnh báo, quan trắc, thông tin-dữ liệu, đào tạo-bồi dưỡng.
- Kiêm nhiệm: phòng chống thiên tai, an toàn lao động, cải cách hành chính.
Khi được yêu cầu tạo task: trả lời JSON gọn gồm các trường title, description (tiếng Việt), priority (low|medium|high|urgent), category_code hoặc assignment_code, due_date (ISO nếu suy luận được).
Khi tóm tắt: dùng cấu trúc "Bối cảnh / Nội dung chính / Đề xuất hành động".
Tránh suy đoán số liệu chưa có; nếu thiếu dữ kiện hãy hỏi lại ngắn gọn.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY chưa cấu hình");

    let systemContent = SYSTEM_PROMPT;
    if (mode === "create_task") {
      systemContent +=
        "\n\nNGỮ CẢNH HIỆN TẠI: Người dùng muốn tạo task. Hãy phân tích mô tả và đề xuất task cụ thể, kết thúc bằng khối ```json {...}``` chứa cấu trúc task.";
    } else if (mode === "summarize") {
      systemContent +=
        "\n\nNGỮ CẢNH: Tóm tắt nội dung được cung cấp theo cấu trúc hành chính 3 phần.";
    } else if (mode === "analyze") {
      systemContent +=
        "\n\nNGỮ CẢNH: Phân tích báo cáo - đưa nhận định khách quan + 3-5 đề xuất hành động ưu tiên.";
    } else if (mode === "weekly_plan") {
      systemContent +=
        "\n\nNGỮ CẢNH: Lập kế hoạch tuần dạng bảng (Thứ | Buổi | Công việc | Lĩnh vực | Ưu tiên).";
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
