"use client";

import { useState } from "react";
import { IconStar, IconStarFill } from "../../components/icons";

/** お気に入りは項目単位。お気に入りにした項目だけをオフライン保存する。 */
export default function FavoriteButton({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);

  return (
    <button
      type="button"
      className="tm-appbar__action"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
    >
      {on ? <IconStarFill size={18} /> : <IconStar size={18} />}
      {on ? "保存中" : "お気に入り"}
    </button>
  );
}
