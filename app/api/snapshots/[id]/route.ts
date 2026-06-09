import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.prepare("DELETE FROM snapshots WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
