import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { machineOf, recordsOfMachine, salesOf, certificatesOf } from "@/lib/karte/queries";
import { computeGrade, nextLegalDue } from "@/lib/karte/grade";
import { fmtDate, todayIso } from "@/lib/karte/format";
import { qrSvg, baseUrl } from "@/lib/karte/qr";
import { PageTitle, StatusBadge, KV, SecondaryLink, PrimaryLink, GradeSeal } from "@/components/karte/ui";
import { RecordTimeline } from "@/components/karte/record-timeline";
import { IconPlus, IconPrint, IconCert, IconExchange, IconAlert } from "@/components/karte/icons";
import { issueCertificate } from "@/app/actions/karte";

export const metadata = { title: "機械カルテ" };

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const machine = machineOf(user.companyId, id);
  if (!machine) notFound();

  const records = recordsOfMachine(user.companyId, machine.id);
  const { grade, summary } = computeGrade(machine, records);
  const due = nextLegalDue(machine, records);
  const today = todayIso();
  const overdue = due != null && due < today;

  const url = `${await baseUrl()}/k/${machine.code}`;
  const svg = await qrSvg(url);

  const machineCerts = certificatesOf(user.companyId).filter((c) => c.machineId === machine.id);
  const activeSale = salesOf(user.companyId).find(
    (s) => s.machineId === machine.id && !["closed", "cancelled"].includes(s.status),
  );
  const canSell = user.role === "admin" && machine.status !== "sold" && !activeSale;

  return (
    <>
      <PageTitle
        overline={`機械台帳 / ${machine.category}`}
        title={machine.name}
        action={
          <>
            <SecondaryLink href={`/console/machines/${machine.id}/label`}>
              <IconPrint width={15} height={15} />
              QRラベル印刷
            </SecondaryLink>
            <PrimaryLink href={`/console/machines/${machine.id}/record`}>
              <IconPlus width={15} height={15} />
              記録を追加
            </PrimaryLink>
          </>
        }
      >
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <StatusBadge status={machine.status} />
          <span className="text-sm text-ink2">
            {machine.maker} {machine.model}
          </span>
          <span className="font-mono text-xs text-ink3">{machine.serialNo}</span>
        </div>
      </PageTitle>

      {overdue && (
        <div className="mb-6 flex items-center gap-3 border border-alert/30 bg-alertsoft px-5 py-3.5 text-sm text-alert">
          <IconAlert width={18} height={18} className="shrink-0" />
          <span>
            {machine.legalPlan?.kind}の期限({fmtDate(due)})を超過しています。実施後、記録を登録してください。
          </span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* 左カラム: 基本情報 */}
        <div className="space-y-6">
          <section className="border border-line bg-panel">
            <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">基本情報</h2>
            <dl className="grid grid-cols-2 gap-x-6 px-6 py-3">
              <KV label="メーカー">{machine.maker}</KV>
              <KV label="型式">{machine.model}</KV>
              <KV label="製造番号"><span className="font-mono">{machine.serialNo || "—"}</span></KV>
              <KV label="製造年"><span className="mk-tabular">{machine.yearMade}年</span></KV>
              <KV label="導入">
                {fmtDate(machine.purchasedAt)}
                <span className="ml-1 text-xs text-ink3">({machine.acquisition === "new" ? "新品" : "中古"})</span>
              </KV>
              <KV label="設置場所">{machine.location || "—"}</KV>
              <KV label="カルテ登録日">{fmtDate(machine.registeredAt)}</KV>
              <KV label="定格・主要仕様">{machine.ratedPower || "—"}</KV>
            </dl>
            {machine.notes && (
              <p className="border-t border-line px-6 py-4 text-[13px] leading-6 text-ink2">{machine.notes}</p>
            )}
          </section>

          {/* QR */}
          <section className="border border-line bg-panel">
            <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">機械QRコード</h2>
            <div className="flex items-center gap-6 px-6 py-5">
              <div className="h-28 w-28 shrink-0 p-1 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              <div className="min-w-0">
                <p className="font-mono text-lg tracking-widest">{machine.code}</p>
                <p className="mt-1 break-all text-xs text-ink3">{url}</p>
                <p className="mt-2 text-xs leading-5 text-ink3">
                  スマートフォンで読み取ると、この機械のカルテが開きます。
                </p>
              </div>
            </div>
          </section>

          {/* 法定点検 */}
          {machine.legalPlan && (
            <section className="border border-line bg-panel">
              <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">法定点検・衛生記録</h2>
              <div className="px-6 py-4">
                <p className="text-sm font-medium">{machine.legalPlan.kind}</p>
                <p className="mt-1 text-xs leading-5 text-ink3">{machine.legalPlan.note}</p>
                <p className={`mt-3 text-sm mk-tabular ${overdue ? "font-medium text-alert" : "text-ink2"}`}>
                  次回期限: {fmtDate(due)}
                  {overdue && "(超過)"}
                </p>
              </div>
            </section>
          )}

          {/* 書類 */}
          <section className="border border-line bg-panel">
            <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">関連書類</h2>
            {machine.docs.length === 0 ? (
              <p className="px-6 py-4 text-sm text-ink3">登録された書類はありません。</p>
            ) : (
              <ul className="divide-y divide-line">
                {machine.docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <span>{d.title}</span>
                    <span className="text-xs text-ink3">{d.kind}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 証明書・売却 (管理者) */}
          {user.role === "admin" && (
            <section className="border border-line bg-panel">
              <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">資産価値への転換</h2>
              <div className="space-y-5 px-6 py-5">
                <div className="flex items-start gap-4">
                  <GradeSeal grade={grade} size={64} />
                  <div className="text-[13px] leading-6 text-ink2">
                    <p>
                      現在の履歴から算定した記録充実度は<span className="font-serif font-semibold text-navy">{grade}等級</span>相当です。
                    </p>
                    <p className="mt-1 text-xs text-ink3">
                      履歴カバレッジ {Math.round(summary.coverageRatio * 100)}% / 保有 {summary.ownershipMonths}ヶ月
                    </p>
                  </div>
                </div>
                <form action={issueCertificate} className="space-y-3 border-t border-line pt-4">
                  <input type="hidden" name="machineId" value={machine.id} />
                  <label className="flex items-center gap-2.5 text-sm">
                    <input type="checkbox" name="withEnglish" className="accent-[#1d3153]" />
                    英語版を同時に発行する(追加1万円)
                  </label>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy2"
                  >
                    <IconCert width={16} height={16} />
                    履歴証明書を発行する(2万円)
                  </button>
                  <p className="text-xs leading-5 text-ink3">
                    発行時点の履歴を確定して等級を付与します。有効期限は発行から6ヶ月です。
                  </p>
                </form>
                {machineCerts.length > 0 && (
                  <ul className="space-y-1.5 border-t border-line pt-4 text-sm">
                    {machineCerts.map((c) => (
                      <li key={c.id} className="flex items-center justify-between">
                        <Link href={`/console/certificates/${c.id}`} className="font-mono text-navy underline underline-offset-4">
                          {c.certNo}
                        </Link>
                        <span className="text-xs text-ink3 mk-tabular">
                          {c.grade}等級 / {fmtDate(c.issuedAt)}発行
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="border-t border-line pt-4">
                  {activeSale ? (
                    <Link href="/console/sales" className="inline-flex items-center gap-2 text-sm font-medium text-copper underline underline-offset-4">
                      <IconExchange width={15} height={15} />
                      進行中の売却案件({activeSale.caseNo})を確認する
                    </Link>
                  ) : canSell ? (
                    <Link
                      href={`/console/sales?machine=${machine.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-copper underline underline-offset-4"
                    >
                      <IconExchange width={15} height={15} />
                      この機械の売却を相談する
                    </Link>
                  ) : (
                    <p className="text-xs text-ink3">この機械は売却済みです。</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 右カラム: 履歴 */}
        <div>
          <div className="mb-4 grid grid-cols-4 gap-px border border-line bg-line text-center">
            {[
              { label: "点検", value: summary.counts.inspection },
              { label: "修理", value: summary.counts.repair },
              { label: "部品交換", value: summary.counts.parts },
              { label: "法定・衛生", value: summary.counts.legal + summary.counts.hygiene },
            ].map((s) => (
              <div key={s.label} className="bg-panel px-2 py-3">
                <p className="font-serif text-xl font-semibold mk-tabular">{s.value.toLocaleString("ja-JP")}</p>
                <p className="mt-0.5 text-xs text-ink3">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold">整備履歴(全{records.length}件)</h2>
            {summary.firstRecordAt && (
              <p className="text-xs text-ink3 mk-tabular">
                {fmtDate(summary.firstRecordAt)} 〜 {fmtDate(summary.lastRecordAt)}
              </p>
            )}
          </div>
          <RecordTimeline records={records} initialCount={15} />
          {summary.majorParts.length > 0 && (
            <section className="mt-6 border border-line bg-panel">
              <h3 className="border-b border-line px-5 py-3 text-sm font-semibold">主要部品の交換歴(直近)</h3>
              <ul className="divide-y divide-line text-sm">
                {summary.majorParts.map((p, i) => (
                  <li key={i} className="flex justify-between px-5 py-2.5">
                    <span>{p.name}</span>
                    <span className="text-ink3 mk-tabular">{p.qty}点</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
