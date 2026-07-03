"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { IconScan } from "./icons";

type ScanState = "idle" | "starting" | "scanning" | "resolving" | "error" | "denied";

export function QrScanner({ initialMessage }: { initialMessage?: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);
  const [manual, setManual] = useState("");

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resolve = useCallback(
    async (raw: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setState("resolving");
      // QRの内容はURL(…/k/CODE)またはコード単体を想定
      const match = raw.match(/\/k\/([A-Za-z0-9-]+)/);
      const code = (match ? match[1] : raw).trim().toUpperCase();
      try {
        const res = await fetch(`/api/karte/resolve/${encodeURIComponent(code)}`);
        if (res.ok) {
          const data = (await res.json()) as { machineId: string };
          stop();
          router.push(`/m/machines/${data.machineId}`);
          return;
        }
        setMessage(`コード「${code}」に該当する自社の機械が見つかりません。`);
      } catch {
        setMessage("通信に失敗しました。電波状況をご確認ください。");
      }
      busyRef.current = false;
      setState((s) => (streamRef.current ? "scanning" : s === "resolving" ? "idle" : s));
    },
    [router, stop],
  );

  const start = useCallback(async () => {
    setMessage(null);
    setState("starting");
    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !busyRef.current) {
        const w = Math.min(video.videoWidth, 640);
        const h = Math.round((video.videoHeight / video.videoWidth) * w) || 480;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const qr = jsQR(imageData.data, w, h, { inversionAttempts: "dontInvert" });
          if (qr && qr.data) {
            void resolve(qr.data);
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setState("scanning");
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setState("denied");
      setMessage("カメラを起動できませんでした。下の入力欄からコードを直接入力してください。");
    }
  }, [resolve]);

  useEffect(() => stop, [stop]);

  return (
    <div>
      {/* カメラビュー */}
      <div className="relative aspect-square w-full overflow-hidden bg-ink">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {/* 照準枠 */}
        {state === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-52 w-52">
              {["-top-px -left-px border-t-2 border-l-2", "-top-px -right-px border-t-2 border-r-2", "-bottom-px -left-px border-b-2 border-l-2", "-bottom-px -right-px border-b-2 border-r-2"].map((cls) => (
                <span key={cls} className={`absolute h-8 w-8 border-white ${cls}`} />
              ))}
            </div>
          </div>
        )}
        {(state === "idle" || state === "denied" || state === "starting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/85 px-8 text-center">
            <IconScan width={40} height={40} className="text-white/70" />
            <p className="text-sm leading-6 text-white/80">
              機械に貼付されたQRラベルを読み取ると、
              <br />
              その機械のカルテが開きます。
            </p>
            <button
              type="button"
              onClick={start}
              disabled={state === "starting"}
              className="bg-white px-6 py-3 text-sm font-medium text-ink transition-opacity disabled:opacity-60"
            >
              {state === "starting" ? "カメラを起動中..." : "カメラを起動する"}
            </button>
          </div>
        )}
        {state === "resolving" && (
          <div className="absolute inset-x-0 bottom-0 bg-navy px-4 py-3 text-center text-sm text-white">
            照会中...
          </div>
        )}
      </div>

      {message && (
        <p className="mt-4 border border-warn/30 bg-warnsoft px-4 py-3 text-[13px] leading-6 text-warn">{message}</p>
      )}

      {/* 手入力 */}
      <div className="mt-6">
        <p className="mk-label mb-2">コードを直接入力</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) void resolve(manual);
          }}
          className="flex gap-2"
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="K7F3-A2BC"
            autoCapitalize="characters"
            className="w-full border border-line2 bg-panel px-3.5 py-3 font-mono text-sm uppercase tracking-widest outline-none focus:border-navy"
          />
          <button
            type="submit"
            className="shrink-0 bg-navy px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-navy2"
          >
            開く
          </button>
        </form>
        <p className="mt-2 text-xs leading-5 text-ink3">
          コードはQRラベルの右上に記載されています。
        </p>
      </div>
    </div>
  );
}
