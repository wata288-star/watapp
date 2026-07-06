import Link from "next/link";
import { PageTitle } from "@/components/karte/ui";
import { COMMON_ITEMS, TYPE_ITEMS, MACHINE_TYPES } from "@/lib/karte/master";
import type { ItemImpact, ItemKind, MasterItem } from "@/lib/karte/master";

export const metadata = { title: "記録項目マスター" };

const IMPACT_STYLE: Record<ItemImpact, string> = {
  高: "bg-navysoft text-navy border-navy/25",
  中: "bg-panel2 text-ink2 border-line2",
  低: "bg-panel2 text-ink3 border-line",
};

const KIND_STYLE: Record<ItemKind, string> = {
  基本: "text-ink2 border-line2 bg-panel2",
  状態: "text-navy border-navy/25 bg-navysoft",
  法定: "text-steel border-steel/35 bg-panel2",
  履歴: "text-copper border-copper/25 bg-coppersoft",
};

function ItemTable({ items, showTiming = true }: { items: MasterItem[]; showTiming?: boolean }) {
  return (
    <div className="overflow-x-auto border border-line bg-panel">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line bg-panel2 text-left text-xs text-ink3">
            <th className="w-14 px-4 py-3 font-medium">区分</th>
            <th className="px-4 py-3 font-medium">項目</th>
            <th className="px-4 py-3 font-medium">確認・記録する内容</th>
            {showTiming && <th className="w-32 px-4 py-3 font-medium">タイミング</th>}
            <th className="w-24 px-4 py-3 font-medium">査定影響</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <span className={`inline-block border px-1.5 py-px text-[11px] font-medium tracking-wider ${KIND_STYLE[item.kind]}`}>
                  {item.kind}
                </span>
              </td>
              <td className="px-4 py-3 font-medium">{item.label}</td>
              <td className="px-4 py-3 text-[13px] leading-6 text-ink2">{item.desc}</td>
              {showTiming && <td className="px-4 py-3 text-xs text-ink2">{item.timing}</td>}
              <td className="px-4 py-3">
                <span className={`inline-block border px-2 py-px text-[11px] font-semibold tracking-wider ${IMPACT_STYLE[item.impact]}`}>
                  {item.impact}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const selected = MACHINE_TYPES.includes(type as (typeof MACHINE_TYPES)[number])
    ? (type as (typeof MACHINE_TYPES)[number])
    : MACHINE_TYPES[0];
  const typeItems = TYPE_ITEMS.filter((i) => i.machineType === selected);

  return (
    <>
      <PageTitle overline="記録項目マスター" title="点検・記録項目マスター">
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink3">
          中古産業機械の買取・査定で実際に確認されている項目を3層構造で整理したものです。現場入力は「写真+一言」を原則とし、これらの項目への分類は自動で行われます(毎回のチェックリストにはしません)。各機械の「査定準備状況」はこのマスターとの照合で算定されます。
        </p>
      </PageTitle>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-semibold">第1層 — 全機械共通項目</h2>
          <p className="text-xs text-ink3">どの機械でも査定時に必ず確認される基本情報・状態(全{COMMON_ITEMS.length}項目)</p>
        </div>
        <ItemTable items={COMMON_ITEMS} />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold">第2層 — 機種別項目 / 第3層 — 法定・義務記録</h2>
          <p className="text-xs text-ink3">機種ごとに査定額を左右する固有のチェックポイント。「法定」区分は法令等による義務記録</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {MACHINE_TYPES.map((mt) => (
            <Link
              key={mt}
              href={`/console/templates?type=${encodeURIComponent(mt)}`}
              className={`px-3 py-1.5 text-[13px] transition-colors ${
                mt === selected
                  ? "bg-navy font-medium text-white"
                  : "border border-line2 bg-panel text-ink2 hover:border-navy"
              }`}
            >
              {mt}
            </Link>
          ))}
        </div>
        <ItemTable items={typeItems} />
      </section>

      <p className="mt-8 border border-line bg-panel2 px-5 py-4 text-xs leading-6 text-ink2">
        本マスターは中古機械買取業者各社の公開査定情報等を基にしたたたき台です。提携予定の買取業者へのヒアリングで実際の査定シートと突合し、継続的に精査していきます。査定インパクト「高」は買取価格を直接左右する項目、「中」は評価に影響、「低」は補足情報です。
      </p>
    </>
  );
}
