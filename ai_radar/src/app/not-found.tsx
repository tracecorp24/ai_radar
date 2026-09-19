import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-grid">
      <EmptyState
        title="Sayfa bulunamadı"
        description="Aradığınız içerik kaldırılmış olabilir veya bağlantı yanlış olabilir."
      />
      <div className="mt-4">
        <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
