import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COLLECTIONS, type Collection } from "@/lib/pm/types";
import { createItem, listItems } from "@/lib/pm/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function assertCollection(value: string): Collection | null {
  return (COLLECTIONS as string[]).includes(value) ? (value as Collection) : null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ collection: string }> }) {
  const { collection } = await ctx.params;
  const key = assertCollection(collection);
  if (!key) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  return NextResponse.json(listItems(key));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ collection: string }> }) {
  const { collection } = await ctx.params;
  const key = assertCollection(collection);
  if (!key) return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  const body = (await req.json()) as Record<string, unknown>;
  return NextResponse.json(createItem(key, body), { status: 201 });
}
