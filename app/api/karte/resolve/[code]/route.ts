import { machineByCode } from "@/lib/karte/queries";
import { getCurrentUser } from "@/lib/karte/session";

// QRスキャナからのコード解決。自社の機械のみIDを返す。
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { code } = await params;
  const machine = machineByCode(decodeURIComponent(code));
  if (!machine || machine.companyId !== user.companyId) {
    return Response.json({ error: "notfound" }, { status: 404 });
  }
  return Response.json({ machineId: machine.id, name: machine.name });
}
