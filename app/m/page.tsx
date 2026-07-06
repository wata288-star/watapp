import Link from "next/link";
import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, recordsOf } from "@/lib/karte/queries";
import { nextLegalDue } from "@/lib/karte/grade";
import { fmtDate, fmtDateShort, todayIso, addMonthsIso } from "@/lib/karte/format";
import { TypeBadge } from "@/components/karte/ui";
import { IconScan, IconAlert, IconChevronRight, IconLogout } from "@/components/karte/icons";
import { logout } from "@/app/actions/karte";

export const metadata = { title: "フィールドアプリ" };

export default async function MobileHome() {
  const user = (await getCurrentUser())!;
  const machines = machinesOf(user.companyId);
  const records = recordsOf(user.companyId);
  const today = todayIso();

  const myRecordsThisMonth = records.filter(
    (r) => r.userId === user.id && r.workDate.startsWith(today.slice(0, 7)),
  ).length;

  const dues = machines
    .filter((m) => m.legalPlan && m.status !== "sold")
    .map((m) => {
      const machineRecords = records.filter((r) => r.machineId === m.id);
      const due = nextLegalDue(m, machineRecords)!;
      return { machine: m, due, overdue: due < today };
    })
    .filter((d) => d.overdue || d.due <= addMonthsIso(today, 2))
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, 4);

  const recent = records.slice(0, 6);

  return (
    <div className="px-4 py-6">
      {/* あいさつ */}
      <div className="flex items-start justify-between">
        <div>
          <p className="mk-label">{user.company.plantName}</p>
          <h1 className="mt-1 font-serif text-xl font-semibold">{user.name} さん</h1>
          <p className="mt-1 text-xs text-ink3 mk-tabular">今月の記録 {myRecordsThisMonth}件</p>
        </div>
        <form action={logout}>
          <button type="submit" className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink3">
            <IconLogout width={14} height={14} />
            ログアウト
          </button>
        </form>
      </div>

      {/* スキャンCTA */}
      <Link
        href="/m/scan"
        className="mt-6 flex items-center justify-between bg-navy px-6 py-6 text-white transition-colors hover:bg-navy2"
      >
        <div>
          <p className="font-serif text-lg font-semibold">QRコードを読み取る</p>
          <p className="mt-1 text-xs text-white/70">機械のQRラベルにかざすとカルテが開きます</p>
        </div>
        <IconScan width={36} height={36} className="shrink-0 text-white/85" />
      </Link>

      {/* 要対応 */}
      {dues.length > 0 && (
        <section className="mt-7">
          <h2 className="mk-label mb-2.5">要対応 — 法定点検・衛生記録</h2>
          <ul className="divide-y divide-line border border-line bg-panel">
            {dues.map(({ machine, due, overdue }) => (
              <li key={machine.id}>
                <Link href={`/m/machines/${machine.id}`} className="flex items-center gap-3 px-4 py-3.5">
                  <IconAlert width={17} height={17} className={overdue ? "shrink-0 text-alert" : "shrink-0 text-warn"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{machine.name}</span>
                    <span className={`block text-xs mk-tabular ${overdue ? "text-alert" : "text-ink3"}`}>
                      {overdue ? "期限超過" : "期限"} {fmtDate(due)}
                    </span>
                  </span>
                  <IconChevronRight width={15} height={15} className="shrink-0 text-line2" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 最近の記録 */}
      <section className="mt-7">
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="mk-label">最近の記録</h2>
          <Link href="/m/records" className="text-xs text-navy underline underline-offset-4">
            すべて見る
          </Link>
        </div>
        <ul className="divide-y divide-line border border-line bg-panel">
          {recent.map((r) => {
            const m = machines.find((x) => x.id === r.machineId);
            return (
              <li key={r.id}>
                <Link href={`/m/machines/${r.machineId}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-14 shrink-0 font-mono text-[11px] text-ink3 mk-tabular">
                    {fmtDateShort(r.workDate).slice(5)}
                  </span>
                  <TypeBadge type={r.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{r.title}</span>
                    <span className="block truncate text-[11px] text-ink3">{m?.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* WEB版への導線 */}
      <p className="mt-7 text-center text-xs text-ink3">
        証明書の発行・売却相談は
        <Link href="/console" className="mx-1 text-navy underline underline-offset-4">
          WEB版コンソール
        </Link>
        から行えます。
      </p>
    </div>
  );
}
