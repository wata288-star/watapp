import type { Metadata } from "next";
import "./pm.css";
import { PmProvider } from "./_lib/store";
import { Shell } from "./_components/Shell";

export const metadata: Metadata = {
  title: "TOMARUN コマンドセンター",
  description: "TOMARUN 事業推進のための統合管理ツール",
};

export default function PmLayout({ children }: { children: React.ReactNode }) {
  return (
    <PmProvider>
      <Shell>{children}</Shell>
    </PmProvider>
  );
}
