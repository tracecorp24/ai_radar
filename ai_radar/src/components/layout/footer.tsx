import { Separator } from "@/components/ui/separator";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/70">
      <div className="page-grid space-y-4 py-8">
        <Separator />
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {APP_NAME} · {APP_TAGLINE}
          </p>
          <p>Local-first · SQLite · Verileriniz bu cihazda kalır</p>
        </div>
      </div>
    </footer>
  );
}
