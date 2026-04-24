

## Kế hoạch tích hợp tài liệu V5: Trợ lý điều hành & biên tập số

Tài liệu anh tải lên gồm 18 bước rất chi tiết. Em đề xuất chia thành **5 giai đoạn**, gửi từng giai đoạn để Lovable thực hiện — tránh vỡ build vì làm quá nhiều một lúc.

### Phát hiện quan trọng (đã kiểm tra DB)

DB hiện đã có **đúng 9 lĩnh vực + 3 chức danh** theo tài liệu:
- `AT_HH, KH_KT, SX_KD, TC_KT, TC_HC, DT_XD, PL_TT, DN_DT, HT_QT`
- `CT_HDAT, TR_BCH_PCTT, CT_HD_TDKT`

Nhưng `supabase/functions/ai-chat/index.ts` đang **hardcode SAI** danh mục cho một "Trung tâm Khí tượng Thuỷ văn" tưởng tượng → AI không bao giờ gán đúng lĩnh vực. **Đây là lỗi nghiêm trọng nhất, sửa trước.**

---

### Giai đoạn 1 — Sửa bối cảnh & bảo mật AI (làm trong lượt tới)

**Bước 2 + 3 + 16 trong tài liệu.** Nhanh, ít rủi ro, đem lại giá trị tức thì.

| File | Việc |
|---|---|
| `supabase/functions/ai-chat/index.ts` | Thay context "Khí tượng Thuỷ văn" → "Công ty TNHH MTV Hoa tiêu hàng hải miền Bắc". Thay danh mục hardcode sai bằng đúng 9 mã `AT_HH...HT_QT` + 3 mã `CT_HDAT...`. Ràng buộc AI: chỉ chọn 1 trong category/assignment, không chọn cả hai. Yêu cầu trả lời dùng **tên tiếng Việt đầy đủ**, không hiện code thô. Xác thực JWT user trước khi xử lý. |
| `src/components/ai/AIAssistantSheet.tsx` | Đổi cách gọi edge function từ `apikey` sang `Authorization: Bearer <session.access_token>` để function biết user. |
| `src/components/ai/AIMessageRenderer.tsx` + `AIChecklistBlock.tsx` | Util `prettifyCodes()` map `AT_HH` → "An toàn hàng hải" trong text hiển thị. Fetch sẵn taxonomies qua hook mới `useTaxonomies.ts`. |
| `src/components/ai/AITaskBuilder.tsx` | Tự tick hết các trường AI đề xuất, nút "Tạo task" luôn enabled khi có title, bỏ tick = dùng default an toàn (priority=medium, code=null...). |

**Kết quả**: AI gán đúng lĩnh vực, hiển thị tên đẹp, tạo task linh hoạt 1 cú click.

---

### Giai đoạn 2 — Trang Cài đặt AI (Bước 16)

| File | Việc |
|---|---|
| Migration | Bảng `ai_settings` (per-user) — model, temperature, custom_system_prompt, max_history, tone... + RLS |
| `src/pages/AISettingsPage.tsx` (mới) | UI 4 nhóm card: Model / Phong cách / Ngữ cảnh cá nhân / Lịch sử |
| `src/hooks/useAISettings.ts` (mới) | Fetch + mutation TanStack Query |
| `src/components/layout/AppSidebar.tsx` | Thêm mục "Cài đặt AI" |
| `src/App.tsx` | Route `/cai-dat-ai` (ProtectedRoute) |
| `supabase/functions/ai-chat/index.ts` | Đọc `ai_settings` của user, áp model/temperature/custom_prompt động |

---

### Giai đoạn 3 — Module Trợ lý biên tập: Schema + Khung trang (Bước 4 + 5 + 6)

Đây là module **lớn nhất**. Giai đoạn này chỉ tạo nền:

| Việc | Chi tiết |
|---|---|
| Migration `editorial_module.sql` | 5 bảng: `editorial_sessions`, `editorial_sources`, `editorial_versions`, `editorial_images`, `editorial_exports`. 6 enums. RLS theo user_id. Index theo session_id, review_status, quality_status. |
| Storage | 2 bucket private: `editorial-files` (50MB), `editorial-images` (20MB). Policy theo `{user_id}/{session_id}/...`. |
| `src/types/editorial.ts` | `EditorialSession`, `EditorialSource`, `EditorialVersion`, `EditorialImage`, `EditorialImagePlan`, `EditorialImageAnalysis`, `EditorialPublishAudit`. |
| `src/pages/EditorialPage.tsx` | Khung trang `/bien-tap`: form yêu cầu, chọn loại bài (7 loại), chọn task (6 loại), chọn tone, danh sách phiên đã lưu. |
| `src/services/editorialService.ts` | CRUD session + source + version qua Supabase. |
| `src/App.tsx` + `AppSidebar.tsx` | Thêm route `/bien-tap` + menu "Trợ lý biên tập". |

**Chưa làm**: tạo bài bằng AI, hình minh họa, export. Để giai đoạn 4-5.

---

### Giai đoạn 4 — Sinh bài + Quản lý hình minh họa (Bước 7 + 8 + 9 + 11 + 12)

| Việc | Chi tiết |
|---|---|
| `supabase/functions/editorial-ai/index.ts` | Action: `generate_article`, `edit_article`, `summarize_sources`, `proofread`, `expand`, `shorten`, `normalize_tone`. Dùng Lovable AI gateway (Gemini). |
| `supabase/functions/editorial-images/index.ts` | Action: `analyze_plan`, `generate_one`, `audit_image`. Lưu ảnh vào bucket. Mặc định ảnh mới = `suggested`. |
| `supabase/functions/fetch-link-text/index.ts` | Fetch link an toàn: chặn private IP, metadata service, giới hạn redirect/timeout/size. |
| `src/services/editorialImageUtils.ts` | `analyzeEditorialImages`, `findImagePlaceholders`, `getValidImages`, `getBrokenImages`, `removeResolvedImagePlaceholders`, `hasApprovedImageForParagraph`. |
| `src/modules/editorial/EditorialImageControlPanel.tsx` | UI: nút Phân tích, Lập kế hoạch, Tạo hình, danh sách ảnh + nút Duyệt/Loại/Sửa caption. |
| `src/modules/editorial/EditorialPreview.tsx` | Preview ẩn ảnh lỗi/rejected, gắn nhãn "Chờ duyệt" cho `suggested`, ẩn placeholder khi đã có ảnh approved. |

---

### Giai đoạn 5 — Export Word/PDF + Lưu phiên + Nghiệm thu (Bước 13 + 14 + 15 + 17 + 18)

| Việc | Chi tiết |
|---|---|
| `src/services/exportService.ts` | Xuất DOCX (Times New Roman, cỡ 13-14, căn đều, caption dưới ảnh) — chỉ lấy ảnh `approved`. PDF qua print-friendly CSS. |
| `src/services/editorialPublishUtils.ts` | `EditorialPublishAudit`: đếm approved/suggested/rejected, `canExport` flag. |
| Logic lưu phiên | Auto-save debounced. Mở lại phiên: phục hồi ảnh + caption + trạng thái duyệt nguyên vẹn. Tạo `editorial_versions` snapshot khi sinh/sửa lớn. |
| `README.md` + `docs/HUONG_DAN_VAN_HANH.md` | Mục tiêu, module, cấu trúc, cách chạy local, cấu hình Supabase, deploy edge functions, xử lý lỗi thường gặp. |
| Nghiệm thu | Bảng đối chiếu 20 tiêu chí PHẦN C (RLS, không lộ key, ảnh không dấu hỏi, build pass...). |

---

### Câu hỏi xác nhận trước khi triển khai

1. **Ưu tiên thực hiện theo thứ tự nào?**
   - Em đề xuất: **Giai đoạn 1 trước** (sửa lỗi nghiêm trọng AI dùng sai context) → rồi 2 → 3 → 4 → 5.
   - Mỗi giai đoạn 1 lượt build, anh review preview rồi mới gửi giai đoạn tiếp.

2. **Module Trợ lý biên tập (giai đoạn 3-5)** là phần lớn nhất, ước lượng ~3-4 lượt build độc lập. Anh có muốn em làm hết trong session này, hay chỉ làm Giai đoạn 1+2 trước (sửa AI hiện có), rồi anh dùng thử vài ngày trước khi build module mới?

3. **GEMINI API**: Tài liệu nói "đọc từ Supabase Secrets". Hiện app đang dùng `LOVABLE_API_KEY` (Lovable AI Gateway) cho Gemini — vốn đã an toàn server-side. Em đề xuất **giữ Lovable AI Gateway** cho text/chat (không cần thêm secret), chỉ dùng Gemini API riêng nếu cần model image cao cấp ở Giai đoạn 4. Anh đồng ý chứ?

