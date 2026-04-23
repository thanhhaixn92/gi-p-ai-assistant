

## Nâng cấp giao diện hiển thị kết quả AI

Hiện tại tin nhắn AI hiển thị markdown thô khá đơn điệu, dày đặc, khó scan. Em sẽ thiết kế lại theo hướng **"thẻ tổng hợp + checklist tương tác"** — ưu tiên tóm tắt, hành động click được, đẹp mắt trên iPad.

### 1. Phân loại nội dung trả lời

Edge function `ai-chat` sẽ được hướng dẫn (qua system prompt) để cấu trúc câu trả lời theo 5 khối tiêu chuẩn, mỗi khối bọc trong fence đặc biệt để frontend nhận dạng:

| Khối | Fence | Khi dùng |
|---|---|---|
| **Tóm tắt** | ` ```summary ` | Câu trả lời ngắn, in đậm — luôn xuất hiện đầu tiên |
| **Checklist** | ` ```checklist ` | Danh sách việc cần làm, mỗi dòng `[ ] Nội dung` — render thành checkbox click tick |
| **Bảng** | ` ```table ` | TSV/markdown table — render thành Table component đẹp |
| **Hành động** | ` ```actions ` | Nút bấm: `create_task: ...`, `create_note: ...`, `open: /linh-vuc/xxx` |
| **Trích dẫn** | ` ```cite ` | Nguồn / căn cứ pháp lý |

Phần văn bản còn lại render markdown thường (đã có `react-markdown`).

### 2. Component mới `AIMessageRenderer`

```text
┌─ Tin nhắn AI ─────────────────────────┐
│ 💡 Tóm tắt (badge primary)             │
│   Kế hoạch tuần tới gồm 3 nhóm việc... │
├────────────────────────────────────────┤
│ ☐ Hoàn thiện báo cáo Q1   [+ Task]    │
│ ☐ Họp giao ban thứ 2       [+ Task]    │
│ ☑ Duyệt văn bản 143/QĐ              │
│   (tick để đánh dấu đã xử lý)          │
├────────────────────────────────────────┤
│ 📊 Bảng phân công                      │
│ ┌────────┬──────┬─────┐                │
│ │Lĩnh vực│Người │Hạn  │                │
│ └────────┴──────┴─────┘                │
├────────────────────────────────────────┤
│ [📌 Tạo task: "Hoàn thiện..."]         │
│ [📝 Lưu thành ghi chú]                 │
│ [→ Mở Lĩnh vực An toàn]                │
├────────────────────────────────────────┤
│ 📚 Căn cứ: QĐ 143/2024-PGĐ            │
└────────────────────────────────────────┘
                       09:42 · Gemini Flash
```

**Tính năng cụ thể**:
- Mỗi dòng checklist có icon **[+]** bên phải → click mở `AITaskBuilder` với title được điền sẵn
- Tick checkbox → trạng thái lưu local (chỉ visual, không ghi DB) — giúp anh đánh dấu đã làm khi đọc
- Bảng dùng component `Table` của shadcn, có border xanh-vàng theo theme
- Khối Hành động render thành Button group, parser hiểu cú pháp `create_task: ...` / `create_note: ...` / `open: /path`
- Trích dẫn hiển thị nhỏ, italic, có icon BookOpen

### 3. Cập nhật bubble tin nhắn

- Avatar AI tròn có gradient xanh→vàng + icon Sparkles
- Tin nhắn user: bubble bo tròn nhỏ, nền xanh đậm, chữ trắng, căn phải
- Tin nhắn AI: card nền trắng, viền mỏng, có **timestamp + tên model** ở góc dưới
- Nội dung dài tự động gắn nút **"Thu gọn / Mở rộng"** khi > 400 chữ
- Code block markdown thường: nền xám, có nút copy ở góc

### 4. Quick replies dưới mỗi tin nhắn AI

Dựa vào nội dung trả lời, tự động hiện 2–3 chip gợi ý câu hỏi tiếp theo:
- `[ Phân tích sâu hơn ]` `[ Tạo kế hoạch tuần ]` `[ Tóm tắt ngắn lại ]`

Click chip → tự gửi prompt tương ứng.

### 5. Cải thiện input + loading

- Khung nhập: gắn nút mic 🎙️ (placeholder cho voice input — sẽ làm phase sau)
- Loading: skeleton 3 dòng với shimmer animation thay cho dấu `...` thô
- Khi AI đang stream: hiện cursor nhấp nháy cuối dòng

### 6. File chỉnh sửa

| File | Thay đổi |
|---|---|
| `src/components/ai/AIMessageRenderer.tsx` | **Mới** — parse fence + render từng khối |
| `src/components/ai/AIChecklistBlock.tsx` | **Mới** — checklist tương tác có nút "+ Task" |
| `src/components/ai/AIActionButtons.tsx` | **Mới** — render nút từ khối actions |
| `src/components/ai/AITableBlock.tsx` | **Mới** — bảng đẹp dùng shadcn Table |
| `src/components/ai/AIAssistantSheet.tsx` | Thay markdown thô bằng `<AIMessageRenderer>`, thêm avatar + quick replies + skeleton loading |
| `supabase/functions/ai-chat/index.ts` | Cập nhật system prompt: hướng dẫn AI dùng fence ` ```summary `, ` ```checklist `, ` ```table `, ` ```actions `, ` ```cite ` |

### 7. Lưu ý kỹ thuật

- Parser dùng regex `/```(summary|checklist|table|actions|cite)\n([\s\S]*?)```/g` để tách khối, phần còn lại đẩy vào `react-markdown`
- Checkbox state lưu trong `useState` của bubble — refresh mất, đúng ý "chỉ visual"
- Nút "+ Task" mở `AITaskBuilder` với `userPrompt` = nội dung dòng checklist (tận dụng luồng 3 bước có sẵn)
- Action `create_note: <title> | <content>` gọi `useCreateNote` đã có trong `useNotes.ts`
- Action `open: /path` dùng `useNavigate` của react-router
- Tương thích ngược: nếu AI trả lời không có fence (câu chat thường), vẫn render markdown như cũ — không vỡ UI

### 8. Sau khi triển khai anh sẽ thấy

1. AI trả lời có **thẻ Tóm tắt** ngay đầu — đọc 1 giây hiểu ý chính
2. Mỗi việc cần làm thành dòng checklist, click **[+]** tạo task ngay không cần copy-paste
3. Bảng dữ liệu (vd. phân công, kế hoạch tuần) hiển thị gọn gàng thay vì pipe `|` xấu xí
4. Chip gợi ý dưới mỗi câu trả lời giúp hỏi tiếp nhanh
5. Giao diện đồng bộ với theme xanh dương + vàng đồng hiện tại

