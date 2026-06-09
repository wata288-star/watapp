import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "FLYHEIT 人生管理システム",
  description: "株式会社FLYHEIT - 資産・株式・案件を統合管理するパーソナルダッシュボード",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f1a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-dvh flex flex-col md:flex-row">
          <Nav />
          <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-7 max-w-[1280px] w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
