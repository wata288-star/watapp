import { NextResponse } from "next/server";
import { readState, resetState } from "@/lib/pm/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(readState());
}

/** 初期データへ戻す（デモ用） */
export async function DELETE() {
  return NextResponse.json(resetState());
}
