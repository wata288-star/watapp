import type { Metadata } from "next";
import TabBar from "./components/TabBar";
import "./tomarun.css";

export const metadata: Metadata = {
  title: "TOMARUN ― 生産を、止めない。",
  description: "現場作業者がトラブルを解決し、原因追求を速くするアプリ",
};

export default function TomarunLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tm">
      {children}
      <TabBar />
    </div>
  );
}
