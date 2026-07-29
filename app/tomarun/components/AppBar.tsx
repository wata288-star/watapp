"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft } from "./icons";

type Props = {
  title: string;
  subtitle?: string;
  /** 指定すると戻る先を固定。未指定なら履歴を1つ戻る */
  backHref?: string;
  action?: React.ReactNode;
};

export default function AppBar({ title, subtitle, backHref, action }: Props) {
  const router = useRouter();

  return (
    <header className="tm-appbar">
      <button
        type="button"
        className="tm-appbar__back"
        aria-label="戻る"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
      >
        <IconChevronLeft />
      </button>
      <div className="tm-appbar__title">
        <b>{title}</b>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {action}
    </header>
  );
}
