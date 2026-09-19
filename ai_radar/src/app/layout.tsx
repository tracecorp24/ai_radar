import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "./providers";
import { RuntimeSession } from "@/components/layout/runtime-session";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Corpus",
    template: "%s · Corpus"
  },
  description: "AI Research & Technology Intelligence dashboard.",
  metadataBase: new URL("https://corpus.local")
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <Providers>
          <RuntimeSession />
          <div className="min-h-screen">
            <SiteHeader />
            <main>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
