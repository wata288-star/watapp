import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, usersOf } from "@/lib/karte/queries";
import { fmtDate } from "@/lib/karte/format";
import { PageTitle, KV } from "@/components/karte/ui";
import { IconShield } from "@/components/karte/icons";

export const metadata = { title: "設定" };

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  const members = usersOf(user.companyId);
  const machines = machinesOf(user.companyId);
  const billable = machines.filter((m) => m.status !== "sold").length;

  return (
    <>
      <PageTitle overline="設定" title="契約情報と運用ポリシー" />

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-line bg-panel">
          <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">ご契約企業</h2>
          <dl className="grid grid-cols-2 gap-x-6 px-6 py-3">
            <KV label="企業名">{user.company.name}</KV>
            <KV label="英文表記">{user.company.nameEn}</KV>
            <KV label="対象工場">{user.company.plantName}</KV>
            <KV label="業種">{user.company.industry}</KV>
            <KV label="所在地">{user.company.address}</KV>
            <KV label="利用開始">{fmtDate(user.company.joinedAt)}</KV>
          </dl>
        </section>

        <section className="border border-line bg-panel">
          <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">ご利用料金(第1層 SaaS利用料)</h2>
          <dl className="grid grid-cols-2 gap-x-6 px-6 py-3">
            <KV label="課金対象機械">
              <span className="mk-tabular">{billable}台</span>
              <span className="ml-1 text-xs text-ink3">(売却済みを除く)</span>
            </KV>
            <KV label="単価">
              <span className="mk-tabular">月額700円 / 台</span>
            </KV>
            <KV label="当月概算">
              <span className="font-serif text-lg font-semibold mk-tabular">
                ¥{(billable * 700).toLocaleString("ja-JP")}
              </span>
            </KV>
            <KV label="導入支援">初回導入時 30万円 / 工場(精算済み)</KV>
          </dl>
          <p className="border-t border-line px-6 py-4 text-xs leading-5 text-ink3">
            履歴証明書の発行料(1通2万円、英語版追加1万円)および送客手数料(成約額の5%)は、発生の都度ご請求します。
          </p>
        </section>

        <section className="border border-line bg-panel">
          <h2 className="border-b border-line px-6 py-4 font-serif text-base font-semibold">利用メンバー</h2>
          <ul className="divide-y divide-line">
            {members.map((mem) => (
              <li key={mem.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-medium">
                    {mem.name}
                    {mem.id === user.id && <span className="ml-2 text-xs text-ink3">(ログイン中)</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-ink3">{mem.title}</p>
                </div>
                <span
                  className={`border px-2 py-0.5 text-[11px] font-medium tracking-wider ${
                    mem.role === "admin" ? "border-navy/25 bg-navysoft text-navy" : "border-line2 bg-panel2 text-ink2"
                  }`}
                >
                  {mem.role === "admin" ? "管理者" : "現場担当"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-line bg-panel">
          <h2 className="flex items-center gap-2.5 border-b border-line px-6 py-4 font-serif text-base font-semibold">
            <IconShield width={18} height={18} className="text-navy" />
            データの取り扱い
          </h2>
          <ul className="space-y-3 px-6 py-5 text-[13px] leading-6 text-ink2">
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 bg-navy" />
              機械の履歴データは企業ごとに厳格に分離され、他社から参照されることはありません。
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 bg-navy" />
              売却手続きを開始するまで、履歴が外部(買取業者・マーケットプレイス等)へ開示されることは一切ありません。
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 bg-navy" />
              履歴証明書の照合ページに表示されるのは、証明書に記載された範囲の情報のみです。
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 bg-navy" />
              証明対象は記録の充実度と真正性であり、機械の品質を保証するものではありません。
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
