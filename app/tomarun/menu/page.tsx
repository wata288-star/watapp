import Link from "next/link";
import {
  IconBell,
  IconChevronRight,
  IconClock,
  IconOffline,
  IconPdf,
  IconRecord,
  IconUser,
} from "../components/icons";
import { records, tenant } from "../lib/data";

export default function MenuPage() {
  const mine = records.filter((r) => r.assignee === tenant.user);
  const avgDowntime = Math.round(
    mine.filter((r) => r.downtimeMin).reduce((s, r) => s + (r.downtimeMin ?? 0), 0) /
      Math.max(1, mine.filter((r) => r.downtimeMin).length),
  );

  return (
    <>
      <header className="tm-appbar">
        <div className="tm-appbar__title">
          <b>メニュー</b>
          <span>{tenant.name}</span>
        </div>
      </header>

      <div className="tm-scroll">
        <div className="tm-pad">
          <div className="tm-profile">
            <span className="tm-profile__avatar">
              <IconUser size={26} />
            </span>
            <div>
              <b>{tenant.user}</b>
              <span>
                {tenant.role}・{tenant.name}
              </span>
            </div>
          </div>

          <div className="tm-stats">
            <div>
              <b>{mine.length}</b>
              <span>今月の対応件数</span>
            </div>
            <div>
              <b>{avgDowntime}分</b>
              <span>平均復旧時間</span>
            </div>
            <div>
              <b>{records.filter((r) => r.status === "draft").length}</b>
              <span>未完了の記録</span>
            </div>
          </div>

          <div className="tm-section-label">
            <span>アプリ</span>
          </div>

          <div className="tm-card">
            <Link href="/tomarun/notices" className="tm-row">
              <span className="tm-row__icon">
                <IconBell size={20} />
              </span>
              <span className="tm-row__body">
                <b>お知らせ</b>
                <span>新しいトラブルシューティングの公開など</span>
              </span>
              {tenant.unread > 0 ? (
                <span className="tm-badge tm-badge--red">{tenant.unread}</span>
              ) : null}
              <IconChevronRight className="tm-row__chev" />
            </Link>

            <button type="button" className="tm-row">
              <span className="tm-row__icon">
                <IconOffline size={20} />
              </span>
              <span className="tm-row__body">
                <b>オフライン設定</b>
                <span>お気に入り項目3件・動画2件を保存中／最終同期 08:02</span>
              </span>
              <IconChevronRight className="tm-row__chev" />
            </button>

            <button type="button" className="tm-row">
              <span className="tm-row__icon">
                <IconRecord size={20} />
              </span>
              <span className="tm-row__body">
                <b>表示・文字サイズ</b>
                <span>屋外・暗所での視認性を調整</span>
              </span>
              <IconChevronRight className="tm-row__chev" />
            </button>

            <button type="button" className="tm-row">
              <span className="tm-row__icon">
                <IconPdf size={20} />
              </span>
              <span className="tm-row__body">
                <b>PDF報告書の書式</b>
                <span>出力する項目・ロゴの設定</span>
              </span>
              <IconChevronRight className="tm-row__chev" />
            </button>
          </div>

          <div className="tm-section-label">
            <span>アカウント</span>
          </div>

          <div className="tm-card">
            <button type="button" className="tm-row">
              <span className="tm-row__icon">
                <IconUser size={20} />
              </span>
              <span className="tm-row__body">
                <b>アカウント情報</b>
                <span>{tenant.user}・パスワード変更</span>
              </span>
              <IconChevronRight className="tm-row__chev" />
            </button>

            <button type="button" className="tm-row">
              <span className="tm-row__icon">
                <IconClock size={20} />
              </span>
              <span className="tm-row__body">
                <b>ヘルプ・お問い合わせ</b>
                <span>使い方とメーカーへの連絡先</span>
              </span>
              <IconChevronRight className="tm-row__chev" />
            </button>
          </div>

          <p className="tm-version">TOMARUN v1.0.0 ― 生産を、止めない。</p>
        </div>
      </div>
    </>
  );
}
