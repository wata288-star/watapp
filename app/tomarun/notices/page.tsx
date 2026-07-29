import Link from "next/link";
import AppBar from "../components/AppBar";
import { IconAlert, IconChevronRight, IconPlaySquare, IconWrench } from "../components/icons";
import { notices } from "../lib/data";

const kindIcon = {
  generated: IconWrench,
  content: IconPlaySquare,
  system: IconAlert,
};

export default function NoticesPage() {
  return (
    <>
      <AppBar title="お知らせ" subtitle={`未読 ${notices.filter((n) => n.unread).length}件`} backHref="/tomarun" />

      <div className="tm-scroll">
        <div className="tm-pad">
          <div className="tm-stack">
            {notices.map((n) => {
              const Icon = kindIcon[n.kind];
              return (
                <div key={n.id} className="tm-notice-card" data-unread={n.unread}>
                  <span className="tm-notice-card__icon">
                    <Icon size={20} />
                  </span>
                  <div className="tm-notice-card__body">
                    <div className="tm-notice-card__top">
                      <b>{n.title}</b>
                      {n.unread ? <i className="tm-dot" aria-label="未読" /> : null}
                    </div>
                    <p>{n.body}</p>
                    <span className="tm-notice-card__at">{n.at}</span>
                    {n.kind === "generated" ? (
                      <Link href="/tomarun/troubleshoot" className="tm-linkrow" style={{ marginTop: 10 }}>
                        公開されたツリーを見る
                        <IconChevronRight className="tm-row__chev" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
