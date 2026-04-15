"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { createPeerConnection, getUserMedia, createOffer, createAnswer } from "@/lib/webrtc";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.id as string;
  const username = searchParams.get("username") || "匿名";
  const startWithVideo = searchParams.get("video") === "true";

  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(startWithVideo);
  const [connectionState, setConnectionState] = useState<string>("待機中");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketIdRef = useRef<string>("");

  const createConnection = useCallback(
    (targetSocketId: string) => {
      const socket = getSocket();
      const pc = createPeerConnection(
        (candidate) => {
          socket.emit("ice-candidate", { to: targetSocketId, candidate });
        },
        (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        },
        (state) => {
          const stateMap: Record<string, string> = {
            connecting: "接続中...",
            connected: "通話中",
            disconnected: "切断",
            failed: "接続失敗",
            closed: "終了",
          };
          setConnectionState(stateMap[state] || state);
          if (state === "connected") setIsConnected(true);
        }
      );
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }
      peerConnectionRef.current = pc;
      return pc;
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        // デフォルトは音声のみ。ビデオはパラメータで指定された場合のみ
        const stream = await getUserMedia(startWithVideo, true);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const socket = connectSocket();
        socketIdRef.current = socket.id || "";

        socket.on("connect", () => {
          socketIdRef.current = socket.id || "";
          socket.emit("join-room", { roomId, username });
          if (isMounted) setConnectionState("相手を待っています...");
        });

        socket.on("user-joined", async ({ socketId: remoteId, username: remName }) => {
          if (!isMounted) return;
          setRemoteUsername(remName);
          setConnectionState("接続中...");
          const pc = createConnection(remoteId);
          const offer = await createOffer(pc);
          socket.emit("offer", { to: remoteId, offer });
        });

        socket.on("offer", async ({ from, offer, username: remName }) => {
          if (!isMounted) return;
          setRemoteUsername(remName);
          setConnectionState("接続中...");
          const pc = createConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await createAnswer(pc);
          socket.emit("answer", { to: from, answer });
        });

        socket.on("answer", async ({ answer }) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        socket.on("user-left", ({ username: remName }) => {
          if (!isMounted) return;
          setRemoteUsername(null);
          setIsConnected(false);
          setConnectionState(`${remName} が退出しました`);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
        });

        socket.on("room-users", (users: { socketId: string; username: string }[]) => {
          if (users.length > 0 && isMounted) setConnectionState("接続中...");
        });

        if (socket.connected) {
          socketIdRef.current = socket.id || "";
          socket.emit("join-room", { roomId, username });
          setConnectionState("相手を待っています...");
        }
      } catch {
        if (isMounted) setConnectionState("マイクへのアクセスが拒否されました");
      }
    };

    init();
    return () => {
      isMounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
      disconnectSocket();
    };
  }, [roomId, username, startWithVideo, createConnection]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (!isVideoOn) {
      // ビデオON: カメラ取得してトラック追加
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });
        const videoTrack = videoStream.getVideoTracks()[0];

        // ローカルストリームに追加
        localStreamRef.current?.addTrack(videoTrack);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        // PeerConnectionにトラック追加
        if (peerConnectionRef.current && localStreamRef.current) {
          peerConnectionRef.current.addTrack(videoTrack, localStreamRef.current);
        }

        setIsVideoOn(true);
      } catch (err) {
        console.error("カメラ取得に失敗:", err);
      }
    } else {
      // ビデオOFF: カメラトラック停止・削除
      localStreamRef.current?.getVideoTracks().forEach((t) => {
        t.stop();
        localStreamRef.current?.removeTrack(t);
      });

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        senders.forEach((sender) => {
          if (sender.track?.kind === "video") {
            peerConnectionRef.current?.removeTrack(sender);
          }
        });
      }

      setIsVideoOn(false);
    }
  };

  const hangUp = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    disconnectSocket();
    router.back();
  };

  return (
    <div className="flex-1 flex flex-col h-dvh overflow-hidden bg-[#0a0a0a]">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <button
          onClick={hangUp}
          className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-[15px] font-semibold text-white">
            {remoteUsername || "通話"}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#34d399]" : "bg-[#555]"}`} />
            <span className="text-[11px] text-[#555]">{connectionState}</span>
          </div>
        </div>
        <div className="w-9" />
      </header>

      {/* メインエリア */}
      <div className="flex-1 flex items-center justify-center relative">
        {isVideoOn ? (
          <>
            {/* リモートビデオ */}
            <div className="w-full h-full bg-[#111] relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[32px] font-bold text-[#444]">
                    {remoteUsername ? remoteUsername.charAt(0).toUpperCase() : "?"}
                  </div>
                  <p className="text-[13px] text-[#444] mt-3">{connectionState}</p>
                </div>
              )}
            </div>

            {/* ローカルビデオ（小窓） */}
            <div className="absolute top-4 right-4 w-24 h-32 z-10">
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#222] bg-[#1a1a1a]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </>
        ) : (
          /* 音声通話UI */
          <div className="flex flex-col items-center justify-center">
            <div className="w-28 h-28 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-5">
              <span className="text-[42px] font-bold text-[#444]">
                {remoteUsername ? remoteUsername.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              {remoteUsername || "発信中..."}
            </h2>
            <p className="text-sm text-[#555]">{connectionState}</p>
            {isConnected && (
              <div className="flex items-center gap-1.5 mt-3">
                <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
                <span className="text-xs text-[#34d399]">通話中</span>
              </div>
            )}
            {/* 非表示のvideoタグ（音声再生用） */}
            <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
            <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
          </div>
        )}
      </div>

      {/* コントロール */}
      <div className="flex items-center justify-center gap-5 px-4 py-6 border-t border-[#1a1a1a]">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
            isMuted ? "bg-[#ef4444]/20 text-[#ef4444]" : "bg-[#1a1a1a] text-white hover:bg-[#222]"
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5m14 0l-2.5 2.5M12 18.75a6 6 0 005.942-5.193M12 18.75v3.75m-3.75 0h7.5M12 15.75A3 3 0 019 12.75v-1.5M15 9.75v3a3 3 0 01-.879 2.121" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
            isVideoOn ? "bg-white text-black" : "bg-[#1a1a1a] text-[#888] hover:bg-[#222]"
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          onClick={hangUp}
          className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center text-white transition hover:bg-[#dc2626]"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
