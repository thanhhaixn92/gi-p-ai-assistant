

## Bước tiếp theo đề xuất

Hệ thống hiện đã hoàn tất các nền tảng cốt lõi:
- **Phase 1-3**: Auth, layout, 9 lĩnh vực + 3 kiêm nhiệm theo QĐ 143
- **Phase 4**: Notes (Markdown + tag + tìm kiếm)
- **Phase 5**: Tasks chuyên sâu (Kanban + chi tiết + bộ phận + liên hệ + file đính kèm)
- **Bonus**: Quên mật khẩu qua email

Em đề xuất ưu tiên triển khai theo thứ tự sau, dựa trên giá trị sử dụng thực tế của Phó Giám đốc trên iPad/iPhone:

### Ưu tiên 1 — Phase 6: AI Assistant (khuyến nghị)
Đây là tính năng tạo **giá trị cao nhất** cho công việc lãnh đạo hằng ngày.

**Phạm vi**:
- Sidebar AI mở từ Topbar (icon Sparkles), trượt từ phải sang
- Chat tiếng Việt với system prompt đã định: "Trợ lý AI cao cấp của Phó Giám đốc Phạm Quang Giáp..."
- 4 lệnh nhanh:
  1. **Tạo task từ mô tả** — gõ tự nhiên ("Tuần sau họp hội đồng an toàn, chuẩn bị báo cáo Q1") → AI sinh task có tiêu đề/mô tả/lĩnh vực/ưu tiên/hạn
  2. **Tóm tắt note** — tóm tắt ghi chú đang xem theo cấu trúc hành chính
  3. **Phân tích báo cáo** — paste nội dung → AI đưa nhận định + gợi ý hành động
  4. **Kế hoạch tuần** — AI quét task hiện có → đề xuất lịch tuần
- Dùng **Lovable AI Gateway** với `google/gemini-2.5-flash` (mặc định, miễn phí 13/10–6/11/2026, sau đó rẻ)
- Edge function `ai-chat` streaming response
- Lưu lịch sử chat vào bảng `ai_messages` (RLS theo user)

### Ưu tiên 2 — Kéo-thả Kanban (UX nhanh)
- Cài `@dnd-kit/core` + `@dnd-kit/sortable`
- Kéo task giữa 5 cột (todo/doing/review/done/blocked)
- Hỗ trợ touch trên iPad
- Optimistic update + rollback nếu lỗi

### Ưu tiên 3 — View Danh sách + Lịch
- Trang mới `/tat-ca-cong-viec`
- **Tab Bảng**: table có sort/filter (lĩnh vực, kiêm nhiệm, ưu tiên, hạn, bộ phận, trạng thái)
- **Tab Lịch**: calendar tháng dùng `react-day-picker` đã có sẵn — hiển thị task theo `due_date`, click ngày để xem danh sách

### Ưu tiên 4 — Hoàn thiện & polish
- Thông báo (notification) task quá hạn / sắp đến hạn
- Export báo cáo tuần ra PDF
- Dark mode tuỳ chọn
- PWA — cài đặt như app trên iPad

---

### Em khuyến nghị

Triển khai ngay **Phase 6: AI Assistant** vì:
- Đây là tính năng đặc trưng nhất của hệ thống (đã ghi rõ trong yêu cầu ban đầu)
- Tận dụng Lovable AI miễn phí trong giai đoạn promo
- Tăng tốc độ ra quyết định — đúng mục tiêu chính của anh
- Tạo task bằng giọng nói tự nhiên giúp dùng nhanh trên iPhone

Sau khi anh duyệt, em sẽ chuyển sang chế độ thực thi và build trong 1 lượt.

### Câu hỏi xác nhận

1. **Chọn ưu tiên triển khai tiếp theo?**
   - Phase 6: AI Assistant (khuyến nghị)
   - Kéo-thả Kanban
   - View Danh sách + Lịch
   - Khác (anh ghi rõ)

2. **Nếu chọn AI**, lưu lịch sử chat?
   - Có (xem lại được hội thoại cũ, tốn DB nhẹ)
   - Không (mỗi lần mở là mới, riêng tư hơn)

