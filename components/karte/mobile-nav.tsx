"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconScan, IconMachine, IconList } from "./icons";

const ITEMS = [
  { href: "/m", label: "ホーム", icon: IconHome, exact: true },
  { href: "/m/scan", label: "スキャン", icon: IconScan },
  { href: "/m/machines", label: "機械", icon: IconMachine },
  { href: "/m/records", label: "履歴", icon: IconList },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-line bg-panel pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wider transition-colors ${
                active ? "font-medium text-navy" : "text-ink3"
              }`}
            >
              <item.icon width={21} height={21} strokeWidth={active ? 1.8 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
