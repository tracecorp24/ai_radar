import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Slider({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="range"
      className={cn("h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary", className)}
      {...props}
    />
  );
}

