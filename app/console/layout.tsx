import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { logout } from "@/app/actions/karte";
import { BrandMark } from "@/components/karte/ui";
import { ConsoleNav } from "@/components/karte/console-nav";
import { IconLogout, IconScan } from "@/components/karte/icons";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?dest=console");

  return (
    <div data-app="karte" className="min-h-dvh bg-paper text-ink">
      <div className="flex min-h-dvh">
        {/* サイドバー */}
        <aside className="print-hidden hidden w-60 shrink-0 flex-col border-r border-line bg-panel lg:flex">
          <div className="border-b border-line px-5 py-5">
            <Link href="/console">
              <BrandMark />
            </Link>
          </div>
          <div className="border-b border-line px-5 py-4">
            <p className="mk-label">ご契約企業</p>
            <p className="mt-1 text-sm font-medium leading-5">{user.company.name}</p>
            <p className="mt-0.5 text-xs text-ink3">{user.company.plantName}</p>
          </div>
          <ConsoleNav isAdmin={user.role === "admin"} />
          <div className="mt-auto border-t border-line px-5 py-4">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="mt-0.5 text-xs text-ink3">{user.title}</p>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href="/m"
                className="inline-flex items-center gap-1.5 text-xs text-ink2 underline underline-offset-4 hover:text-navy"
              >
                <IconScan width={14} height={14} />
                スマホ版
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-xs text-ink2 underline underline-offset-4 hover:text-alert"
                >
                  <IconLogout width={14} height={14} />
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* メイン */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* モバイル用トップバー */}
          <header className="print-hidden border-b border-line bg-panel lg:hidden">
            <div className="flex h-14 items-center justify-between px-4">
              <Link href="/console">
                <BrandMark compact />
              </Link>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-ink3">{user.company.name}</span>
                <form action={logout}>
                  <button type="submit" className="text-ink2 underline underline-offset-4">
                    ログアウト
                  </button>
                </form>
              </div>
            </div>
            <ConsoleNav isAdmin={user.role === "admin"} horizontal />
          </header>

          <main className="min-w-0 flex-1 px-5 py-8 md:px-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>

          <footer className="print-hidden border-t border-line px-8 py-4 text-xs text-ink3">
            マシンカルテ — 産業機械履歴管理・流通支援プラットフォーム / 運営: 株式会社FLYHEIT
          </footer>
        </div>
      </div>
    </div>
  );
}
