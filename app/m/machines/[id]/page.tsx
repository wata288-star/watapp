import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { machineOf, recordsOfMachine } from "@/lib/karte/queries";
import { computeGrade, nextLegalDue } from "@/lib/karte/grade";
import { assessReadiness } from "@/lib/karte/master";
import { fmtDate, todayIso } from "@/lib/karte/format";
import { StatusBadge, KV } from "@/components/karte/ui";
import { RecordTimeline } from "@/components/karte/record-timeline";
import { IconPlus, IconAlert, IconCheck } from "@/components/karte/icons";

export const metadata = { title: "機械カルテ" };

export default async function MobileMachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ recorded?: string; via?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const { recorded, via } = await searchParams;
  const machine = machineOf(user.companyId, id);
  if (!machine) notFound();

  const records = recordsOfMachine(user.companyId, machine.id);
  const { summary } = computeGrade(machine, records);
  const due = nextLegalDue(machine, records);
  const overdue = due != null && due < todayIso();
  const readiness = assessReadiness(machine, records, todayIso());

  return (
    <div className="px-4 py-6">
      {recorded && (
        <p className="mb-4 flex items-center gap-2.5 border border-ok/30 bg-oksoft px-4 py-3 text-sm font-medium text-ok">
          <IconCheck width={17} height={17} />
          記録を保存しました。
        </p>
      )}

      {/* ヘッダー */}
      <div className="border border-line bg-panel px-5 py-5">
        <div className="flex items-center gap-2.5">
          <h1 className="font-serif text-lg font-semibold">{machine.name}</h1>
          <StatusBadge status={machine.status} />
        </div>
        <p className="mt-1 text-sm text-ink2">
          {machine.maker} {machine.model}
        </p>
        <p className="mt-0.5 font-mono text-xs text-ink3">{machine.serialNo}</p>
        <div className="mt-4 grid grid-cols-3 gap-px border border-line bg-line text-center">
          {[
            { label: "記録", value: `${summary.counts.total}件` },
            { label: "点検", value: `${summary.counts.inspection + summary.counts.legal + summary.counts.hygiene}件` },
            { label: "修理・交換", value: `${summary.counts.repair + summary.counts.parts}件` },
          ].map((sItem) => (
            <div key={sItem.label} className="bg-panel px-2 py-2.5">
              <p className="font-serif text-base font-semibold mk-tabular">{sItem.value}</p>
              <p className="mt-0.5 text-[10px] text-ink3">{sItem.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 記録CTA */}
      <div className="mt-4 grid gap-2">
        <Link
          href={`/m/machines/${machine.id}/inspect${via === "qr" ? "?via=qr" : ""}`}
          className="flex items-center justify-center gap-2.5 bg-navy px-4 py-4 text-sm font-medium text-white transition-colors hover:bg-navy2"
        >
          <IconCheck width={17} height={17} />
          定期自主整備を開始する
        </Link>
        <Link
          href={`/m/machines/${machine.id}/record${via === "qr" ? "?via=qr" : ""}`}
          className="flex items-center justify-center gap-2.5 border border-line2 bg-panel px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-navy hover:text-navy"
        >
          <IconPlus width={16} height={16} />
          写真と一言メモで記録する(修理・気づき)
        </Link>
      </div>

      {/* 法定点検アラート */}
      {machine.legalPlan && (
        <div
          className={`mt-4 flex items-start gap-3 border px-4 py-3.5 text-[13px] leading-6 ${
            overdue ? "border-alert/30 bg-alertsoft text-alert" : "border-line bg-panel text-ink2"
          }`}
        >
          <IconAlert width={17} height={17} className={`mt-0.5 shrink-0 ${overdue ? "text-alert" : "text-warn"}`} />
          <p>
            {machine.legalPlan.kind}
            <br />
            <span className="mk-tabular">
              次回期限 {fmtDate(due)}
              {overdue && "(超過)"}
            </span>
          </p>
        </div>
      )}

      {/* 査定準備状況 */}
      <div className="mt-4 border border-line bg-panel px-4 py-3.5">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold">査定準備状況</p>
          <p className="font-serif text-base font-semibold mk-tabular">
            {readiness.highOk}
            <span className="text-xs font-normal text-ink3"> / {readiness.highTotal}</span>
          </p>
        </div>
        <div className="mt-1.5 h-1 w-full bg-panel2">
          <div
            className="h-full bg-navy"
            style={{ width: `${Math.round((readiness.highOk / Math.max(readiness.highTotal, 1)) * 100)}%` }}
          />
        </div>
        {readiness.missingHigh.length > 0 ? (
          <p className="mt-2 text-[11px] leading-5 text-ink3">
            記録が薄い項目:{" "}
            <span className="text-copper">
              {readiness.missingHigh.slice(0, 3).map((s) => s.item.label).join(" / ")}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-[11px] leading-5 text-ok">査定で重視される項目は記録済みです。</p>
        )}
      </div>

      {/* 履歴 */}
      <h2 className="mb-2.5 mt-7 mk-label">整備履歴(全{records.length}件)</h2>
      <RecordTimeline
        records={records}
        initialCount={10}
        dense
        correctionBase={`/m/machines/${machine.id}/record`}
      />

      {/* 基本情報 */}
      <h2 className="mb-2.5 mt-7 mk-label">基本情報</h2>
      <div className="border border-line bg-panel px-5 py-2">
        <dl className="grid grid-cols-2 gap-x-5">
          <KV label="製造年"><span className="mk-tabular">{machine.yearMade}年</span></KV>
          <KV label="導入">{fmtDate(machine.purchasedAt)}</KV>
          <KV label="設置場所">{machine.location || "—"}</KV>
          <KV label="機械コード"><span className="font-mono">{machine.code}</span></KV>
          <KV label="定格・主要仕様">{machine.ratedPower || "—"}</KV>
          <KV label="カルテ登録">{fmtDate(machine.registeredAt)}</KV>
        </dl>
        {machine.notes && (
          <p className="border-t border-line py-3 text-[13px] leading-6 text-ink2">{machine.notes}</p>
        )}
      </div>

      {/* 書類 */}
      {machine.docs.length > 0 && (
        <>
          <h2 className="mb-2.5 mt-7 mk-label">関連書類</h2>
          <ul className="divide-y divide-line border border-line bg-panel">
            {machine.docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{doc.title}</span>
                <span className="text-xs text-ink3">{doc.kind}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
