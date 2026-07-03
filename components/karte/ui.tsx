import Link from "next/link";
import type { ReactNode } from "react";
import type { CertGrade, MachineStatus, RecordType, SaleStatus } from "@/lib/karte/types";
import { MACHINE_STATUS_LABEL, RECORD_TYPE_LABEL, SALE_STATUS_LABEL } from "@/lib/karte/types";

export function BrandMark({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        width={compact ? 24 : 28}
        height={compact ? 24 : 28}
        aria-hidden
        className={light ? "text-paper" : "text-navy"}
      >
        <rect x="2" y="2" width="28" height="28" fill="currentColor" />
        <path d="M9 9.5h8" stroke={light ? "#1d3153" : "#f5f4f0"} strokeWidth="2" />
        <path d="M9 14.5h14" stroke={light ? "#1d3153" : "#f5f4f0"} strokeWidth="2" />
        <path d="M9 19.5h14" stroke={light ? "#1d3153" : "#f5f4f0"} strokeWidth="2" />
        <path d="M9 24.5h11" stroke={light ? "#1d3153" : "#f5f4f0"} strokeWidth="2" />
        <rect x="20" y="6.5" width="6" height="6" fill="#9c5527" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif font-semibold tracking-wide ${compact ? "text-base" : "text-lg"} ${light ? "text-paper" : "text-ink"}`}
        >
          マシンカルテ
        </span>
        {!compact && (
          <span className={`mt-1 text-[9px] tracking-[0.28em] ${light ? "text-paper/60" : "text-ink3"}`}>
            MACHINE KARTE
          </span>
        )}
      </span>
    </span>
  );
}

const STATUS_STYLE: Record<MachineStatus, string> = {
  active: "bg-oksoft text-ok border-ok/25",
  idle: "bg-warnsoft text-warn border-warn/25",
  listed: "bg-coppersoft text-copper border-copper/25",
  sold: "bg-panel2 text-ink3 border-line2",
};

export function StatusBadge({ status }: { status: MachineStatus }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-medium tracking-wider ${STATUS_STYLE[status]}`}
    >
      {MACHINE_STATUS_LABEL[status]}
    </span>
  );
}

const TYPE_STYLE: Record<RecordType, string> = {
  inspection: "text-navy border-navy/30 bg-navysoft",
  repair: "text-alert border-alert/30 bg-alertsoft",
  parts: "text-copper border-copper/30 bg-coppersoft",
  legal: "text-steel border-steel/30 bg-panel2",
  hygiene: "text-ok border-ok/30 bg-oksoft",
  note: "text-ink3 border-line2 bg-panel2",
};

export function TypeBadge({ type }: { type: RecordType }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center border px-1.5 py-px text-[11px] font-medium tracking-wider ${TYPE_STYLE[type]}`}
    >
      {RECORD_TYPE_LABEL[type]}
    </span>
  );
}

const SALE_STYLE: Record<SaleStatus, string> = {
  consulting: "bg-navysoft text-navy border-navy/25",
  assessing: "bg-navysoft text-navy border-navy/25",
  referred: "bg-coppersoft text-copper border-copper/25",
  negotiating: "bg-warnsoft text-warn border-warn/25",
  closed: "bg-oksoft text-ok border-ok/25",
  cancelled: "bg-panel2 text-ink3 border-line2",
};

export function SaleBadge({ status }: { status: SaleStatus }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-medium tracking-wider ${SALE_STYLE[status]}`}
    >
      {SALE_STATUS_LABEL[status]}
    </span>
  );
}

const GRADE_COLOR: Record<CertGrade, string> = {
  A: "#1d3153",
  B: "#4a6076",
  C: "#85888f",
};

export function GradeSeal({ grade, size = 72 }: { grade: CertGrade; size?: number }) {
  const c = GRADE_COLOR[grade];
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-label={`記録充実度 ${grade}等級`}>
      <circle cx="40" cy="40" r="37" fill="none" stroke={c} strokeWidth="2" />
      <circle cx="40" cy="40" r="31" fill="none" stroke={c} strokeWidth="0.75" />
      <text
        x="40"
        y="47"
        textAnchor="middle"
        fontFamily="var(--font-noto-serif), serif"
        fontSize="30"
        fontWeight="600"
        fill={c}
      >
        {grade}
      </text>
      <text
        x="40"
        y="61"
        textAnchor="middle"
        fontSize="6.5"
        letterSpacing="1.5"
        fill={c}
      >
        GRADE
      </text>
      <text
        x="40"
        y="25"
        textAnchor="middle"
        fontSize="6.5"
        letterSpacing="1"
        fill={c}
      >
        記録充実度
      </text>
    </svg>
  );
}

export function PageTitle({
  overline,
  title,
  action,
  children,
}: {
  overline: string;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <p className="mk-label mb-1.5">{overline}</p>
        <h1 className="font-serif text-2xl font-semibold tracking-wide text-ink">{title}</h1>
        {children}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "ink",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  tone?: "ink" | "navy" | "copper" | "alert";
}) {
  const toneClass = {
    ink: "text-ink",
    navy: "text-navy",
    copper: "text-copper",
    alert: "text-alert",
  }[tone];
  return (
    <div className="border border-line bg-panel px-5 py-4">
      <p className="mk-label">{label}</p>
      <p className={`mt-2 font-serif text-3xl font-semibold mk-tabular ${toneClass}`}>
        {typeof value === "number" ? value.toLocaleString("ja-JP") : value}
        {unit && <span className="ml-1 text-sm font-medium text-ink2">{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-xs text-ink3">{sub}</p>}
    </div>
  );
}

export function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2.5">
      <dt className="mk-label">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line2 bg-panel2 px-6 py-14 text-center">
      <p className="font-serif text-base font-semibold text-ink2">{title}</p>
      {sub && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink3">{sub}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy2"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 border border-line2 bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-navy hover:text-navy"
    >
      {children}
    </Link>
  );
}
