"use client";

import { Button } from "@/components/ui/button";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="outline" size="icon" aria-label="Tema değiştir" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button variant="outline" size="icon" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label="Tema değiştir">
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </Button>
  );
}

