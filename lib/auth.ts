// パスコード認証（単一ユーザー向けの軽量ゲート）。
// proxy.ts（Edge）と Route Handler（Node）の両方から使うため、
// Web Crypto(globalThis.crypto.subtle) のみを使用する。

export const AUTH_COOKIE = "flyheit_auth";

// 環境変数にパスコードが設定されていなければ保護無し（ローカル開発用）
export function getPasscode(): string {
  return process.env.FLYHEIT_PASSCODE || "";
}

export async function tokenFor(pass: string): Promise<string> {
  const data = new TextEncoder().encode("flyheit::" + pass);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function cookieHeader(token: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}
