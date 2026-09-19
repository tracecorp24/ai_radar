import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Badge({
  className,
  children,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode; tone?: "default" | "subtle" | "success" | "warning" | "danger" }) {
  const tones = {
    default: "border-transparent bg-primary/10 text-primary",
    subtle: "border-border bg-secondary text-secondary-foreground",
    success: "border-transparent bg-emerald-500/10 text-emerald-400",
    warning: "border-transparent bg-amber-500/10 text-amber-400",
    danger: "border-transparent bg-rose-500/10 text-rose-400"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

