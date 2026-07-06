import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { machineOf, recordsOfMachine } from "@/lib/karte/queries";
import { RecordForm } from "@/components/karte/record-form";
import { IconArrowLeft } from "@/components/karte/icons";
import { fmtDate } from "@/lib/karte/format";

export const metadata = { title: "記録する" };

function legalKindOf(kind?: string): "press" | "haccp" | "forklift" | null {
  if (!kind) return null;
  if (kind.includes("プレス")) return "press";
  if (kind.includes("HACCP")) return "haccp";
  if (kind.includes("フォークリフト")) return "forklift";
  return null;
}

export default async function MobileRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ via?: string; correct?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const { via, correct } = await searchParams;
  const machine = machineOf(user.companyId, id);
  if (!machine) notFound();

  const target = correct
    ? recordsOfMachine(user.companyId, machine.id).find((r) => r.id === correct)
    : undefined;

  return (
    <div className="px-4 py-6">
      <Link
        href={`/m/machines/${machine.id}`}
        className="inline-flex items-center gap-2 text-sm text-ink2"
      >
        <IconArrowLeft width={15} height={15} />
        {machine.name}
      </Link>
      <h1 className="mb-1 mt-3 font-serif text-xl font-semibold">
        {target ? "訂正記録を追加" : "記録する"}
      </h1>
      <p className="mb-6 text-[13px] leading-6 text-ink3">
        写真と一言メモだけで完了します。内容は自動で整形・分類されます。
      </p>
      <RecordForm
        machineId={machine.id}
        machineName={machine.name}
        legalKind={legalKindOf(machine.legalPlan?.kind)}
        from="m"
        viaQr={via === "qr"}
        correctionOf={target ? { id: target.id, title: target.title, date: fmtDate(target.workDate) } : null}
      />
    </div>
  );
}
