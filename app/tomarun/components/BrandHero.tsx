/**
 * ホームのブランドヘッダー。
 * ホワイトレーベル前提のため、ロゴ・配色はテナント設定で差し替えられる想定。
 */
export default function BrandHero({ appName }: { appName: string }) {
  return (
    <div className="tm-hero" aria-hidden>
      <svg className="tm-hero__pattern" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="tmHeroBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4f7fd" />
            <stop offset="100%" stopColor="#dfe8f7" />
          </linearGradient>
          <linearGradient id="tmMark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#16255c" />
            <stop offset="100%" stopColor="#3b7de0" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill="url(#tmHeroBg)" />
        <path d="M0 0h120L0 120z" fill="#1e3566" opacity=".9" />
        <path d="M400 220H250L400 90z" fill="#1e3566" opacity=".9" />
        <path d="M0 140 90 220H0z" fill="#2c4d8f" opacity=".55" />
        <path d="M400 0h-90l90 80z" fill="#2c4d8f" opacity=".45" />
        <g stroke="#9db6de" strokeWidth="1" opacity=".5" fill="none">
          <circle cx="330" cy="60" r="46" />
          <circle cx="330" cy="60" r="70" />
          <path d="M245 118h60l24-24" />
        </g>
        <g fill="#a9c0e4" opacity=".55">
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={286 + c * 9} cy={16 + r * 9} r="1.6" />
            )),
          )}
        </g>
      </svg>

      <div className="tm-hero__logo">
        <svg viewBox="0 0 120 56" className="tm-hero__mark" role="img" aria-label={appName}>
          <path
            d="M30 28c0-9 6-15 14-15s13 6 16 15c3 9 8 15 16 15s14-6 14-15-6-15-14-15-13 6-16 15c-3 9-8 15-16 15s-14-6-14-15z"
            fill="none"
            stroke="url(#tmMark)"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </svg>
        <span className="tm-hero__word">
          TOMA<em>RUN</em>
        </span>
      </div>
    </div>
  );
}
