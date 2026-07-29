import Link from "next/link";
import BrandHero from "./components/BrandHero";
import { IconBell, IconPlaySquare, IconWrench } from "./components/icons";
import { tenant } from "./lib/data";

export default function HomePage() {
  return (
    <>
      <div className="tm-scroll tm-home">
        <div className="tm-home__top">
          <BrandHero appName={tenant.appName} />
          <div className="tm-home__overlay">
            <span className="tm-home__tenant">{tenant.name}</span>
            <Link href="/tomarun/notices" className="tm-home__bell" aria-label={`お知らせ ${tenant.unread}件`}>
              <IconBell size={22} />
              {tenant.unread > 0 ? <i>{tenant.unread}</i> : null}
            </Link>
          </div>
        </div>

        <div className="tm-home__cards">
          <Link href="/tomarun/troubleshoot" className="tm-bigcard">
            <span className="tm-bigcard__icon">
              <IconWrench size={44} />
            </span>
            <b>トラブルシューティング</b>
            <span className="tm-bigcard__sub">機械が止まったとき</span>
            <span className="tm-badge tm-badge--amber tm-bigcard__resume">中断中の診断 1件</span>
          </Link>

          <Link href="/tomarun/videos" className="tm-bigcard">
            <span className="tm-bigcard__icon">
              <IconPlaySquare size={44} />
            </span>
            <b>動画マニュアル</b>
            <span className="tm-bigcard__sub">やり方を動画で見る</span>
          </Link>
        </div>
      </div>
    </>
  );
}
