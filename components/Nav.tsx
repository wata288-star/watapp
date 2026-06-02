"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "ダッシュボード", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/assets", label: "資産管理", icon: "M3 7h18M3 12h18M3 17h18" },
  { href: "/stocks", label: "株式管理", icon: "M4 18l5-6 4 4 7-9" },
  { href: "/projects", label: "案件管理", icon: "M4 6h16v4H4zM4 14h10v4H4z" },
  { href: "/trends", label: "資産推移", icon: "M3 17l6-6 4 4 8-8" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="md:w-60 md:min-h-dvh shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--panel)] md:sticky md:top-0">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b8cff] to-[#8b5bff] flex items-center justify-center font-black text-white text-sm">
          F
        </div>
        <div>
          <div className="font-bold text-[15px] leading-tight">FLYHEIT</div>
          <div className="text-[10px] text-[var(--muted)] tracking-wide">
            LIFE MANAGEMENT
          </div>
        </div>
      </div>
      <ul className="flex md:flex-col gap-1 px-3 pb-3 overflow-x-auto">
        {ITEMS.map((it) => {
          const active = path === it.href;
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
                }`}
              >
                <svg
                  className="w-4.5 h-4.5"
                  width={18}
                  height={18}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={it.icon} />
                </svg>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
