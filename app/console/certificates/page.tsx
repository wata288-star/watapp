import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { certificatesOf, machinesOf } from "@/lib/karte/queries";
import { fmtDate, todayIso } from "@/lib/karte/format";
import { PageTitle, EmptyState } from "@/components/karte/ui";
import { IconChevronRight } from "@/components/karte/icons";

export const metadata = { title: "履歴証明書" };

export default async function CertificatesPage() {
  const user = (await getCurrentUser())!;
  if (user.role !== "admin") redirect("/console");

  const certs = certificatesOf(user.companyId);
  const machines = machinesOf(user.companyId);
  const today = todayIso();

  return (
    <>
      <PageTitle overline="履歴証明書" title={`発行済み証明書 ${certs.length}通`}>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink3">
          蓄積された履歴を第三者管理のデータとして証明します。発行は各機械のカルテ画面から行えます。標準(日本語)1通2万円、英語版は追加1万円、有効期限は発行から6ヶ月です。
        </p>
      </PageTitle>

      {certs.length === 0 ? (
        <EmptyState
          title="発行済みの証明書はありません"
          sub="機械台帳から機械を選択し、カルテ画面の「履歴証明書を発行する」から発行できます。"
        />
      ) : (
        <div className="overflow-x-auto border border-line bg-panel">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line bg-panel2 text-left text-xs text-ink3">
                <th className="px-5 py-3 font-medium">証明書番号</th>
                <th className="px-4 py-3 font-medium">対象機械</th>
                <th className="px-4 py-3 font-medium">等級</th>
                <th className="px-4 py-3 font-medium">発行日</th>
                <th className="px-4 py-3 font-medium">有効期限</th>
                <th className="px-4 py-3 font-medium">言語</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {certs.map((c) => {
                const expired = c.expiresAt < today;
                return (
                  <tr key={c.id} className="group relative transition-colors hover:bg-panel2">
                    <td className="px-5 py-3.5">
                      <Link href={`/console/certificates/${c.id}`} className="font-mono text-navy after:absolute after:inset-0">
                        {c.certNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium">{c.machineSnapshot.name}</p>
                      <p className="text-xs text-ink3">
                        {c.machineSnapshot.maker} {c.machineSnapshot.model}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center border border-line2 font-serif text-sm font-semibold text-navy">
                        {c.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 mk-tabular">{fmtDate(c.issuedAt)}</td>
                    <td className={`px-4 py-3.5 mk-tabular ${expired ? "text-warn" : ""}`}>
                      {fmtDate(c.expiresAt)}
                      {expired && <span className="ml-1.5 text-xs">期限切れ</span>}
                    </td>
                    <td className="px-4 py-3.5 text-ink2">{c.withEnglish ? "日 / 英" : "日"}</td>
                    <td className="px-4 py-3.5 text-right">
                      <IconChevronRight width={15} height={15} className="inline text-line2" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-8 border border-line bg-panel2 px-6 py-5">
        <h2 className="font-serif text-base font-semibold">証明書を発行するには</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-ink2">
          <li>機械台帳から対象の機械を開きます。</li>
          <li>カルテ画面の「資産価値への転換」で現時点の等級(参考値)を確認します。</li>
          <li>「履歴証明書を発行する」を押すと、その時点の履歴を確定して発行されます。</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {machines
            .filter((m) => m.status !== "sold")
            .slice(0, 6)
            .map((m) => (
              <Link
                key={m.id}
                href={`/console/machines/${m.id}`}
                className="border border-line2 bg-panel px-3 py-1.5 text-xs text-ink2 transition-colors hover:border-navy hover:text-navy"
              >
                {m.name}
              </Link>
            ))}
        </div>
      </section>
    </>
  );
}
