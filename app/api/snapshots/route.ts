import { listSnapshots, recordSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(listSnapshots());
}

export async function POST(req: Request) {
  let note: string | undefined;
  try {
    const b = await req.json();
    note = b?.note?.trim() || undefined;
  } catch {
    // body 無し
  }
  const snap = recordSnapshot(note);
  return Response.json(snap, { status: 201 });
}
