import Link from "next/link";
import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, recordsOf, salesOf, certificatesOf, userName } from "@/lib/karte/queries";
import { nextLegalDue } from "@/lib/karte/grade";
import { fmtDate, fmtDateShort, todayIso, addMonthsIso } from "@/lib/karte/format";
import { PageTitle, Stat, TypeBadge, SaleBadge, PrimaryLink, SecondaryLink } from "@/components/karte/ui";
import { IconAlert, IconChevronRight, IconPlus, IconQr } from "@/components/karte/icons";
import { SALE_STATUS_LABEL } from "@/lib/karte/types";

export const metadata = { title: "ダッシュボード" };

export default async function ConsoleDashboard() {
  const user = (await getCurrentUser())!;
  const machines = machinesOf(user.companyId);
  const records = recordsOf(user.companyId);
  const sales = salesOf(user.companyId);
  const certs = certificatesOf(user.companyId);

  const today = todayIso();
  const thisMonth = today.slice(0, 7);
  const recordsThisMonth = records.filter((r) => r.workDate.startsWith(thisMonth));
  const activeMachines = machines.filter((m) => m.status === "active");

  // 法定点検・衛生記録の期限管理
  const dues = machines
    .filter((m) => m.legalPlan && m.status !== "sold")
    .map((m) => {
      const machineRecords = records.filter((r) => r.machineId === m.id);
      const due = nextLegalDue(m, machineRecords)!;
      return { machine: m, due, overdue: due < today, soon: due >= today && due <= addMonthsIso(today, 2) };
    })
    .filter((d) => d.overdue || d.soon)
    .sort((a, b) => (a.due < b.due ? -1 : 1));

  const activeSales = sales.filter((s) => !["closed", "cancelled"].includes(s.status));
  const recentRecords = records.slice(0, 8);

  return (
    <>
      <PageTitle
        overline={`${user.company.name} ${user.company.plantName}`}
        title="ダッシュボード"
        action={
          <>
            <SecondaryLink href="/console/machines/new">
              <IconPlus width={15} height={15} />
              機械を登録
            </SecondaryLink>
            <PrimaryLink href="/console/machines">
              機械台帳を開く
              <IconChevronRight width={15} height={15} />
            </PrimaryLink>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="登録機械" value={machines.filter((m) => m.status !== "sold").length} unit="台" sub={`稼働中 ${activeMachines.length}台`} />
        <Stat label="今月の記録" value={recordsThisMonth.length} unit="件" sub={`累計 ${records.length.toLocaleString("ja-JP")}件`} />
        <Stat
          label="要対応(点検期限)"
          value={dues.length}
          unit="件"
          tone={dues.some((d) => d.overdue) ? "alert" : dues.length > 0 ? "copper" : "ink"}
          sub={dues.some((d) => d.overdue) ? "期限超過あり" : "2ヶ月以内の期限"}
        />
        <Stat label="進行中の売却案件" value={activeSales.length} unit="件" sub={`証明書発行済 ${certs.length}通`} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* 最近の記録 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">最近の整備記録</h2>
            <Link href="/console/records" className="text-xs text-navy underline underline-offset-4">
              すべての記録
            </Link>
          </div>
          <div className="divide-y divide-line border border-line bg-panel">
            {recentRecords.map((r) => {
              const machine = machines.find((m) => m.id === r.machineId);
              return (
                <Link
                  key={r.id}
                  href={`/console/machines/${r.machineId}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-panel2"
                >
                  <span className="w-20 shrink-0 font-mono text-xs text-ink3 mk-tabular">
                    {fmtDateShort(r.workDate)}
                  </span>
                  <TypeBadge type={r.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    <span className="block truncate text-xs text-ink3">
                      {machine?.name} — {userName(r.userId)}
                    </span>
                  </span>
                  <IconChevronRight width={15} height={15} className="shrink-0 text-line2" />
                </Link>
              );
            })}
          </div>
        </section>

        <div className="space-y-8">
          {/* 点検期限 */}
          <section>
            <h2 className="mb-3 font-serif text-lg font-semibold">法定点検・衛生記録の期限</h2>
            {dues.length === 0 ? (
              <p className="border border-line bg-panel px-5 py-6 text-sm text-ink3">
                2ヶ月以内に期限を迎える法定点検はありません。
              </p>
            ) : (
              <ul className="divide-y divide-line border border-line bg-panel">
                {dues.map(({ machine, due, overdue }) => (
                  <li key={machine.id}>
                    <Link
                      href={`/console/machines/${machine.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-panel2"
                    >
                      <IconAlert
                        width={17}
                        height={17}
                        className={overdue ? "shrink-0 text-alert" : "shrink-0 text-warn"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{machine.name}</span>
                        <span className="block text-xs text-ink3">{machine.legalPlan!.kind}</span>
                      </span>
                      <span className={`shrink-0 text-xs mk-tabular ${overdue ? "font-medium text-alert" : "text-warn"}`}>
                        {overdue ? "期限超過" : "期限"} {fmtDate(due)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 売却案件 */}
          {user.role === "admin" && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold">売却案件</h2>
                <Link href="/console/sales" className="text-xs text-navy underline underline-offset-4">
                  売却・送客へ
                </Link>
              </div>
              {activeSales.length === 0 ? (
                <p className="border border-line bg-panel px-5 py-6 text-sm text-ink3">
                  進行中の売却案件はありません。
                </p>
              ) : (
                <ul className="divide-y divide-line border border-line bg-panel">
                  {activeSales.map((s) => {
                    const machine = machines.find((m) => m.id === s.machineId);
                    return (
                      <li key={s.id}>
                        <Link
                          href="/console/sales"
                          className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-panel2"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{machine?.name}</span>
                            <span className="block text-xs text-ink3">
                              {s.caseNo} — {SALE_STATUS_LABEL[s.status]}
                            </span>
                          </span>
                          <SaleBadge status={s.status} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {/* QR案内 */}
          <section className="border border-line bg-navy px-5 py-5 text-white">
            <div className="flex items-start gap-4">
              <IconQr width={28} height={28} className="mt-0.5 shrink-0 text-white/80" />
              <div>
                <h3 className="font-serif text-base font-semibold">現場はQRコードから</h3>
                <p className="mt-1.5 text-xs leading-5 text-white/70">
                  機械に貼付したQRコードをスマートフォンで読み取ると、その機械のカルテが開きます。記録は「写真と一言メモ」だけで完了します。
                </p>
                <Link href="/m" className="mt-3 inline-block text-xs font-medium text-white underline underline-offset-4">
                  スマホ版フィールドアプリを開く
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
