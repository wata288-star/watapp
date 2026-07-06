import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { machinesOf, salesOf, partners, certificatesOf } from "@/lib/karte/queries";
import { fmtMan } from "@/lib/karte/format";
import { PageTitle, SaleBadge, EmptyState } from "@/components/karte/ui";
import { IconShield } from "@/components/karte/icons";
import { createSaleCase, advanceSale } from "@/app/actions/karte";

export const metadata = { title: "売却・送客" };

const btnPrimary =
  "bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy2";
const btnGhost =
  "border border-line2 bg-panel px-4 py-2 text-sm font-medium text-ink2 transition-colors hover:border-alert hover:text-alert";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ machine?: string }>;
}) {
  const user = (await getCurrentUser())!;
  if (user.role !== "admin") redirect("/console");
  const { machine: preselect } = await searchParams;

  const machines = machinesOf(user.companyId);
  const sales = salesOf(user.companyId);
  const partnerList = partners();
  const certs = certificatesOf(user.companyId);

  const activeSales = sales.filter((s) => !["closed", "cancelled"].includes(s.status));
  const closedSales = sales.filter((s) => ["closed", "cancelled"].includes(s.status));
  const busyMachineIds = new Set(activeSales.map((s) => s.machineId));
  const eligible = machines.filter(
    (m) => (m.status === "active" || m.status === "idle") && !busyMachineIds.has(m.id),
  );

  return (
    <>
      <PageTitle overline="売却・送客" title="売却案件の管理">
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink3">
          売却希望の機械を、提携する買取業者・マーケットプレイスへ履歴情報とともに紹介します。成約時に成約額の5%を紹介手数料として受領します。
        </p>
      </PageTitle>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {/* 進行中の案件 */}
          <section>
            <h2 className="mb-3 font-serif text-lg font-semibold">進行中の案件</h2>
            {activeSales.length === 0 ? (
              <EmptyState title="進行中の売却案件はありません" sub="右のフォームから売却相談を登録できます。" />
            ) : (
              <div className="space-y-5">
                {activeSales.map((s) => {
                  const m = machines.find((x) => x.id === s.machineId);
                  const cert = certs.find((c) => c.id === s.certificateId);
                  const partner = partnerList.find((p) => p.id === s.partnerId);
                  return (
                    <div key={s.id} className="border border-line bg-panel">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                        <div>
                          <p className="font-serif text-base font-semibold">{m?.name}</p>
                          <p className="mt-0.5 text-xs text-ink3">
                            {s.caseNo} — {m?.maker} {m?.model}
                          </p>
                        </div>
                        <SaleBadge status={s.status} />
                      </div>
                      <div className="grid gap-x-8 gap-y-2 px-6 py-4 text-sm sm:grid-cols-3">
                        <p>
                          <span className="text-xs text-ink3">希望価格 </span>
                          <span className="mk-tabular">{fmtMan(s.askingPrice)}</span>
                        </p>
                        <p>
                          <span className="text-xs text-ink3">紹介手数料見込み(5%) </span>
                          <span className="mk-tabular">{s.askingPrice ? fmtMan(Math.round(s.askingPrice * 0.05)) : "—"}</span>
                        </p>
                        <p>
                          <span className="text-xs text-ink3">履歴証明書 </span>
                          {cert ? (
                            <Link href={`/console/certificates/${cert.id}`} className="font-mono text-navy underline underline-offset-4">
                              {cert.certNo}
                            </Link>
                          ) : (
                            <span className="text-ink3">未発行</span>
                          )}
                        </p>
                        {partner && (
                          <p className="sm:col-span-3">
                            <span className="text-xs text-ink3">紹介先 </span>
                            {partner.name}({partner.type})
                          </p>
                        )}
                      </div>
                      <ol className="border-t border-line px-6 py-4">
                        {s.timeline.map((tl, i) => (
                          <li key={i} className="flex gap-4 text-[13px] leading-7">
                            <span className="w-24 shrink-0 font-mono text-xs leading-7 text-ink3 mk-tabular">{tl.at}</span>
                            <span className="text-ink2">{tl.label}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
                        {s.status === "consulting" && (
                          <form action={advanceSale}>
                            <input type="hidden" name="saleId" value={s.id} />
                            <input type="hidden" name="action" value="assess" />
                            <button type="submit" className={btnPrimary}>査定資料の準備を開始</button>
                          </form>
                        )}
                        {s.status === "assessing" && (
                          <form action={advanceSale} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="saleId" value={s.id} />
                            <input type="hidden" name="action" value="refer" />
                            <select name="partnerId" required className="border border-line2 bg-panel px-3 py-2 text-sm outline-none focus:border-navy">
                              <option value="">紹介先を選択</option>
                              {partnerList.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}({p.type})</option>
                              ))}
                            </select>
                            <button type="submit" className={btnPrimary}>履歴とともに紹介する</button>
                          </form>
                        )}
                        {s.status === "referred" && (
                          <form action={advanceSale}>
                            <input type="hidden" name="saleId" value={s.id} />
                            <input type="hidden" name="action" value="negotiate" />
                            <button type="submit" className={btnPrimary}>商談開始を記録</button>
                          </form>
                        )}
                        {s.status === "negotiating" && (
                          <form action={advanceSale} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="saleId" value={s.id} />
                            <input type="hidden" name="action" value="close" />
                            <input
                              name="agreedPrice"
                              inputMode="numeric"
                              placeholder={`成約額(円) 例: ${s.askingPrice ?? 3000000}`}
                              className="w-56 border border-line2 bg-panel px-3 py-2 text-sm outline-none focus:border-navy"
                            />
                            <button type="submit" className={btnPrimary}>成約として確定</button>
                          </form>
                        )}
                        <form action={advanceSale} className="ml-auto">
                          <input type="hidden" name="saleId" value={s.id} />
                          <input type="hidden" name="action" value="cancel" />
                          <button type="submit" className={btnGhost}>取り下げ</button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 完了した案件 */}
          {closedSales.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold">完了した案件</h2>
              <div className="overflow-x-auto border border-line bg-panel">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel2 text-left text-xs text-ink3">
                      <th className="px-5 py-3 font-medium">案件</th>
                      <th className="px-4 py-3 font-medium">機械</th>
                      <th className="px-4 py-3 font-medium">状態</th>
                      <th className="px-4 py-3 text-right font-medium">成約額</th>
                      <th className="px-4 py-3 text-right font-medium">紹介手数料(5%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {closedSales.map((s) => {
                      const m = machines.find((x) => x.id === s.machineId);
                      return (
                        <tr key={s.id}>
                          <td className="px-5 py-3 font-mono text-xs">{s.caseNo}</td>
                          <td className="px-4 py-3">{m?.name}</td>
                          <td className="px-4 py-3"><SaleBadge status={s.status} /></td>
                          <td className="px-4 py-3 text-right mk-tabular">{fmtMan(s.agreedPrice)}</td>
                          <td className="px-4 py-3 text-right mk-tabular">
                            {s.status === "closed" && s.agreedPrice ? fmtMan(Math.round(s.agreedPrice * s.feeRate)) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          {/* 売却相談フォーム */}
          <section className="border border-line bg-panel p-6">
            <h2 className="font-serif text-base font-semibold">売却相談を登録</h2>
            <p className="mt-1.5 text-xs leading-5 text-ink3">
              登録すると機械は「売却手続中」となります。履歴証明書が未発行の場合は、発行してからの紹介をおすすめします。
            </p>
            {eligible.length === 0 ? (
              <p className="mt-4 text-sm text-ink3">現在、売却相談を登録できる機械はありません。</p>
            ) : (
              <form action={createSaleCase} className="mt-5 space-y-4">
                <label className="block">
                  <span className="mk-label mb-1.5 block">対象の機械</span>
                  <select
                    name="machineId"
                    required
                    defaultValue={preselect && eligible.some((m) => m.id === preselect) ? preselect : ""}
                    className="w-full border border-line2 bg-panel px-3 py-2.5 text-sm outline-none focus:border-navy"
                  >
                    <option value="">選択してください</option>
                    {eligible.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}({m.maker} {m.model})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mk-label mb-1.5 block">希望価格(円・任意)</span>
                  <input
                    name="askingPrice"
                    inputMode="numeric"
                    placeholder="4800000"
                    className="w-full border border-line2 bg-panel px-3 py-2.5 text-sm outline-none focus:border-navy"
                  />
                </label>
                <button type="submit" className="w-full bg-copper px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90">
                  売却相談を登録する
                </button>
              </form>
            )}
          </section>

          {/* 提携パートナー */}
          <section>
            <h2 className="mb-3 font-serif text-lg font-semibold">提携パートナー</h2>
            <ul className="divide-y divide-line border border-line bg-panel">
              {partnerList.map((p) => (
                <li key={p.id} className="px-5 py-4">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-ink3">
                    {p.type} / {p.regions}
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-ink2">{p.specialties}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* データ開示ポリシー */}
          <section className="flex gap-4 border border-line bg-panel2 px-5 py-5">
            <IconShield width={22} height={22} className="mt-0.5 shrink-0 text-navy" />
            <p className="text-xs leading-6 text-ink2">
              機械の履歴は貴社の内部情報です。データは企業ごとに厳格に分離され、
              <span className="font-medium">売却手続きを開始するまで外部には一切開示されません。</span>
              紹介時に提携先へ開示されるのは、対象機械の履歴情報のみです。
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
