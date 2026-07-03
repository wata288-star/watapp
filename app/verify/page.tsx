import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/karte/ui";
import { IconShield } from "@/components/karte/icons";

export const metadata = { title: "証明書照合" };

export default async function VerifyIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ certNo?: string }>;
}) {
  const { certNo } = await searchParams;
  if (certNo && certNo.trim()) redirect(`/verify/${encodeURIComponent(certNo.trim().toUpperCase())}`);

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

      <main className="flex flex-1 items-start justify-center px-5 py-12 md:items-center">
        <div className="w-full max-w-lg">
          <div className="border border-line bg-panel p-8">
            <div className="flex items-center gap-3">
              <IconShield width={24} height={24} className="text-navy" />
              <h1 className="font-serif text-xl font-semibold tracking-wide">履歴証明書の照合</h1>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-ink2">
              証明書に記載された番号を入力すると、当社サーバー上の記録と証明書の内容が一致するかを、どなたでも確認できます。証明書のQRコードを読み取った場合も本ページに接続されます。
            </p>
            <form method="GET" action="/verify" className="mt-6 flex gap-2">
              <input
                name="certNo"
                required
                placeholder="MC-2026-0007"
                className="w-full border border-line2 bg-panel px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider outline-none focus:border-navy"
              />
              <button
                type="submit"
                className="shrink-0 bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy2"
              >
                照合する
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-ink3">
              照合結果には、証明書に記載された範囲の情報のみが表示されます。保有企業の内部情報が開示されることはありません。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
