import { cookieHeader, getPasscode, tokenFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const pass = getPasscode();
  const { passcode } = await req.json().catch(() => ({ passcode: "" }));

  // パスコード未設定なら誰でも通す（ローカル開発）
  if (!pass) return Response.json({ ok: true });

  if (passcode !== pass) {
    return Response.json({ error: "パスコードが違います" }, { status: 401 });
  }

  const token = await tokenFor(pass);
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", cookieHeader(token, 60 * 60 * 24 * 30));
  return res;
}
