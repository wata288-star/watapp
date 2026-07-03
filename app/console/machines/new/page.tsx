import { createMachine } from "@/app/actions/karte";
import { PageTitle } from "@/components/karte/ui";
import type { MachineCategory } from "@/lib/karte/types";

export const metadata = { title: "機械の登録" };

const CATEGORIES: MachineCategory[] = ["工作機械", "射出成形機", "プレス機", "食品機械", "搬送・包装機械", "その他"];

const inputClass =
  "w-full border border-line2 bg-panel px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-navy";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mk-label mb-1.5 block">
        {label}
        {required && <span className="ml-1 text-alert">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function NewMachinePage() {
  return (
    <>
      <PageTitle overline="機械台帳" title="機械の登録">
        <p className="mt-2 text-sm text-ink3">
          登録するとQRコードが自動で発番されます。ラベルを印刷して機械に貼付してください。
        </p>
      </PageTitle>

      <form action={createMachine} className="max-w-3xl space-y-8">
        <section className="border border-line bg-panel p-7">
          <h2 className="mb-5 font-serif text-base font-semibold">基本情報</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="呼称(社内名称)" required>
              <input name="name" required placeholder="NC旋盤 1号機" className={inputClass} />
            </Field>
            <Field label="英文名称(証明書用)">
              <input name="nameEn" placeholder="NC Lathe No.1" className={inputClass} />
            </Field>
            <Field label="ジャンル" required>
              <select name="category" required className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="設置場所">
              <input name="location" placeholder="A棟 切削ライン" className={inputClass} />
            </Field>
            <Field label="メーカー" required>
              <input name="maker" required placeholder="ヤマザキマザック" className={inputClass} />
            </Field>
            <Field label="メーカー英文表記(証明書用)">
              <input name="makerEn" placeholder="Yamazaki Mazak" className={inputClass} />
            </Field>
            <Field label="型式" required>
              <input name="model" required placeholder="QUICK TURN 250MSY" className={inputClass} />
            </Field>
            <Field label="製造番号">
              <input name="serialNo" placeholder="QT250-190447" className={inputClass} />
            </Field>
            <Field label="製造年">
              <input name="yearMade" type="number" min={1960} max={2100} defaultValue={2024} className={inputClass} />
            </Field>
            <Field label="導入年月日">
              <input name="purchasedAt" type="date" className={inputClass} />
            </Field>
            <Field label="取得区分">
              <select name="acquisition" className={inputClass}>
                <option value="new">新品で導入</option>
                <option value="used">中古で導入</option>
              </select>
            </Field>
            <Field label="定格・主要仕様">
              <input name="ratedPower" placeholder="AC200V 26kVA / 主軸5,000min-1" className={inputClass} />
            </Field>
          </div>
        </section>

        <section className="border border-line bg-panel p-7">
          <h2 className="mb-2 font-serif text-base font-semibold">法定点検・衛生記録のテンプレート</h2>
          <p className="mb-5 text-[13px] leading-6 text-ink3">
            法令等で記録が義務化されている機械は、該当するテンプレートを選択してください。義務としての記録がそのまま資産履歴として蓄積され、点検期限も自動で管理されます。
          </p>
          <div className="space-y-2.5">
            {[
              { value: "", title: "対象外", desc: "法定点検・衛生記録の義務なし" },
              { value: "press", title: "プレス機 定期自主検査", desc: "労働安全衛生法第45条・年次(検査項目テンプレート付き)" },
              { value: "haccp", title: "食品機械 衛生管理(HACCP)", desc: "衛生管理計画に基づく週次の洗浄・殺菌記録" },
              { value: "forklift", title: "フォークリフト 特定自主検査", desc: "労働安全衛生法・年次(検査業者による実施)" },
            ].map((opt, i) => (
              <label key={opt.value} className="flex cursor-pointer items-start gap-3 border border-line px-4 py-3 transition-colors has-[:checked]:border-navy has-[:checked]:bg-navysoft">
                <input type="radio" name="legalKind" value={opt.value} defaultChecked={i === 0} className="mt-1 accent-[#1d3153]" />
                <span>
                  <span className="block text-sm font-medium">{opt.title}</span>
                  <span className="mt-0.5 block text-xs text-ink3">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="border border-line bg-panel p-7">
          <h2 className="mb-5 font-serif text-base font-semibold">備考</h2>
          <textarea
            name="notes"
            rows={3}
            placeholder="導入経緯、癖、注意事項など"
            className={inputClass}
          />
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="bg-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy2"
          >
            登録してQRコードを発番する
          </button>
        </div>
      </form>
    </>
  );
}
