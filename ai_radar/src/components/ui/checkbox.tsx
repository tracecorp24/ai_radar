import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring",
        className
      )}
      {...props}
    />
  );
}

