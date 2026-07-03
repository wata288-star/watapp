import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Serif_JP, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerif = Noto_Serif_JP({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "マシンカルテ | 産業機械履歴管理・流通支援プラットフォーム",
    template: "%s | マシンカルテ",
  },
  description:
    "工場で稼働する産業機械1台ごとに、購入から点検・修理・部品交換までの全履歴を記録する「機械のカルテ」。蓄積された整備履歴は、売却時の履歴証明書として資産価値に転換されます。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d3153",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSans.variable} ${notoSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
