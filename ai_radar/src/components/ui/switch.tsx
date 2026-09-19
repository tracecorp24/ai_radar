import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Switch({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("relative inline-flex cursor-pointer items-center", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-primary" />
      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background transition peer-checked:translate-x-5" />
    </label>
  );
}

