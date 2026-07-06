import fs from "node:fs";
import path from "node:path";
import { getDb, UPLOAD_DIR } from "@/lib/karte/db";
import { getCurrentUser } from "@/lib/karte/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!/^f_[a-z0-9]+$/.test(id)) return new Response("Not found", { status: 404 });

  const db = getDb();
  const meta = db.files.find((f) => f.id === id);
  const filePath = path.join(UPLOAD_DIR, id);
  if (!meta || !fs.existsSync(filePath)) return new Response("Not found", { status: 404 });

  // 自社がアップロードしたファイル、または自社の記録に紐づくファイルのみ配信する
  const owned =
    meta.companyId === user.companyId ||
    db.records.some(
      (r) =>
        r.companyId === user.companyId &&
        (r.photoFileIds.includes(id) || r.items?.some((x) => x.photoFileId === id)),
    );
  if (!owned) return new Response("Not found", { status: 404 });

  const buf = fs.readFileSync(filePath);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": meta.mime,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
