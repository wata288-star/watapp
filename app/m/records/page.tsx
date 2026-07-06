import Link from "next/link";
import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, recordsOf, userName } from "@/lib/karte/queries";
import { fmtDateShort } from "@/lib/karte/format";
import { TypeBadge } from "@/components/karte/ui";

export const metadata = { title: "履歴" };

export default async function MobileRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string; limit?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { mine, limit: limitRaw } = await searchParams;
  const onlyMine = mine === "1";
  const limit = Math.min(Number(limitRaw) || 30, 500);

  const machines = machinesOf(user.companyId);
  let records = recordsOf(user.companyId);
  if (onlyMine) records = records.filter((r) => r.userId === user.id);
  const total = records.length;
  const visible = records.slice(0, limit);

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 font-serif text-xl font-semibold">整備履歴</h1>

      <div className="mb-4 flex gap-1.5">
        <Link
          href="/m/records"
          className={`px-3.5 py-1.5 text-[13px] ${!onlyMine ? "bg-navy font-medium text-white" : "border border-line2 bg-panel text-ink2"}`}
        >
          工場全体
        </Link>
        <Link
          href="/m/records?mine=1"
          className={`px-3.5 py-1.5 text-[13px] ${onlyMine ? "bg-navy font-medium text-white" : "border border-line2 bg-panel text-ink2"}`}
        >
          自分の記録
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="border border-dashed border-line2 bg-panel2 px-4 py-10 text-center text-sm text-ink3">
          記録がありません。
        </p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-panel">
          {visible.map((r) => {
            const m = machines.find((x) => x.id === r.machineId);
            return (
              <li key={r.id}>
                <Link href={`/m/machines/${r.machineId}`} className="block px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] text-ink3 mk-tabular">{fmtDateShort(r.workDate)}</span>
                    <TypeBadge type={r.type} />
                  </span>
                  <span className="mt-1 block text-[13px] font-medium">{r.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink3">
                    {m?.name} — {userName(r.userId)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {total > limit && (
        <Link
          href={`/m/records?${onlyMine ? "mine=1&" : ""}limit=${limit + 50}`}
          className="mt-3 block w-full border border-line bg-panel py-2.5 text-center text-sm text-ink2"
        >
          さらに表示(残り{total - limit}件)
        </Link>
      )}
    </div>
  );
}
