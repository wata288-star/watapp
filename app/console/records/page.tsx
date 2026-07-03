import Link from "next/link";
import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, recordsOf, userName } from "@/lib/karte/queries";
import { fmtDateShort } from "@/lib/karte/format";
import { PageTitle, TypeBadge, EmptyState } from "@/components/karte/ui";
import { RECORD_TYPE_LABEL, type RecordType } from "@/lib/karte/types";

export const metadata = { title: "整備記録" };

const TYPES: RecordType[] = ["inspection", "repair", "parts", "legal", "hygiene", "note"];

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; machine?: string; limit?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { type = "", machine: machineId = "", limit: limitRaw } = await searchParams;
  const limit = Math.min(Number(limitRaw) || 60, 1000);

  const machines = machinesOf(user.companyId);
  let records = recordsOf(user.companyId);
  if (type) records = records.filter((r) => r.type === type);
  if (machineId) records = records.filter((r) => r.machineId === machineId);
  const total = records.length;
  const visible = records.slice(0, limit);

  const moreParams = new URLSearchParams();
  if (type) moreParams.set("type", type);
  if (machineId) moreParams.set("machine", machineId);
  moreParams.set("limit", String(limit + 100));

  return (
    <>
      <PageTitle overline="整備記録" title={`記録 ${total.toLocaleString("ja-JP")}件`} />

      <form method="GET" className="mb-6 flex flex-wrap items-center gap-2">
        <select name="type" defaultValue={type} className="border border-line2 bg-panel px-3 py-2 text-sm outline-none focus:border-navy">
          <option value="">すべての種別</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{RECORD_TYPE_LABEL[t]}</option>
          ))}
        </select>
        <select name="machine" defaultValue={machineId} className="max-w-64 border border-line2 bg-panel px-3 py-2 text-sm outline-none focus:border-navy">
          <option value="">すべての機械</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button type="submit" className="border border-line2 bg-panel px-4 py-2 text-sm font-medium hover:border-navy hover:text-navy">
          絞り込む
        </button>
        {(type || machineId) && (
          <Link href="/console/records" className="px-2 text-xs text-ink3 underline underline-offset-4">
            条件を解除
          </Link>
        )}
      </form>

      {visible.length === 0 ? (
        <EmptyState title="該当する記録がありません" sub="条件を変更してください。" />
      ) : (
        <>
          <div className="overflow-x-auto border border-line bg-panel">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line bg-panel2 text-left text-xs text-ink3">
                  <th className="px-5 py-3 font-medium">作業日</th>
                  <th className="px-4 py-3 font-medium">種別</th>
                  <th className="px-4 py-3 font-medium">内容</th>
                  <th className="px-4 py-3 font-medium">機械</th>
                  <th className="px-4 py-3 font-medium">記録者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((r) => {
                  const m = machines.find((x) => x.id === r.machineId);
                  return (
                    <tr key={r.id} className="group relative transition-colors hover:bg-panel2">
                      <td className="px-5 py-3 font-mono text-xs text-ink3 mk-tabular">{fmtDateShort(r.workDate)}</td>
                      <td className="px-4 py-3"><TypeBadge type={r.type} /></td>
                      <td className="max-w-[320px] px-4 py-3">
                        <Link href={`/console/machines/${r.machineId}`} className="font-medium after:absolute after:inset-0">
                          {r.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-ink3">{r.memo}</p>
                      </td>
                      <td className="px-4 py-3 text-ink2">{m?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-ink2">{userName(r.userId)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > limit && (
            <Link
              href={`/console/records?${moreParams.toString()}`}
              className="mt-3 block w-full border border-line bg-panel py-2.5 text-center text-sm text-ink2 transition-colors hover:border-navy hover:text-navy"
            >
              さらに表示(残り{(total - limit).toLocaleString("ja-JP")}件)
            </Link>
          )}
        </>
      )}
    </>
  );
}
