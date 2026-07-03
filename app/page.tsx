import Link from "next/link";
import { BrandMark, GradeSeal } from "@/components/karte/ui";
import { IconCert, IconExchange, IconQr, IconShield, IconScan, IconGrid } from "@/components/karte/icons";

export const metadata = {
  title: "マシンカルテ | 産業機械履歴管理・流通支援プラットフォーム",
};

const PROBLEMS = [
  {
    who: "機械を保有する工場",
    problem:
      "点検・修理記録が紙やExcelに分散し、担当者の頭の中にしかない情報も多い。売却時に機械の状態を証明できず、安く買い叩かれる。",
    solution: "QRコードで機械ごとに履歴を一元管理。売却時は履歴証明書により適正価格での売却が可能に。",
  },
  {
    who: "中古機械の買い手",
    problem:
      "機械の使用状態・整備状況が分からず、購入は賭けに近い。故障リスクを織り込んで買い控えるか、値引きを要求せざるを得ない。",
    solution: "第三者が管理する整備履歴を確認した上で購入でき、不確実性が大幅に減る。",
  },
  {
    who: "買取・販売業者",
    problem:
      "査定材料が年式・稼働時間・外観写真に限られる。仕入れた機械の素性が分からず、値付けとクレーム対応に苦慮している。",
    solution: "履歴付きの機械情報が仕入れ候補として流入。査定精度が上がり、販売時の説明材料にもなる。",
  },
];

const LAYERS = [
  {
    no: "01",
    name: "機械カルテ",
    sub: "履歴管理SaaS",
    icon: IconQr,
    body: "機械1台ごとにQRコードを貼付。スマートフォンで読み取ると、基本情報・取扱説明書・点検・修理・部品交換の全履歴が表示されます。記録は「写真を撮って一言メモ」だけで完了。入力内容は自動で整形・分類されます。",
    price: "機械1台あたり 月額700円",
    priceNote: "導入支援(QR貼付・既存記録のデータ移行代行)は1工場あたり30万円",
  },
  {
    no: "02",
    name: "履歴証明書",
    sub: "第三者管理データによる証明",
    icon: IconCert,
    body: "売却時に、蓄積された履歴を第三者管理のデータとして証明します。記録充実度をA・B・Cの三等級で表示し、証明書のQRコードから誰でも真贋を照合可能。同一データから日本語版・英語版をワンクリックで発行できます。",
    price: "標準(日本語) 1通 2万円",
    priceNote: "英語版は追加1万円。有効期限は発行から6ヶ月",
  },
  {
    no: "03",
    name: "売買マッチング",
    sub: "提携業者への送客",
    icon: IconExchange,
    body: "カルテ登録済みの機械に売却希望が出た場合、提携する買取業者・マーケットプレイスへ履歴情報とともに紹介します。履歴は保有企業の内部情報として厳格に分離し、売却手続きを開始するまで外部には一切開示されません。",
    price: "成約額の5%",
    priceNote: "成約時のみ発生する紹介手数料",
  },
];

export default function LandingPage() {
  return (
    <div data-app="karte" className="min-h-dvh bg-paper text-ink">
      {/* ヘッダー */}
      <header className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-ink2 md:flex">
            <a href="#service" className="hover:text-navy">サービス</a>
            <a href="#certificate" className="hover:text-navy">履歴証明書</a>
            <a href="#pricing" className="hover:text-navy">料金</a>
            <Link href="/verify" className="hover:text-navy">証明書照合</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy2"
            >
              ログイン
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="mk-label mb-4">産業機械履歴管理・流通支援プラットフォーム</p>
            <h1 className="font-serif text-4xl font-semibold leading-snug tracking-wide md:text-5xl md:leading-snug">
              機械の履歴が、
              <br />
              資産になる。
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-ink2 md:text-[15px] md:leading-8">
              工作機械、射出成形機、プレス機、食品機械。工場で稼働する産業機械1台ごとに、購入から点検・修理・部品交換までの全履歴を記録する「機械のカルテ」。
              蓄積された整備履歴は、中古売却時の「履歴証明書」として資産価値に転換されます。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/login?dest=console"
                className="inline-flex items-center gap-2.5 bg-navy px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-navy2"
              >
                <IconGrid width={17} height={17} />
                WEB版コンソール
              </Link>
              <Link
                href="/login?dest=m"
                className="inline-flex items-center gap-2.5 border border-line2 bg-panel px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-navy hover:text-navy"
              >
                <IconScan width={17} height={17} />
                スマホ版フィールドアプリ
              </Link>
            </div>
            <p className="mt-5 text-xs text-ink3">
              デモ環境: ログイン画面のデモアカウントからすべての機能をご確認いただけます。
            </p>
          </div>

          {/* 証明書ビジュアル */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="border border-line2 bg-panel p-7 shadow-[0_1px_0_rgba(27,29,33,0.04),0_16px_40px_-24px_rgba(29,49,83,0.35)]">
                <div className="flex items-start justify-between border-b border-line pb-4">
                  <div>
                    <p className="mk-label">機械整備履歴証明書</p>
                    <p className="mt-1 font-serif text-lg font-semibold">Machine Maintenance History Certificate</p>
                  </div>
                  <GradeSeal grade="A" size={64} />
                </div>
                <dl className="mt-4 space-y-2.5 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-ink3">証明書番号</dt>
                    <dd className="font-mono">MC-2026-0012</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink3">機械名称</dt>
                    <dd>NC旋盤 QUICK TURN 250MSY</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink3">保有期間</dt>
                    <dd className="mk-tabular">86ヶ月</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink3">点検・修理・部品交換</dt>
                    <dd className="mk-tabular">83件 / 2件 / 4件</dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <p className="text-[11px] leading-relaxed text-ink3">
                    本証明書は記録の充実度と真正性を証明するものであり、
                    <br />
                    機械の品質を保証するものではありません。
                  </p>
                  <IconQr width={34} height={34} className="text-ink2" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full border border-line2 bg-panel2" />
            </div>
          </div>
        </div>
      </section>

      {/* 実証された前提 */}
      <section className="border-b border-line bg-panel">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="font-serif text-2xl font-semibold text-navy mk-tabular">82億ドル → 126億ドル</p>
              <p className="mt-2 text-sm leading-6 text-ink2">
                中古工作機械の世界市場は2030年に向けて年率5.6%で拡大。日本製機械は海外バイヤーから高い評価を得ています。
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold text-navy">整備履歴が中古価値を生む</p>
              <p className="mt-2 text-sm leading-6 text-ink2">
                メンテナンス履歴の透明性が再販価格を高めることは、建設機械業界の先行事例で既に実証されています。
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold text-navy">メーカー横断の空白</p>
              <p className="mt-2 text-sm leading-6 text-ink2">
                多様なメーカーの機械が混在する一般の工場には、横断で通用する履歴の仕組みが存在しません。マシンカルテはこの空白を埋めます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 課題 */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="mk-label mb-2">解決する課題</p>
          <h2 className="font-serif text-2xl font-semibold tracking-wide md:text-3xl">
            三者すべてに、明確な便益を。
          </h2>
          <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.who} className="bg-panel p-7">
                <h3 className="font-serif text-base font-semibold text-navy">{p.who}</h3>
                <p className="mt-3 text-[13px] leading-6 text-ink3">{p.problem}</p>
                <div className="mk-rule my-4" />
                <p className="text-sm leading-6 text-ink">{p.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* サービス3層 */}
      <section id="service" className="border-b border-line bg-panel">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="mk-label mb-2">サービス内容</p>
          <h2 className="font-serif text-2xl font-semibold tracking-wide md:text-3xl">
            三層で構成される収益と価値の構造
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink2">
            第1層で顧客基盤とデータを蓄積し、第2層で独自の信用ポジションを確立し、第3層で流通市場から収益を回収する。いずれも顧客側に明確な便益があるうえで対価をいただく構造です。
          </p>
          <div className="mt-10 space-y-px border border-line bg-line">
            {LAYERS.map((l) => (
              <div key={l.no} className="grid gap-6 bg-panel p-7 md:grid-cols-[64px_1fr_260px] md:gap-10">
                <div className="flex items-start gap-4 md:block">
                  <p className="font-serif text-3xl font-semibold text-line2">{l.no}</p>
                  <l.icon width={26} height={26} className="mt-1.5 text-navy md:mt-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold">
                    {l.name}
                    <span className="ml-3 text-sm font-medium text-ink3">{l.sub}</span>
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-ink2">{l.body}</p>
                </div>
                <div className="border-l-2 border-copper pl-5 md:self-center">
                  <p className="mk-label">価格</p>
                  <p className="mt-1 font-serif text-lg font-semibold text-ink">{l.price}</p>
                  <p className="mt-1 text-xs leading-5 text-ink3">{l.priceNote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 証明書の設計 */}
      <section id="certificate" className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2">
          <div>
            <p className="mk-label mb-2">履歴証明書</p>
            <h2 className="font-serif text-2xl font-semibold tracking-wide md:text-3xl">
              自動車の整備記録簿に相当する、
              <br />
              機械のための第三者証明。
            </h2>
            <ul className="mt-8 space-y-5">
              {[
                {
                  t: "記録充実度の三等級制",
                  d: "導入時からの全履歴と規定どおりの定期点検が確認できる「A」、直近3年以上の履歴がある「B」、基本情報と部分的な履歴の「C」。",
                },
                {
                  t: "QRコードによる真贋照合",
                  d: "証明書のQRコードを読み取ると、当社サーバー上の照合ページで証明書番号と内容の一致を誰でも確認できます。",
                },
                {
                  t: "日英2言語対応",
                  d: "同一データから日本語版・英語版をワンクリックで発行。英文整備記録付きの日本製中古機械は、海外バイヤーに対する強力な差別化要素です。",
                },
                {
                  t: "品質保証ではなく、記録の証明",
                  d: "証明対象は「記録の充実度と真正性」。品質判断は買い手・査定業者に委ねる、自動車の第三者鑑定と同様の設計です。",
                },
              ].map((item) => (
                <li key={item.t} className="flex gap-4">
                  <IconShield width={20} height={20} className="mt-0.5 shrink-0 text-copper" />
                  <div>
                    <p className="text-sm font-semibold">{item.t}</p>
                    <p className="mt-1 text-[13px] leading-6 text-ink2">{item.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-5 border border-line bg-panel2 p-8">
            <div className="flex items-center gap-6">
              <GradeSeal grade="A" size={76} />
              <p className="text-sm leading-6 text-ink2">
                導入時からの全履歴と、規定どおりの定期点検・法定点検が確認できる状態。
              </p>
            </div>
            <div className="mk-rule" />
            <div className="flex items-center gap-6">
              <GradeSeal grade="B" size={76} />
              <p className="text-sm leading-6 text-ink2">直近3年以上の継続した整備履歴が確認できる状態。</p>
            </div>
            <div className="mk-rule" />
            <div className="flex items-center gap-6">
              <GradeSeal grade="C" size={76} />
              <p className="text-sm leading-6 text-ink2">基本情報と部分的な履歴が確認できる状態。</p>
            </div>
            <div className="mk-rule" />
            <Link href="/verify" className="text-sm font-medium text-navy underline underline-offset-4 hover:text-navy2">
              証明書番号による照合はこちら
            </Link>
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section id="pricing" className="border-b border-line bg-panel">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="mk-label mb-2">料金</p>
          <h2 className="font-serif text-2xl font-semibold tracking-wide md:text-3xl">明快な三層の価格体系</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border border-line text-sm">
              <thead>
                <tr className="bg-panel2 text-left">
                  <th className="border-b border-line px-5 py-3 font-medium text-ink3">収益層</th>
                  <th className="border-b border-line px-5 py-3 font-medium text-ink3">内容</th>
                  <th className="border-b border-line px-5 py-3 font-medium text-ink3">価格</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-line px-5 py-4 font-medium">第1層 SaaS利用料</td>
                  <td className="border-b border-line px-5 py-4 text-ink2">
                    機械カルテの月額利用料および導入支援(QR貼付、既存記録のデータ移行代行)
                  </td>
                  <td className="border-b border-line px-5 py-4 mk-tabular">
                    機械1台あたり月額700円
                    <br />
                    <span className="text-xs text-ink3">導入支援は1工場あたり30万円</span>
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-line px-5 py-4 font-medium">第2層 履歴証明書</td>
                  <td className="border-b border-line px-5 py-4 text-ink2">
                    売却時の履歴証明書発行料(記録充実度の等級付き、QR照合、日英2言語対応)
                  </td>
                  <td className="border-b border-line px-5 py-4 mk-tabular">
                    標準(日本語)1通 2万円
                    <br />
                    <span className="text-xs text-ink3">英語版は追加1万円・有効期限6ヶ月</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium">第3層 送客手数料</td>
                  <td className="px-5 py-4 text-ink2">提携買取業者・マーケットプレイスへの成約時紹介料</td>
                  <td className="px-5 py-4 mk-tabular">成約額の5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-wide">
              義務としての記録を、そのまま資産に。
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
              プレス機の定期自主検査、食品機械のHACCP対応。法令で義務化された記録のテンプレートを用意し、日々の記録がそのまま履歴証明書の裏付けになります。
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/login?dest=console"
              className="inline-flex items-center bg-white px-5 py-3 text-sm font-medium text-navy transition-colors hover:bg-paper"
            >
              WEB版を試す
            </Link>
            <Link
              href="/login?dest=m"
              className="inline-flex items-center border border-white/40 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-white"
            >
              スマホ版を試す
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div>
            <BrandMark compact />
            <p className="mt-3 text-xs leading-5 text-ink3">
              産業機械履歴管理・流通支援プラットフォーム
              <br />
              運営: 株式会社FLYHEIT
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-ink3">
            <Link href="/verify" className="hover:text-navy">証明書照合</Link>
            <Link href="/login" className="hover:text-navy">ログイン</Link>
            <span>&copy; 2026 FLYHEIT Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
