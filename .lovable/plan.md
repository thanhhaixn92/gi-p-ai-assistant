

## Bổ sung chức năng "Quên mật khẩu"

Hiện trang `/auth` chỉ có Đăng nhập / Đăng ký. Khi anh quên mật khẩu sẽ không có cách nào tự khôi phục. Em sẽ bổ sung luồng đặt lại mật khẩu qua email — tận dụng sẵn Lovable Cloud Auth, không cần cấu hình thêm.

### Luồng người dùng

```text
Trang /auth
   │
   ├─ [Quên mật khẩu?] (link dưới ô mật khẩu)
   │      │
   │      ▼
   │   Dialog nhập email
   │      │  → gửi email khôi phục
   │      ▼
   │   Toast: "Đã gửi link khôi phục tới email"
   │
   └─ Anh mở email → click link → mở /reset-password
                                          │
                                          ▼
                                  Form đặt mật khẩu mới
                                          │
                                          ▼
                                  Toast thành công → /
```

### Các thay đổi

**1. `src/pages/Auth.tsx`**
- Thêm link **"Quên mật khẩu?"** nằm ngay dưới ô mật khẩu (tab Đăng nhập).
- Click mở Dialog nhập email → gọi `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/reset-password\` })`.
- Hiển thị toast hướng dẫn anh kiểm tra hộp thư.

**2. `src/pages/ResetPassword.tsx`** (mới)
- Trang công khai (không bọc `ProtectedRoute`).
- Khi mở, Supabase tự gắn session khôi phục từ link email.
- Form 2 ô: **Mật khẩu mới** + **Xác nhận mật khẩu** (tối thiểu 6 ký tự, phải khớp).
- Submit → `supabase.auth.updateUser({ password })` → toast thành công → điều hướng `/`.
- Nếu vào trang mà không có session khôi phục → hiển thị thông báo link đã hết hạn + nút quay lại `/auth`.

**3. `src/App.tsx`**
- Thêm route công khai: `<Route path="/reset-password" element={<ResetPassword />} />`.

### Lưu ý kỹ thuật
- Dùng đúng template email mặc định của Lovable Cloud — không cần cấu hình SMTP riêng.
- Email khôi phục sẽ gửi từ địa chỉ mặc định của hệ thống; nếu sau này anh muốn email gửi từ tên miền riêng (vd. `noreply@hoatieu.vn`) thì cần thiết lập email domain — em sẽ làm ở giai đoạn riêng.
- Giữ nguyên thiết kế Light mode xanh dương đậm + vàng đồng đã có.

### Cách sử dụng sau khi triển khai
1. Tại trang đăng nhập, click **"Quên mật khẩu?"**.
2. Nhập email tài khoản → bấm gửi.
3. Mở email từ Lovable Cloud → click link.
4. Nhập mật khẩu mới 2 lần → đăng nhập lại bình thường.

