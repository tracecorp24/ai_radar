import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p> : null}
        <h2 className="editorial-title text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function SectionActionLink({
  href,
  label
}: {
  href: string;
  label: string;
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href}>{label}</a>
    </Button>
  );
}

