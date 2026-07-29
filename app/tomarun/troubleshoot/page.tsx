import Link from "next/link";
import AppBar from "../components/AppBar";
import MachineThumb from "../components/MachineThumb";
import { IconQr, IconSearch } from "../components/icons";
import { machines } from "../lib/data";

export default function MachineSelectPage() {
  return (
    <>
      <AppBar title="トラブルシュート" subtitle="機体を選択" backHref="/tomarun" />

      <div className="tm-scroll">
        <div className="tm-pad">
          <div className="tm-searchrow">
            <div className="tm-search">
              <IconSearch />
              <input className="tm-search__input" placeholder="機種名・製番で探す" aria-label="機種を検索" />
            </div>
            <button type="button" className="tm-search__qr" aria-label="QRコードで機体を特定">
              <IconQr />
            </button>
          </div>

          <p className="tm-lead">
            機械に貼られたQRコードを読み取ると、機体をすぐに特定できます。
          </p>

          <div className="tm-machines">
            {machines.map((m) => (
              <Link key={m.id} href={`/tomarun/troubleshoot/${m.id}`} className="tm-machine">
                <MachineThumb name={m.name} />
                <b>{m.name}</b>
                <span className="tm-machine__cat">{m.category}</span>
                <span
                  className={`tm-badge ${m.treeCount > 0 ? "tm-badge--blue" : "tm-badge--gray"}`}
                >
                  ツリー {m.treeCount}件
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
