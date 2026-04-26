import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  fallback?: string;
  className?: string;
  label?: string;
}

export function BackButton({ fallback = "/", className, label = "Quay lại" }: Props) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };
  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleClick} className={className}>
      <ArrowLeft className="h-4 w-4 mr-1.5" />
      {label}
    </Button>
  );
}
