import fs from "node:fs";
import path from "node:path";
import { getDb, saveDb, uid, UPLOAD_DIR } from "@/lib/karte/db";
import { getCurrentUser } from "@/lib/karte/session";

// 撮影即時アップロード(写真の真正性確保)
// アプリ内カメラで撮影された写真を、編集工程を挟まずそのまま受信する。
// 受信時刻はサーバー側で記録し、後続の記録保存時に添付として検証される。
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("photo");
  const machineId = String(form.get("machineId") ?? "");
  const capturedAt = String(form.get("capturedAt") ?? "");
  const geo = String(form.get("geo") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "写真がありません。" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "写真は10MBまでです。" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "画像のみアップロードできます。" }, { status: 400 });
  }

  const db = getDb();
  const machine = db.machines.find((m) => m.id === machineId && m.companyId === user.companyId);
  if (!machine) return Response.json({ error: "機械が見つかりません。" }, { status: 404 });

  const id = uid("f");
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, id), Buffer.from(await file.arrayBuffer()));
  db.files.push({
    id,
    name: file.name || "capture.jpg",
    mime: file.type,
    size: file.size,
    createdAt: new Date().toISOString(), // サーバー受信時刻
    uploadedBy: user.id,
    companyId: user.companyId,
    machineId: machine.id,
    capturedAt: capturedAt || undefined,
    geo: geo || undefined,
    attached: false,
  });
  saveDb();
  return Response.json({ fileId: id });
}
