import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COLLECTIONS, type Collection } from "@/lib/pm/types";
import { deleteItem, updateItem } from "@/lib/pm/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function assertCollection(value: string): Collection | null {
  return (COLLECTIONS as string[]).includes(value) ? (value as Collection) : null;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ collection: string; id: string }> },
) {
  const { collection, id } = await ctx.params;
  const key = assertCollection(collection);
  if (!key) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  const body = (await req.json()) as Record<string, unknown>;
  const updated = updateItem(key, id, body);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ collection: string; id: string }> },
) {
  const { collection, id } = await ctx.params;
  const key = assertCollection(collection);
  if (!key) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  if (!deleteItem(key, id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
