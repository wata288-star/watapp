import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/karte/session";
import { machineOf } from "@/lib/karte/queries";
import { PageTitle } from "@/components/karte/ui";
import { RecordForm } from "@/components/karte/record-form";

export const metadata = { title: "記録の追加" };

function legalKindOf(kind?: string): "press" | "haccp" | "forklift" | null {
  if (!kind) return null;
  if (kind.includes("プレス")) return "press";
  if (kind.includes("HACCP")) return "haccp";
  if (kind.includes("フォークリフト")) return "forklift";
  return null;
}

export default async function ConsoleRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const machine = machineOf(user.companyId, id);
  if (!machine) notFound();

  return (
    <>
      <PageTitle overline={`機械台帳 / ${machine.name}`} title="記録の追加">
        <p className="mt-2 text-sm text-ink3">
          写真と一言メモだけで完了します。入力内容は自動で整形・分類されます。
        </p>
      </PageTitle>
      <div className="max-w-2xl">
        <RecordForm
          machineId={machine.id}
          machineName={machine.name}
          legalKind={legalKindOf(machine.legalPlan?.kind)}
          from="console"
        />
      </div>
    </>
  );
}
