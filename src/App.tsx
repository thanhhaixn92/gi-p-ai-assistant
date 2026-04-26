import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import AssignmentPage from "./pages/AssignmentPage.tsx";
import NotesPage from "./pages/NotesPage.tsx";
import AISettingsPage from "./pages/AISettingsPage.tsx";
import EditorialPage from "./pages/EditorialPage.tsx";
import TaskDetailPage from "./pages/TaskDetailPage.tsx";
import NoteDetailPage from "./pages/NoteDetailPage.tsx";
import EditorialDetailPage from "./pages/EditorialDetailPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/ghi-chu" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
            <Route path="/cai-dat-ai" element={<ProtectedRoute><AISettingsPage /></ProtectedRoute>} />
            <Route path="/bien-tap" element={<ProtectedRoute><EditorialPage /></ProtectedRoute>} />
            <Route path="/linh-vuc/:code" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
            <Route path="/kiem-nhiem/:code" element={<ProtectedRoute><AssignmentPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
