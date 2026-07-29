import Link from "next/link";
import AppBar from "../components/AppBar";
import MachineThumb from "../components/MachineThumb";
import { IconChevronRight, IconOffline, IconSearch } from "../components/icons";
import { machines, videos } from "../lib/data";

export default function VideoModelPage() {
  const savedCount = videos.filter((v) => v.saved).length;

  return (
    <>
      <AppBar title="動画マニュアル" subtitle="機種を選択" backHref="/tomarun" />

      <div className="tm-scroll">
        <div className="tm-pad">
          <div className="tm-search">
            <IconSearch />
            <input className="tm-search__input" placeholder="動画のタイトル・部位で探す" aria-label="動画を検索" />
          </div>

          <Link href="/tomarun/videos/mr100?saved=1" className="tm-linkrow" style={{ marginTop: 12 }}>
            <IconOffline size={18} />
            オフライン保存済みの動画（{savedCount}件）
            <IconChevronRight className="tm-row__chev" />
          </Link>

          <div className="tm-section-label">
            <span>機種から選ぶ</span>
            <span>{machines.length}件</span>
          </div>

          <div className="tm-card">
            {machines.map((m) => (
              <Link key={m.id} href={`/tomarun/videos/${m.id}`} className="tm-row">
                <span className="tm-row__thumb">
                  <MachineThumb name={m.name} />
                </span>
                <span className="tm-row__body">
                  <b>{m.name}</b>
                  <span>
                    {m.category}・動画 {m.videoCount}本
                  </span>
                </span>
                <IconChevronRight className="tm-row__chev" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
