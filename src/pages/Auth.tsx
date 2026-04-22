import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Anchor, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("Đăng nhập thất bại", { description: error.message });
    } else {
      toast.success("Chào mừng Phó Giám đốc");
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(email, password, "Phạm Quang Giáp");
    setSubmitting(false);
    if (error) {
      toast.error("Đăng ký thất bại", { description: error.message });
    } else {
      toast.success("Tạo tài khoản thành công", { description: "Bạn có thể đăng nhập ngay." });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSubmitting(false);
    if (error) {
      toast.error("Không thể gửi email khôi phục", { description: error.message });
    } else {
      toast.success("Đã gửi liên kết khôi phục", {
        description: "Vui lòng kiểm tra hộp thư (cả mục Spam) để đặt lại mật khẩu.",
      });
      setForgotOpen(false);
      setForgotEmail("");
    }
  };

  const openForgot = () => {
    setForgotEmail(email);
    setForgotOpen(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 text-primary-foreground">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-elegant mb-4">
            <Anchor className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold">Hệ thống Quản lý Công việc</h1>
          <p className="text-sm opacity-90 mt-1">Phó Giám đốc — Hoa tiêu hàng hải miền Bắc</p>
        </div>

        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle>Truy cập hệ thống</CardTitle>
            <CardDescription>Đăng nhập để tiếp tục công việc</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Đăng nhập</TabsTrigger>
                <TabsTrigger value="signup">Tạo tài khoản</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="giap@hoatieu.vn" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mật khẩu</Label>
                      <button
                        type="button"
                        onClick={openForgot}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Đăng nhập
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-up">Mật khẩu</Label>
                    <Input id="password-up" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" variant="secondary" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tạo tài khoản
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-primary-foreground/70 mt-6">
          QĐ 143/QĐ-CTHTHHMB ngày 09/4/2026
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <form onSubmit={handleForgotPassword}>
            <DialogHeader>
              <DialogTitle>Khôi phục mật khẩu</DialogTitle>
              <DialogDescription>
                Nhập email tài khoản. Hệ thống sẽ gửi liên kết đặt lại mật khẩu tới hộp thư của anh.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="giap@hoatieu.vn"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={forgotSubmitting}>
                {forgotSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi liên kết
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
