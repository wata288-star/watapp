"use client";

import { IconPrint } from "./icons";

export function PrintButton({ label = "印刷する" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy2"
    >
      <IconPrint width={16} height={16} />
      {label}
    </button>
  );
}
