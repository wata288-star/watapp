import { QrScanner } from "@/components/karte/qr-scanner";

export const metadata = { title: "QRスキャン" };

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  const { notfound } = await searchParams;
  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 font-serif text-xl font-semibold">QRスキャン</h1>
      <QrScanner
        initialMessage={
          notfound ? "読み取ったQRコードに該当する機械が見つかりませんでした。" : undefined
        }
      />
    </div>
  );
}
