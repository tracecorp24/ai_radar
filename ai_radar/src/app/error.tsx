"use client";

import { ErrorState } from "@/components/shared/error-state";
import { useEffect } from "react";

const chunkLoadErrorPattern = /(?:loading chunk \d+ failed|chunkloaderror|failed to fetch dynamically imported module)/i;

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!chunkLoadErrorPattern.test(error.message)) return;

    const reloadKey = `savvy:chunk-reload:${window.location.pathname}`;
    if (window.sessionStorage.getItem(reloadKey)) return;

    window.sessionStorage.setItem(reloadKey, "true");
    window.location.reload();
  }, [error]);

  return (
    <div className="page-grid">
      <ErrorState title="Sayfa yüklenemedi" description={error.message || "Beklenmeyen bir hata oluştu."} onRetry={reset} />
    </div>
  );
}
