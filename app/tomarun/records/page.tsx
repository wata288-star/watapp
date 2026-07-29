import { Suspense } from "react";
import RecordList from "./RecordList";
import { records } from "../lib/data";

export default function RecordsPage() {
  return (
    <>
      <header className="tm-appbar">
        <div className="tm-appbar__title">
          <b>記録</b>
          <span>対応記録・点検チェック</span>
        </div>
      </header>

      <Suspense fallback={<div className="tm-scroll" />}>
        <RecordList records={records} />
      </Suspense>
    </>
  );
}
