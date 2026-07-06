import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { certificateOf, recordsOfMachine } from "@/lib/karte/queries";
import { fmtDate, fmtDateEn } from "@/lib/karte/format";
import { qrSvg, baseUrl } from "@/lib/karte/qr";
import { GradeSeal } from "@/components/karte/ui";
import { PrintButton } from "@/components/karte/print-button";
import { IconArrowLeft, IconGlobe } from "@/components/karte/icons";
import {
  GRADE_DESCRIPTION,
  GRADE_DESCRIPTION_EN,
  RECORD_TYPE_LABEL,
  RECORD_TYPE_LABEL_EN,
} from "@/lib/karte/types";

export const metadata = { title: "履歴証明書" };

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const { lang } = await searchParams;
  const en = lang === "en";

  const cert = certificateOf(user.companyId, id);
  if (!cert) notFound();
  if (en && !cert.withEnglish) notFound();

  const idSet = new Set(cert.recordIds);
  const records = recordsOfMachine(user.companyId, cert.machineId).filter((r) => idSet.has(r.id));

  const verifyUrl = `${await baseUrl()}/verify/${cert.certNo}`;
  const svg = await qrSvg(verifyUrl);
  const m = cert.machineSnapshot;
  const s = cert.summary;
  const d = en ? fmtDateEn : fmtDate;

  const t = en
    ? {
        title: "Machine Maintenance History Certificate",
        subtitle: "機械整備履歴証明書",
        certNo: "Certificate No.",
        machineInfo: "1. Machine Information",
        name: "Machine",
        maker: "Manufacturer",
        model: "Model",
        serial: "Serial No.",
        year: "Year of manufacture",
        grade: "2. Record Completeness Grade",
        digest: "3. History Digest",
        ownership: "Period of ownership on record",
        months: "months",
        coverage: "Monthly record coverage",
        firstLast: "Record period",
        countInspection: "Periodic inspections",
        countRepair: "Repairs",
        countParts: "Parts replacements",
        countLegal: "Statutory inspections",
        countHygiene: "Hygiene records",
        verification: "4. Verification",
        verifyNote:
          "Scan the QR code or visit the URL below to verify this certificate against the records held on our server.",
        audit: "5. Integrity Review",
        auditClear:
          "Records are maintained in an append-only ledger with server-side timestamps. No anomalous entry patterns were detected by the automated review at the time of issuance.",
        auditNotes:
          "The automated review detected the following entry patterns at the time of issuance:",
        liveRecords: "Records accumulated in service",
        migratedRecords: "Migrated legacy records",
        issuer: "Issuer",
        issuedAt: "Date of issue",
        expiresAt: "Valid until",
        disclaimer:
          "This certificate attests to the authenticity of the records — when, by whom, and under what circumstances each record was registered on the append-only Machine Karte ledger. The factual accuracy of record contents and the quality or performance of the machine itself are outside the scope of certification. Quality assessment is left to the buyer and appraisers. Records migrated from legacy sources at onboarding are shown separately from records accumulated in service.",
        history: "Appendix: Maintenance History",
        parts: "Appendix: Major Parts Replacements",
        date: "Date",
        type: "Type",
        detail: "Description",
        qty: "Qty",
        historyNote:
          "Descriptions are translated summaries. Original records are maintained in Japanese on the platform.",
        issuerName: "FLYHEIT Inc. (Machine Karte Platform)",
      }
    : {
        title: "機械整備履歴証明書",
        subtitle: "Machine Maintenance History Certificate",
        certNo: "証明書番号",
        machineInfo: "1. 機械の基本情報",
        name: "機械名称",
        maker: "メーカー",
        model: "型式",
        serial: "製造番号",
        year: "製造年",
        grade: "2. 記録充実度の等級",
        digest: "3. 履歴ダイジェスト",
        ownership: "記録上の保有期間",
        months: "ヶ月",
        coverage: "月次記録カバレッジ",
        firstLast: "記録期間",
        countInspection: "定期点検",
        countRepair: "修理",
        countParts: "部品交換",
        countLegal: "法定点検",
        countHygiene: "衛生記録",
        verification: "4. 真贋照合",
        verifyNote:
          "QRコードの読み取り、または下記URLへのアクセスにより、本証明書の内容と当社サーバー上の記録との一致をどなたでも確認できます。",
        audit: "5. 審査・注記",
        auditClear:
          "記録は追記専用(編集・削除不可)で管理され、登録日時はサーバー側で自動付与されています。発行時の自動審査において、異常な記録パターンは検出されませんでした。",
        auditNotes: "発行時の自動審査において、以下の記録パターンが検出されています:",
        liveRecords: "利用開始後の蓄積記録",
        migratedRecords: "導入時の移行データ",
        issuer: "発行者",
        issuedAt: "発行日",
        expiresAt: "有効期限",
        disclaimer:
          "本証明書が証明するのは「各記録がいつ・誰によって・どのような状況で登録されたか」という記録の真正性です。記録内容の事実性および機械の品質・性能そのものは証明対象外であり、品質のご判断は買い手・査定業者に委ねられます。導入時に移行された過去の記録は、利用開始後に蓄積された記録と区別して表示しています。",
        history: "別紙: 整備履歴明細",
        parts: "別紙: 主要部品の交換歴",
        date: "作業日",
        type: "種別",
        detail: "内容",
        qty: "数量",
        historyNote: "",
        issuerName: "株式会社FLYHEIT(マシンカルテ運営)",
      };

  const allParts = records
    .filter((r) => r.parts && r.parts.length > 0)
    .flatMap((r) => r.parts!.map((p) => ({ date: r.workDate, ...p })));

  return (
    <>
      {/* ツールバー */}
      <div className="print-hidden mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/console/certificates" className="inline-flex items-center gap-2 text-sm text-ink2 hover:text-navy">
          <IconArrowLeft width={16} height={16} />
          証明書一覧へ戻る
        </Link>
        <div className="flex items-center gap-3">
          {cert.withEnglish && (
            <Link
              href={en ? `/console/certificates/${cert.id}` : `/console/certificates/${cert.id}?lang=en`}
              className="inline-flex items-center gap-2 border border-line2 bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-navy hover:text-navy"
            >
              <IconGlobe width={15} height={15} />
              {en ? "日本語版を表示" : "英語版を表示"}
            </Link>
          )}
          <PrintButton label={en ? "Print" : "証明書を印刷する"} />
        </div>
      </div>

      {/* 証明書本体 1ページ目 */}
      <div className="print-page mx-auto max-w-[720px] border border-line2 bg-white p-10 text-ink shadow-[0_1px_0_rgba(27,29,33,0.04),0_16px_40px_-28px_rgba(29,49,83,0.4)] print:max-w-none print:border-0 print:p-0 print:shadow-none">
        {/* ヘッダー */}
        <div className="flex items-start justify-between border-b-2 border-ink pb-5">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-ink2">MACHINE KARTE</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide">{t.title}</h1>
            <p className="mt-1 text-xs text-ink3">{t.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="mk-label">{t.certNo}</p>
            <p className="mt-1 font-mono text-lg tracking-wider">{cert.certNo}</p>
          </div>
        </div>

        {/* 1. 基本情報 */}
        <section className="mt-7">
          <h2 className="font-serif text-sm font-semibold tracking-wider text-navy">{t.machineInfo}</h2>
          <table className="mt-3 w-full border border-line text-sm">
            <tbody className="divide-y divide-line">
              <tr className="divide-x divide-line">
                <th className="w-36 bg-panel2 px-4 py-2.5 text-left font-medium text-ink2">{t.name}</th>
                <td className="px-4 py-2.5">{en ? m.nameEn : m.name}</td>
                <th className="w-32 bg-panel2 px-4 py-2.5 text-left font-medium text-ink2">{t.year}</th>
                <td className="w-28 px-4 py-2.5 mk-tabular">{m.yearMade}</td>
              </tr>
              <tr className="divide-x divide-line">
                <th className="bg-panel2 px-4 py-2.5 text-left font-medium text-ink2">{t.maker}</th>
                <td className="px-4 py-2.5">{en ? m.makerEn : m.maker}</td>
                <th className="bg-panel2 px-4 py-2.5 text-left font-medium text-ink2">{t.model}</th>
                <td className="px-4 py-2.5">{m.model}</td>
              </tr>
              <tr className="divide-x divide-line">
                <th className="bg-panel2 px-4 py-2.5 text-left font-medium text-ink2">{t.serial}</th>
                <td className="px-4 py-2.5 font-mono" colSpan={3}>{m.serialNo}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 2. 等級 */}
        <section className="mt-7">
          <h2 className="font-serif text-sm font-semibold tracking-wider text-navy">{t.grade}</h2>
          <div className="mt-3 flex items-center gap-6 border border-line px-6 py-5">
            <GradeSeal grade={cert.grade} size={88} />
            <div>
              <p className="font-serif text-xl font-semibold">
                {cert.grade}
                {en ? " Grade" : "等級"}
              </p>
              <p className="mt-1.5 max-w-md text-[13px] leading-6 text-ink2">
                {en ? GRADE_DESCRIPTION_EN[cert.grade] : GRADE_DESCRIPTION[cert.grade]}
              </p>
            </div>
          </div>
        </section>

        {/* 3. ダイジェスト */}
        <section className="mt-7">
          <h2 className="font-serif text-sm font-semibold tracking-wider text-navy">{t.digest}</h2>
          <div className="mt-3 grid grid-cols-3 gap-px border border-line bg-line text-center">
            {[
              { label: t.ownership, value: `${s.ownershipMonths} ${t.months}` },
              { label: t.coverage, value: `${Math.round(s.coverageRatio * 100)}%` },
              {
                label: t.firstLast,
                value: s.firstRecordAt ? `${d(s.firstRecordAt)} - ${d(s.lastRecordAt)}` : "—",
                small: true,
              },
              { label: t.countInspection, value: `${s.counts.inspection}` },
              { label: t.countRepair, value: `${s.counts.repair}` },
              { label: t.countParts, value: `${s.counts.parts}` },
            ].map((item) => (
              <div key={item.label} className="bg-white px-3 py-3.5">
                <p className={`font-serif font-semibold mk-tabular ${item.small ? "text-[13px] leading-6" : "text-lg"}`}>
                  {item.value}
                </p>
                <p className="mt-0.5 text-[11px] text-ink3">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink2">
            {(s.counts.legal > 0 || s.counts.hygiene > 0) && (
              <>
                {t.countLegal}: {s.counts.legal} / {t.countHygiene}: {s.counts.hygiene}
                {" — "}
              </>
            )}
            {t.liveRecords}: {s.counts.live} / {t.migratedRecords}: {s.counts.migrated}
          </p>
        </section>

        {/* 4. 照合 */}
        <section className="mt-7">
          <h2 className="font-serif text-sm font-semibold tracking-wider text-navy">{t.verification}</h2>
          <div className="mt-3 flex items-center gap-6 border border-line px-6 py-5">
            <div className="h-24 w-24 shrink-0 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="min-w-0 text-[13px] leading-6 text-ink2">
              <p>{t.verifyNote}</p>
              <p className="mt-1.5 break-all font-mono text-xs">{verifyUrl}</p>
            </div>
          </div>
        </section>

        {/* 5. 審査・注記 */}
        <section className="mt-7">
          <h2 className="font-serif text-sm font-semibold tracking-wider text-navy">{t.audit}</h2>
          {(cert.auditFlags ?? []).length === 0 ? (
            <p className="mt-3 border border-line px-5 py-4 text-[13px] leading-6 text-ink2">
              {t.auditClear}
            </p>
          ) : (
            <div className="mt-3 border border-warn/40 bg-warnsoft px-5 py-4">
              <p className="text-[13px] leading-6 text-warn">{t.auditNotes}</p>
              <ul className="mt-2 space-y-1.5">
                {(cert.auditFlags ?? []).map((f) => (
                  <li key={f.code} className="text-[13px] leading-6 text-warn">
                    <span className="font-semibold">{en ? f.labelEn : f.label}</span> —{" "}
                    {en ? f.detailEn : f.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 発行者 */}
        <div className="mt-8 flex items-end justify-between border-t-2 border-ink pt-5">
          <div className="text-sm">
            <p className="mk-label">{t.issuer}</p>
            <p className="mt-1 font-serif font-semibold">{t.issuerName}</p>
          </div>
          <div className="text-right text-sm">
            <p className="mk-tabular">
              <span className="text-ink3">{t.issuedAt}: </span>
              {d(cert.issuedAt)}
            </p>
            <p className="mt-0.5 mk-tabular">
              <span className="text-ink3">{t.expiresAt}: </span>
              {d(cert.expiresAt)}
            </p>
          </div>
        </div>
        <p className="mt-5 border border-line bg-panel2 px-4 py-3 text-[11px] leading-5 text-ink2 print:bg-white">
          {t.disclaimer}
        </p>
      </div>

      {/* 2ページ目以降: 履歴明細 */}
      <div className="mx-auto mt-8 max-w-[720px] border border-line2 bg-white p-10 text-ink shadow-[0_1px_0_rgba(27,29,33,0.04),0_16px_40px_-28px_rgba(29,49,83,0.4)] print:mt-0 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <h2 className="font-serif text-lg font-semibold">{t.history}</h2>
          <p className="font-mono text-xs text-ink3">{cert.certNo}</p>
        </div>
        {en && t.historyNote && <p className="mt-3 text-xs leading-5 text-ink3">{t.historyNote}</p>}
        <table className="mt-4 w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink3">
              <th className="py-2 pr-4 font-medium">{t.date}</th>
              <th className="py-2 pr-4 font-medium">{t.type}</th>
              <th className="py-2 font-medium">{t.detail}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="w-32 py-2 pr-4 align-top font-mono text-xs mk-tabular">
                  {r.workDate}
                  {r.migrated && (
                    <span className="ml-1 font-sans text-[10px] text-ink3">{en ? "(migrated)" : "(移行)"}</span>
                  )}
                </td>
                <td className="w-36 py-2 pr-4 align-top text-xs text-ink2">
                  {en ? RECORD_TYPE_LABEL_EN[r.type] : RECORD_TYPE_LABEL[r.type]}
                </td>
                <td className="py-2 align-top">
                  <span className="font-medium">{en ? r.titleEn : r.title}</span>
                  {!en && r.memo && <span className="mt-0.5 block text-xs leading-5 text-ink3">{r.memo}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {allParts.length > 0 && (
          <>
            <h2 className="mt-10 border-b border-ink pb-3 font-serif text-lg font-semibold">{t.parts}</h2>
            <table className="mt-4 w-full text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink3">
                  <th className="py-2 pr-4 font-medium">{t.date}</th>
                  <th className="py-2 pr-4 font-medium">{t.detail}</th>
                  <th className="py-2 text-right font-medium">{t.qty}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {allParts.map((p, i) => (
                  <tr key={i}>
                    <td className="w-32 py-2 pr-4 font-mono text-xs mk-tabular">{p.date}</td>
                    <td className="py-2 pr-4">{en ? p.nameEn : p.name}</td>
                    <td className="py-2 text-right mk-tabular">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
