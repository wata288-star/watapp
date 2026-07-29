"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBook, IconHome, IconMenu, IconRecord } from "./icons";

const tabs = [
  { href: "/tomarun", label: "ホーム", Icon: IconHome, match: (p: string) => p === "/tomarun" },
  {
    href: "/tomarun/records",
    label: "記録",
    Icon: IconRecord,
    match: (p: string) => p.startsWith("/tomarun/records"),
  },
  {
    href: "/tomarun/docs",
    label: "資料集",
    Icon: IconBook,
    match: (p: string) => p.startsWith("/tomarun/docs"),
  },
  {
    href: "/tomarun/menu",
    label: "メニュー",
    Icon: IconMenu,
    match: (p: string) => p.startsWith("/tomarun/menu"),
  },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tm-tabbar" aria-label="メインナビゲーション">
      {tabs.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className="tm-tab"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
