import { NextResponse } from "next/server";
import { readState } from "@/lib/pm/store";
import { ensureFreshNews, nextSlotTime } from "@/lib/pm/news";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 配信スロット(1日2回)を過ぎていれば自動で取り直してから返す */
export async function GET() {
  await ensureFreshNews();
  const state = readState();
  return NextResponse.json({
    items: state.news,
    meta: state.newsMeta,
    sources: state.newsSources,
    nextFetchAt: nextSlotTime(state.newsMeta.slots).toISOString(),
  });
}
