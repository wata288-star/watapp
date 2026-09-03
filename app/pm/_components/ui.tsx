"use client";

// 共通 UI パーツ

import { useEffect, useState, type ReactNode } from "react";

// ------------------------------------------------------------------ Card

export function Card({
  title,
  desc,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  desc?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`pm-card ${className}`}>
      {(title || actions) && (
        <div className="pm-card-head">
          {title && <div className="pm-card-title">{title}</div>}
          <div className="pm-spacer" />
          {actions}
        </div>
      )}
      {desc && <div className="pm-card-desc">{desc}</div>}
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ Stat

export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "",
  icon,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  tone?: "" | "gold" | "cyan" | "green" | "red";
  icon?: string;
}) {
  return (
    <div className={`pm-stat ${tone}`}>
      <div className="pm-stat-label">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="pm-stat-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {sub && <div className="pm-stat-sub">{sub}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ Badge

export function Badge({
  color,
  children,
  dot = true,
}: {
  color: string;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className="pm-badge"
      style={{ background: `${color}22`, color, borderColor: `${color}44` }}
    >
      {dot && <span className="pm-dot" style={{ background: color }} />}
      {children}
    </span>
  );
}

// ------------------------------------------------------------------ Progress

export function Progress({ value, color }: { value: number; color?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="pm-progress" title={`${Math.round(v)}%`}>
      <span style={{ width: `${v}%`, background: color || undefined }} />
    </div>
  );
}

// ------------------------------------------------------------------ Field

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="pm-field">
      <span className="pm-field-label">{label}</span>
      {children}
      {hint && <span className="pm-field-hint">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`pm-input ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`pm-select ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`pm-textarea ${props.className ?? ""}`} />;
}

// ------------------------------------------------------------------ Modal

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="pm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`pm-modal ${wide ? "wide" : ""}`}>
        <div className="pm-modal-head">
          <span>{title}</span>
          <div className="pm-spacer" />
          <button className="pm-btn ghost icon" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <div className="pm-modal-body">{children}</div>
        {footer && <div className="pm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** 削除などの確認ダイアログ */
export function ConfirmButton({
  onConfirm,
  label = "削除",
  message = "削除してよろしいですか？",
  className = "pm-btn sm danger",
}: {
  onConfirm: () => void;
  label?: string;
  message?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      className={className}
      title={message}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? "本当に？" : label}
    </button>
  );
}

// ------------------------------------------------------------------ その他

export function Empty({ children }: { children: ReactNode }) {
  return <div className="pm-empty">{children}</div>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="pm-section-title">{children}</div>;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="pm-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`pm-tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && <span className="pm-muted"> ({t.count})</span>}
        </button>
      ))}
    </div>
  );
}

/** その場で編集できるテキスト（クリックで input になる） */
export function InlineEdit({
  value,
  onSave,
  type = "text",
  placeholder = "—",
  className = "",
}: {
  value: string | number;
  onSave: (v: string) => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value ?? ""));
  const [editing, setEditing] = useState(false);
  const [lastValue, setLastValue] = useState(value);

  // 編集していないときに外から値が変わったら、レンダー中に同期する
  // （React 推奨の「props が変わったら state を調整する」パターン）
  if (!editing && value !== lastValue) {
    setLastValue(value);
    setDraft(String(value ?? ""));
  }

  return (
    <input
      className={`pm-cell-input ${className}`}
      type={type}
      value={draft}
      placeholder={placeholder}
      onFocus={() => setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft !== String(value ?? "")) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(String(value ?? ""));
          setEditing(false);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

/** セル内のセレクト */
export function InlineSelect({
  value,
  options,
  onSave,
}: {
  value: string;
  options: { id: string; label: string }[];
  onSave: (v: string) => void;
}) {
  return (
    <select
      className="pm-select"
      style={{ padding: "3px 22px 3px 6px", fontSize: 11.5 }}
      value={value}
      onChange={(e) => onSave(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** 単純な横棒グラフ */
export function BarList({
  items,
  formatValue = (n: number) => String(n),
}: {
  items: { label: string; value: number; color?: string; sub?: string }[];
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((i) => (
        <div key={i.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
            <span className="pm-dim">{i.label}</span>
            <span className="pm-mono">{formatValue(i.value)}</span>
          </div>
          <div className="pm-progress" style={{ height: 7 }}>
            <span
              style={{
                width: `${(Math.abs(i.value) / max) * 100}%`,
                background: i.color || "linear-gradient(90deg,#4fc3d9,#d9b26a)",
              }}
            />
          </div>
          {i.sub && <div style={{ fontSize: 10.5 }} className="pm-muted">{i.sub}</div>}
        </div>
      ))}
    </div>
  );
}
