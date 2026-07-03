import Link from "next/link";
import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, recordsOfMachine } from "@/lib/karte/queries";
import { fmtDateShort } from "@/lib/karte/format";
import { StatusBadge } from "@/components/karte/ui";
import { IconChevronRight, IconSearch } from "@/components/karte/icons";

export const metadata = { title: "機械一覧" };

export default async function MobileMachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { q = "" } = await searchParams;

  let machines = machinesOf(user.companyId).filter((m) => m.status !== "sold");
  if (q) {
    const needle = q.toLowerCase();
    machines = machines.filter((m) =>
      [m.name, m.maker, m.model, m.location, m.code].join(" ").toLowerCase().includes(needle),
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 font-serif text-xl font-semibold">機械一覧</h1>

      <form method="GET" className="relative mb-4">
        <IconSearch width={15} height={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3" />
        <input
          name="q"
          defaultValue={q}
          placeholder="名称・メーカー・設置場所で検索"
          className="w-full border border-line2 bg-panel py-3 pl-10 pr-3 text-sm outline-none focus:border-navy"
        />
      </form>

      {machines.length === 0 ? (
        <p className="border border-dashed border-line2 bg-panel2 px-4 py-10 text-center text-sm text-ink3">
          該当する機械がありません。
        </p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-panel">
          {machines.map((m) => {
            const records = recordsOfMachine(user.companyId, m.id);
            return (
              <li key={m.id}>
                <Link href={`/m/machines/${m.id}`} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{m.name}</span>
                      <StatusBadge status={m.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink3">
                      {m.maker} {m.model} — {m.location}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink3 mk-tabular">
                      記録{records.length}件
                      {records[0] && ` / 最終 ${fmtDateShort(records[0].workDate)}`}
                    </span>
                  </span>
                  <IconChevronRight width={16} height={16} className="shrink-0 text-line2" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
