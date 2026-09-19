"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/lib/constants";
import { Menu } from "lucide-react";
import { NavigationLink } from "./navigation-link";
import { useState } from "react";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menü">
        <Menu className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gezinme</DialogTitle>
          </DialogHeader>
          <nav className="grid gap-2">
            {NAV_ITEMS.map((item) => {
              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-accent"
                  activeClassName="bg-primary text-primary-foreground"
                  pendingClassName="opacity-70"
                >
                  {item.label}
                </NavigationLink>
              );
            })}
          </nav>
        </DialogContent>
      </Dialog>
    </>
  );
}
