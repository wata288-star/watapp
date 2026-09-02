import { NextResponse } from "next/server";
import { readState } from "@/lib/pm/store";
import { nextSlotTime, refreshNews } from "@/lib/pm/news";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 手動更新 / サーバー内スケジューラからの強制取得 */
export async function POST() {
  try {
    const result = await refreshNews();
    const state = readState();
    return NextResponse.json({
      ...result,
      items: state.news,
      meta: state.newsMeta,
      nextFetchAt: nextSlotTime(state.newsMeta.slots).toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
