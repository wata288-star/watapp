import { redirect } from "next/navigation";
import { machineByCode } from "@/lib/karte/queries";
import { getCurrentUser } from "@/lib/karte/session";

// 機械に貼付されたQRコードの着地点。
// スマホ版の機械カルテへ誘導する(未ログイン時はログイン後に復帰)。
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const machine = machineByCode(decodeURIComponent(code));
  if (!machine) redirect("/m/scan?notfound=1");

  const user = await getCurrentUser();
  const target = `/m/machines/${machine.id}`;
  if (!user) redirect(`/login?dest=m&next=${encodeURIComponent(target)}`);
  redirect(target);
}
