import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, getPasscode, tokenFor } from "@/lib/auth";

// Next.js 16: middleware は proxy にリネーム。
// 全ルートを保護し、未認証は /login へ（APIは401）。
// FLYHEIT_PASSCODE 未設定なら素通り（ローカル開発）。

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/login|api/logout).*)",
  ],
};

export async function proxy(req: NextRequest) {
  const pass = getPasscode();
  if (!pass) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  const expected = await tokenFor(pass);
  if (cookie && cookie === expected) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(login);
}
