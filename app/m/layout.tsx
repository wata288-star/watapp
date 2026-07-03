import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { MobileNav } from "@/components/karte/mobile-nav";
import { BrandMark } from "@/components/karte/ui";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?dest=m");

  return (
    <div data-app="karte" className="min-h-dvh bg-paper text-ink lg:bg-line">
      {/* デスクトップではスマホ幅のフレームで表示 */}
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper lg:border-x lg:border-line2">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/m">
              <BrandMark compact />
            </Link>
            <span className="max-w-[50%] truncate text-xs text-ink3">{user.company.name}</span>
          </div>
        </header>
        <main className="flex-1 pb-24">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
