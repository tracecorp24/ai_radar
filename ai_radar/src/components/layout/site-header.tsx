"use client";

import { NAV_ITEMS } from "@/lib/constants";
import { Radar, Signal } from "lucide-react";
import Link from "next/link";
import { MobileNavigation } from "./mobile-navigation";
import { NotificationCenter } from "./notification-center";
import { NavigationLink } from "./navigation-link";
import { SearchCommand } from "./search-command";
import { ThemeToggle } from "./theme-toggle";

function UserAvatar() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-gradient-to-br from-primary/20 to-cyan-500/20 text-sm font-semibold text-primary">
      CR
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2 shrink-0">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Radar className="h-4 w-4" />
          </span>
          <span className="font-mono text-lg font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)] sm:text-xl sm:tracking-[0.3em]">
            CORPUS
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_ITEMS.slice(0, 7).map((item) => {
            return (
              <NavigationLink
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                activeClassName="bg-accent text-accent-foreground"
                pendingClassName="opacity-70"
              >
                {item.label}
              </NavigationLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SearchCommand />
          <NotificationCenter />
          <ThemeToggle />
          <MobileNavigation />
          <div className="hidden items-center gap-3 rounded-xl border border-border px-3 py-1.5 lg:flex">
            <UserAvatar />
            <div className="leading-tight">
              <p className="text-sm font-medium">Research Mode</p>
              <p className="text-xs text-muted-foreground">Personal workspace</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground lg:flex">
            <Signal className="h-3.5 w-3.5 text-emerald-400" />
            Sync OK
          </div>
        </div>
      </div>
    </header>
  );
}
