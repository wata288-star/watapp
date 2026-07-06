import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/karte/ui";
import { LoginForm } from "@/components/karte/login-form";
import { getCurrentUser } from "@/lib/karte/session";

export const metadata = { title: "ログイン" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ dest?: string; next?: string }>;
}) {
  const { dest = "console", next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(dest === "m" ? "/m" : "/console");

  return (
    <div data-app="karte" className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link href="/" className="text-sm text-ink2 hover:text-navy">
            サービス紹介へ戻る
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-12 md:items-center md:py-16">
        <div className="w-full max-w-md">
          <div className="border border-line bg-panel p-8">
            <p className="mk-label mb-1.5">
              {dest === "m" ? "スマホ版フィールドアプリ" : "WEB版コンソール"}
            </p>
            <h1 className="font-serif text-xl font-semibold tracking-wide">ログイン</h1>
            <p className="mt-2 text-[13px] leading-6 text-ink3">
              企業ごとにデータは厳格に分離されています。自社の機械と履歴のみが表示されます。
            </p>
            <div className="mk-rule my-6" />
            <LoginForm dest={dest} next={next} />
          </div>
          <div className="mt-4 flex justify-between text-xs text-ink3">
            <Link
              href={dest === "m" ? "/login?dest=console" : "/login?dest=m"}
              className="underline underline-offset-4 hover:text-navy"
            >
              {dest === "m" ? "WEB版コンソールへログイン" : "スマホ版フィールドアプリへログイン"}
            </Link>
            <Link href="/verify" className="underline underline-offset-4 hover:text-navy">
              証明書照合(ログイン不要)
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
