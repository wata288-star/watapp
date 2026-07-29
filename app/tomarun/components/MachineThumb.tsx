/**
 * 機体サムネイル。実装時はメーカーが登録した機種写真に差し替える。
 * ここでは写真が未登録の場合のプレースホルダを兼ねる。
 */
export default function MachineThumb({ name }: { name: string }) {
  return (
    <div className="tm-thumb" aria-hidden>
      <svg viewBox="0 0 120 72" fill="none">
        <rect x="6" y="22" width="44" height="38" rx="3" fill="#c9d5e8" />
        <rect x="12" y="28" width="20" height="14" rx="2" fill="#8ea6c9" />
        <rect x="12" y="46" width="32" height="4" rx="2" fill="#8ea6c9" />
        <rect x="54" y="12" width="60" height="48" rx="3" fill="#dbe3f0" />
        <circle cx="72" cy="34" r="9" fill="#a8bcd9" />
        <circle cx="96" cy="34" r="6" fill="#a8bcd9" />
        <rect x="54" y="6" width="60" height="6" rx="3" fill="#b6c6de" />
        <rect x="2" y="60" width="116" height="6" rx="3" fill="#aebfd6" />
      </svg>
      <span>{name}</span>
    </div>
  );
}
