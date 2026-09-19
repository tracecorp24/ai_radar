"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

export function NavigationLink({
  href,
  className,
  activeClassName,
  pendingClassName,
  onClick,
  children
}: {
  href: string;
  className: string;
  activeClassName?: string;
  pendingClassName?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  const [pending, setPending] = useState(false);

  useEffect(() => setPending(false), [pathname]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setPending(true);
    onClick?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={active ? "page" : undefined}
      aria-busy={pending || undefined}
      className={`${className} ${active ? activeClassName ?? "" : ""} ${pending ? pendingClassName ?? "" : ""}`}
    >
      {pending ? <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </Link>
  );
}
