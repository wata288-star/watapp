import { computeSummary, ensureMonthlySnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureMonthlySnapshot();
  return Response.json(computeSummary());
}
