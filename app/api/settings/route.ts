import { getSetting, setSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ usdjpy: getSetting("usdjpy", "150") });
}

export async function PATCH(req: Request) {
  const b = await req.json();
  if (b?.usdjpy != null) {
    const n = Number(b.usdjpy);
    if (Number.isFinite(n) && n > 0) setSetting("usdjpy", String(n));
  }
  return Response.json({ usdjpy: getSetting("usdjpy", "150") });
}
