"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconGrid,
  IconMachine,
  IconRecord,
  IconCert,
  IconExchange,
  IconBuilding,
} from "./icons";

const ITEMS = [
  { href: "/console", label: "ダッシュボード", icon: IconGrid, exact: true },
  { href: "/console/machines", label: "機械台帳", icon: IconMachine },
  { href: "/console/records", label: "整備記録", icon: IconRecord },
  { href: "/console/certificates", label: "履歴証明書", icon: IconCert, adminOnly: true },
  { href: "/console/sales", label: "売却・送客", icon: IconExchange, adminOnly: true },
  { href: "/console/settings", label: "設定", icon: IconBuilding },
];

export function ConsoleNav({ isAdmin, horizontal = false }: { isAdmin: boolean; horizontal?: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => !i.adminOnly || isAdmin);

  if (horizontal) {
    return (
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 text-[13px] ${
                active ? "bg-navy font-medium text-white" : "text-ink2 hover:text-navy"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-navysoft font-medium text-navy"
                : "text-ink2 hover:bg-panel2 hover:text-ink"
            }`}
          >
            <item.icon width={17} height={17} className={active ? "text-navy" : "text-ink3"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
