import Link from "next/link";
import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, recordsOfMachine } from "@/lib/karte/queries";
import { computeGrade } from "@/lib/karte/grade";
import { fmtDateShort } from "@/lib/karte/format";
import { PageTitle, StatusBadge, PrimaryLink, EmptyState } from "@/components/karte/ui";
import { IconPlus, IconSearch } from "@/components/karte/icons";
import type { MachineCategory, MachineStatus } from "@/lib/karte/types";

export const metadata = { title: "機械台帳" };

const CATEGORIES: MachineCategory[] = ["工作機械", "射出成形機", "プレス機", "食品機械", "搬送・包装機械", "その他"];
const STATUSES: { value: MachineStatus; label: string }[] = [
  { value: "active", label: "稼働中" },
  { value: "idle", label: "遊休" },
  { value: "listed", label: "売却手続中" },
  { value: "sold", label: "売却済" },
];

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { q = "", category = "", status = "" } = await searchParams;

  let machines = machinesOf(user.companyId);
  if (q) {
    const needle = q.toLowerCase();
    machines = machines.filter((m) =>
      [m.name, m.maker, m.model, m.serialNo, m.code, m.location]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }
  if (category) machines = machines.filter((m) => m.category === category);
  if (status) machines = machines.filter((m) => m.status === status);

  const rows = machines.map((m) => {
    const records = recordsOfMachine(user.companyId, m.id);
    const { grade } = computeGrade(m, records);
    return { machine: m, count: records.length, last: records[0]?.workDate ?? null, grade };
  });

  return (
    <>
      <PageTitle
        overline="機械台帳"
        title={`登録機械 ${machines.length}台`}
        action={
          <PrimaryLink href="/console/machines/new">
            <IconPlus width={15} height={15} />
            機械を登録
          </PrimaryLink>
        }
      />

      {/* 検索・絞り込み */}
      <form method="GET" className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconSearch width={15} height={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input
            name="q"
            defaultValue={q}
            placeholder="名称・メーカー・型式・製造番号"
            className="w-72 border border-line2 bg-panel py-2 pl-9 pr-3 text-sm outline-none focus:border-navy"
          />
        </div>
        <select
          name="category"
          defaultValue={category}
          className="border border-line2 bg-panel px-3 py-2 text-sm outline-none focus:border-navy"
        >
          <option value="">すべてのジャンル</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="border border-line2 bg-panel px-3 py-2 text-sm outline-none focus:border-navy"
        >
          <option value="">すべての状態</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button type="submit" className="border border-line2 bg-panel px-4 py-2 text-sm font-medium hover:border-navy hover:text-navy">
          絞り込む
        </button>
        {(q || category || status) && (
          <Link href="/console/machines" className="px-2 text-xs text-ink3 underline underline-offset-4">
            条件を解除
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="該当する機械がありません"
          sub="検索条件を変更するか、新しい機械を登録してください。"
        />
      ) : (
        <div className="overflow-x-auto border border-line bg-panel">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line bg-panel2 text-left text-xs text-ink3">
                <th className="px-5 py-3 font-medium">機械</th>
                <th className="px-4 py-3 font-medium">ジャンル</th>
                <th className="px-4 py-3 font-medium">設置場所</th>
                <th className="px-4 py-3 font-medium">状態</th>
                <th className="px-4 py-3 text-right font-medium">記録件数</th>
                <th className="px-4 py-3 font-medium">最終記録</th>
                <th className="px-4 py-3 font-medium">記録充実度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ machine: m, count, last, grade }) => (
                <tr key={m.id} className="group relative transition-colors hover:bg-panel2">
                  <td className="px-5 py-3.5">
                    <Link href={`/console/machines/${m.id}`} className="font-medium text-ink after:absolute after:inset-0">
                      {m.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink3">
                      {m.maker} {m.model} — <span className="font-mono">{m.serialNo}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-ink2">{m.category}</td>
                  <td className="px-4 py-3.5 text-ink2">{m.location}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3.5 text-right mk-tabular">{count.toLocaleString("ja-JP")}</td>
                  <td className="px-4 py-3.5 text-ink2 mk-tabular">{last ? fmtDateShort(last) : "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center border border-line2 font-serif text-sm font-semibold text-navy">
                      {grade}
                    </span>
                    <span className="ml-1.5 align-middle text-xs text-ink3">相当</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink3">
        記録充実度は現時点の履歴から算定した参考値です。正式な等級は履歴証明書の発行時に確定します。
      </p>
    </>
  );
}
