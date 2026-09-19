"use client";

import { useEffect } from "react";

export function RuntimeSession() {
  useEffect(() => {
    const id = crypto.randomUUID();
    const heartbeat = () => fetch("/api/runtime/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }), keepalive: true }).catch(() => undefined);
    const close = () => navigator.sendBeacon("/api/runtime/session", JSON.stringify({ id, close: true }));
    heartbeat();
    const timer = window.setInterval(heartbeat, 10_000);
    window.addEventListener("pagehide", close);
    return () => { window.clearInterval(timer); window.removeEventListener("pagehide", close); close(); };
  }, []);
  return null;
}
