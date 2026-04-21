
-- Profiles table (1 user system, but standard pattern)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, title)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Phạm Quang Giáp'), 'Phó Giám đốc');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories: 9 lĩnh vực công tác
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read categories" ON public.categories FOR SELECT TO authenticated USING (true);

-- Assignments: 3 chức danh kiêm nhiệm
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read assignments" ON public.assignments FOR SELECT TO authenticated USING (true);

-- Seed 9 lĩnh vực
INSERT INTO public.categories (code, name, description, icon, sort_order) VALUES
('AT_HH', 'An toàn hàng hải', 'Công tác bảo đảm an toàn hoa tiêu, dẫn tàu', 'ShieldCheck', 1),
('KH_KT', 'Kỹ thuật - Công nghệ', 'Quản lý phương tiện, thiết bị, ứng dụng CNTT', 'Wrench', 2),
('SX_KD', 'Sản xuất - Kinh doanh', 'Điều hành dẫn tàu, doanh thu, hợp đồng', 'TrendingUp', 3),
('TC_KT', 'Tài chính - Kế toán', 'Quản lý tài chính, ngân sách, chi tiêu', 'Wallet', 4),
('TC_HC', 'Tổ chức - Hành chính', 'Nhân sự, hành chính, văn thư', 'Users', 5),
('DT_XD', 'Đầu tư - Xây dựng', 'Dự án đầu tư, xây dựng cơ bản', 'Building2', 6),
('PL_TT', 'Pháp lý - Thanh tra', 'Pháp chế, thanh tra, kiểm tra', 'Scale', 7),
('DN_DT', 'Đoàn thể - Đào tạo', 'Công đoàn, đào tạo, thi đua', 'GraduationCap', 8),
('HT_QT', 'Hợp tác - Quan hệ', 'Đối ngoại, quan hệ khách hàng, đối tác', 'Handshake', 9);

-- Seed 3 kiêm nhiệm
INSERT INTO public.assignments (code, name, description, icon, sort_order) VALUES
('CT_HDAT', 'Chủ tịch Hội đồng An toàn', 'Chủ trì các vấn đề an toàn hàng hải toàn công ty', 'Anchor', 1),
('TR_BCH_PCTT', 'Trưởng Ban Chỉ huy PCTT-TKCN', 'Phòng chống thiên tai và Tìm kiếm cứu nạn', 'LifeBuoy', 2),
('CT_HD_TDKT', 'Chủ tịch Hội đồng Thi đua - Khen thưởng', 'Công tác thi đua khen thưởng, kỷ luật', 'Award', 3);
