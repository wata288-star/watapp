import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { machineOf } from "@/lib/karte/queries";
import { inspectionItemsFor } from "@/lib/karte/master";
import { InspectionWizard } from "@/components/karte/inspection-wizard";
import { IconArrowLeft } from "@/components/karte/icons";

export const metadata = { title: "定期自主整備" };

export default async function InspectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ via?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const { via } = await searchParams;
  const machine = machineOf(user.companyId, id);
  if (!machine) notFound();

  const items = inspectionItemsFor(machine.machineType).map((i) => ({
    id: i.id,
    label: i.label,
    desc: i.desc,
    impact: i.impact,
    kind: i.kind,
  }));

  return (
    <div className="px-4 py-6">
      <Link
        href={`/m/machines/${machine.id}`}
        className="inline-flex items-center gap-2 text-sm text-ink2"
      >
        <IconArrowLeft width={15} height={15} />
        {machine.name}
      </Link>
      <h1 className="mt-3 font-serif text-xl font-semibold">定期自主整備</h1>
      <p className="mb-6 mt-1 text-[13px] leading-6 text-ink3">
        記録項目マスターに沿って、1項目ずつ「写真を撮って→コメント」で記録していきます。結果はそのまま査定準備状況と履歴証明書に反映されます。
      </p>
      <InspectionWizard
        machineId={machine.id}
        machineName={machine.name}
        items={items}
        viaQr={via === "qr"}
      />
    </div>
  );
}
