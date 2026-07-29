import DocsBrowser from "./DocsBrowser";
import { docTopics } from "../lib/data";

export default function DocsPage() {
  return (
    <>
      <header className="tm-appbar">
        <div className="tm-appbar__title">
          <b>資料集</b>
          <span>MR100 ・ 元取説 第4版</span>
        </div>
      </header>

      <div className="tm-scroll">
        <DocsBrowser topics={docTopics} />
      </div>
    </>
  );
}
