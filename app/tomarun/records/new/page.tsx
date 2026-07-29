import { Suspense } from "react";
import RecordForm from "./RecordForm";

export default function NewRecordPage() {
  return (
    <Suspense fallback={<div className="tm-scroll" />}>
      <RecordForm />
    </Suspense>
  );
}
