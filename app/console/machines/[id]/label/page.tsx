import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/karte/session";
import { machineOf } from "@/lib/karte/queries";
import { qrSvg, baseUrl } from "@/lib/karte/qr";
import { PrintButton } from "@/components/karte/print-button";
import { IconArrowLeft } from "@/components/karte/icons";

export const metadata = { title: "QRラベル印刷" };

export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const machine = machineOf(user.companyId, id);
  if (!machine) notFound();

  const url = `${await baseUrl()}/k/${machine.code}`;
  const svg = await qrSvg(url);

  return (
    <>
      <div className="print-hidden mb-8 flex items-center justify-between">
        <Link
          href={`/console/machines/${machine.id}`}
          className="inline-flex items-center gap-2 text-sm text-ink2 hover:text-navy"
        >
          <IconArrowLeft width={16} height={16} />
          {machine.name} のカルテへ戻る
        </Link>
        <PrintButton label="ラベルを印刷する" />
      </div>

      <p className="print-hidden mb-6 text-sm leading-6 text-ink2">
        耐候性のラベル用紙に印刷し、操作盤付近など読み取りやすい位置に貼付してください。汚損に備えて2枚の貼付を推奨しています。
      </p>

      <div className="flex flex-wrap gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="w-[320px] border-2 border-ink bg-white p-5 text-ink">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
              <div>
                <p className="text-[10px] font-medium tracking-[0.2em]">MACHINE KARTE</p>
                <p className="font-serif text-sm font-semibold">マシンカルテ</p>
              </div>
              <p className="font-mono text-sm tracking-widest">{machine.code}</p>
            </div>
            <div className="flex items-center gap-5 pt-4">
              <div className="h-32 w-32 shrink-0 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              <div className="min-w-0 text-xs leading-5">
                <p className="font-semibold">{machine.name}</p>
                <p className="mt-1 text-[11px]">{machine.maker}</p>
                <p className="text-[11px]">{machine.model}</p>
                <p className="mt-2 text-[10px] leading-4">
                  スマートフォンで読み取ると、この機械の整備カルテが開きます。
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
