export type EditorialArticleType =
  | "news" | "notice" | "report" | "plan" | "analysis" | "minutes" | "other";

export type EditorialTaskType =
  | "generate" | "edit" | "summarize" | "proofread" | "expand" | "shorten" | "normalize_tone";

export type EditorialTone = "formal" | "neutral" | "friendly" | "concise" | "detailed";

export type EditorialSessionStatus =
  | "draft" | "composing" | "reviewing_images" | "ready" | "exported" | "archived";

export type EditorialImageReview = "suggested" | "approved" | "rejected";
export type EditorialImageQuality = "unrated" | "good" | "broken" | "needs_replacement";

export interface EditorialSession {
  id: string;
  user_id: string;
  title: string;
  article_type: EditorialArticleType;
  task_type: EditorialTaskType;
  tone: EditorialTone;
  status: EditorialSessionStatus;
  brief: string;
  current_content: string;
  category_code: string | null;
  assignment_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialSource {
  id: string;
  session_id: string;
  user_id: string;
  source_type: string;
  label: string | null;
  url: string | null;
  storage_path: string | null;
  raw_text: string | null;
  fetched_at: string | null;
  created_at: string;
}

export interface EditorialVersion {
  id: string;
  session_id: string;
  user_id: string;
  version_number: number;
  content: string;
  note: string | null;
  created_at: string;
}

export interface EditorialImage {
  id: string;
  session_id: string;
  user_id: string;
  storage_path: string;
  caption: string;
  alt_text: string;
  paragraph_anchor: string | null;
  review_status: EditorialImageReview;
  quality_status: EditorialImageQuality;
  source: string;
  prompt: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialImagePlan {
  paragraph_anchor: string;
  caption: string;
  alt_text: string;
  prompt: string;
}

export interface EditorialImageAnalysis {
  total: number;
  approved: number;
  suggested: number;
  rejected: number;
  broken: number;
}

export interface EditorialPublishAudit {
  approved: number;
  suggested: number;
  rejected: number;
  brokenOrBlocking: number;
  canExport: boolean;
  reasons: string[];
}

export const ARTICLE_TYPE_LABEL: Record<EditorialArticleType, string> = {
  news: "Tin tức",
  notice: "Thông báo",
  report: "Báo cáo",
  plan: "Kế hoạch",
  analysis: "Phân tích",
  minutes: "Biên bản",
  other: "Khác",
};

export const TASK_TYPE_LABEL: Record<EditorialTaskType, string> = {
  generate: "Tạo bài mới",
  edit: "Chỉnh sửa",
  summarize: "Tóm tắt nguồn",
  proofread: "Kiểm lỗi",
  expand: "Mở rộng",
  shorten: "Rút gọn",
  normalize_tone: "Chuẩn hoá giọng văn",
};

export const TONE_LABEL: Record<EditorialTone, string> = {
  formal: "Trang trọng",
  neutral: "Trung tính",
  friendly: "Thân thiện",
  concise: "Súc tích",
  detailed: "Chi tiết",
};

export const SESSION_STATUS_LABEL: Record<EditorialSessionStatus, string> = {
  draft: "Nháp",
  composing: "Đang soạn",
  reviewing_images: "Chờ duyệt ảnh",
  ready: "Sẵn sàng xuất",
  exported: "Đã xuất",
  archived: "Đã lưu trữ",
};
