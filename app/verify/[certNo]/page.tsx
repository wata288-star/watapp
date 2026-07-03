import Link from "next/link";
import { BrandMark, GradeSeal } from "@/components/karte/ui";
import { IconCheck, IconX } from "@/components/karte/icons";
import { certificateByNo } from "@/lib/karte/queries";
import { fmtDate } from "@/lib/karte/format";
import { GRADE_DESCRIPTION } from "@/lib/karte/types";

export const metadata = { title: "照合結果" };

export default async function VerifyResultPage({
  params,
}: {
  params: Promise<{ certNo: string }>;
}) {
  const { certNo: raw } = await params;
  const certNo = decodeURIComponent(raw).toUpperCase();
  const cert = certificateByNo(certNo);
  const today = new Date().toISOString().slice(0, 10);
  const valid = cert != null && !cert.revoked && cert.expiresAt >= today;
  const expired = cert != null && !cert.revoked && cert.expiresAt < today;

  return (
    <div data-app="karte" className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link href="/verify" className="text-sm text-ink2 hover:text-navy">
            別の証明書を照合する
          </Link>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-5 py-12">
        <div className="w-full max-w-lg">
          {/* 照合結果 */}
          <div
            className={`flex items-center gap-4 border px-6 py-5 ${
              valid
                ? "border-ok/30 bg-oksoft"
                : expired
                  ? "border-warn/30 bg-warnsoft"
                  : "border-alert/30 bg-alertsoft"
            }`}
          >
            {valid ? (
              <IconCheck width={28} height={28} className="shrink-0 text-ok" />
            ) : (
              <IconX width={28} height={28} className={`shrink-0 ${expired ? "text-warn" : "text-alert"}`} />
            )}
            <div>
              <p
                className={`font-serif text-lg font-semibold ${
                  valid ? "text-ok" : expired ? "text-warn" : "text-alert"
                }`}
              >
                {valid
                  ? "有効な証明書です"
                  : expired
                    ? "有効期限が切れた証明書です"
                    : "該当する証明書が見つかりません"}
              </p>
              <p className="mt-0.5 font-mono text-sm tracking-wider text-ink2">{certNo}</p>
            </div>
          </div>

          {cert ? (
            <div className="mt-6 border border-line bg-panel">
              <div className="flex items-start justify-between border-b border-line px-6 py-5">
                <div>
                  <p className="mk-label">機械整備履歴証明書</p>
                  <p className="mt-1 font-serif text-lg font-semibold">{cert.machineSnapshot.name}</p>
                  <p className="mt-0.5 text-sm text-ink2">
                    {cert.machineSnapshot.maker} {cert.machineSnapshot.model}
                  </p>
                </div>
                <GradeSeal grade={cert.grade} size={72} />
              </div>
              <dl className="divide-y divide-line px-6 text-sm">
                <div className="flex justify-between py-3">
                  <dt className="text-ink3">記録充実度</dt>
                  <dd className="max-w-[60%] text-right">
                    <span className="font-serif font-semibold">{cert.grade}等級</span>
                    <span className="mt-0.5 block text-xs leading-5 text-ink3">
                      {GRADE_DESCRIPTION[cert.grade]}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink3">製造番号</dt>
                  <dd className="font-mono">{cert.machineSnapshot.serialNo}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink3">製造年</dt>
                  <dd className="mk-tabular">{cert.machineSnapshot.yearMade}年</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink3">記録件数</dt>
                  <dd className="mk-tabular">
                    点検{cert.summary.counts.inspection + cert.summary.counts.legal}件 / 修理
                    {cert.summary.counts.repair}件 / 部品交換{cert.summary.counts.parts}件
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink3">発行日</dt>
                  <dd className="mk-tabular">{fmtDate(cert.issuedAt)}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink3">有効期限</dt>
                  <dd className={`mk-tabular ${expired ? "text-warn" : ""}`}>{fmtDate(cert.expiresAt)}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-ink3">発行者</dt>
                  <dd>株式会社FLYHEIT(マシンカルテ運営)</dd>
                </div>
              </dl>
              <p className="border-t border-line px-6 py-4 text-xs leading-5 text-ink3">
                本証明書は、マシンカルテに蓄積された記録の充実度と真正性を証明するものであり、機械の品質・性能を保証するものではありません。品質のご判断は買い手・査定業者にお願いしています。
              </p>
            </div>
          ) : (
            <div className="mt-6 border border-line bg-panel px-6 py-5 text-sm leading-7 text-ink2">
              入力された番号の証明書は登録されていません。番号をお確かめのうえ、再度照合してください。証明書の真贋にご不明点がある場合は、券面の発行者情報までお問い合わせください。
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
