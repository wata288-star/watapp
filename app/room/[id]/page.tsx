"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { createPeerConnection, getUserMedia, createOffer, createAnswer } from "@/lib/webrtc";

interface ChatMessage {
  username: string;
  message: string;
  timestamp: number;
  socketId: string;
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.id as string;
  const username = searchParams.get("username") || "匿名";

  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectionState, setConnectionState] = useState<string>("待機中");
  const [unreadCount, setUnreadCount] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketIdRef = useRef<string>("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

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
            connected: "接続済み",
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
        const stream = await getUserMedia(true, true);
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

        socket.on("chat-message", (msg: ChatMessage) => {
          if (!isMounted) return;
          setMessages((prev) => [...prev, msg]);
          setIsChatOpen((open) => {
            if (!open && msg.socketId !== socketIdRef.current) {
              setUnreadCount((c) => c + 1);
            }
            return open;
          });
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
        if (isMounted) setConnectionState("カメラ/マイクへのアクセスが拒否されました");
      }
    };

    init();
    return () => {
      isMounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
      disconnectSocket();
    };
  }, [roomId, username, createConnection]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsVideoOff(!isVideoOff);
  };

  const hangUp = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    disconnectSocket();
    router.push("/");
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    getSocket().emit("chat-message", { roomId, message: newMessage.trim() });
    setNewMessage("");
  };

  return (
    <div className="flex-1 flex flex-col h-dvh overflow-hidden bg-[#0a0a0a]">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#34d399]" : "bg-[#666]"}`} />
          <div>
            <div className="text-[13px] font-semibold text-white">{roomId}</div>
            <div className="text-[11px] text-[#666]">{connectionState}</div>
          </div>
        </div>
        {remoteUsername && (
          <div className="text-xs text-[#888]">{remoteUsername}</div>
        )}
      </header>

      {/* メイン */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* ビデオエリア */}
        <div className={`flex-1 flex flex-col p-2 ${isChatOpen ? "hidden sm:flex" : ""}`}>
          <div className="flex-1 relative bg-[#111] rounded-2xl overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[32px] font-bold text-[#444]">
                  ?
                </div>
                <p className="text-[13px] text-[#444] mt-3">相手を待っています...</p>
              </div>
            )}
            {remoteUsername && isConnected && (
              <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs text-white">
                {remoteUsername}
              </div>
            )}
          </div>

          {/* 自分の映像 */}
          <div className="absolute top-16 right-4 w-20 h-[110px] z-10">
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#222] bg-[#1a1a1a]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 bg-[#141414] flex items-center justify-center">
                  <span className="text-sm font-bold text-[#444]">OFF</span>
                </div>
              )}
              <div className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-[#888]">
                {username}
              </div>
            </div>
          </div>
        </div>

        {/* チャットパネル */}
        {isChatOpen && (
          <div className="w-full sm:w-80 flex flex-col bg-[#0a0a0a] border-l border-[#1a1a1a]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
              <span className="text-sm font-semibold text-white">チャット</span>
              <button onClick={() => setIsChatOpen(false)} className="text-[#666] hover:text-white transition">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-[#444] text-center mt-8">メッセージなし</p>
              )}
              {messages.map((msg, i) => {
                const isOwn = msg.socketId === socketIdRef.current;
                return (
                  <div key={i} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] text-[#555] mb-1">{msg.username}</span>
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed ${
                        isOwn
                          ? "bg-white text-black rounded-2xl rounded-br-sm"
                          : "bg-[#1a1a1a] text-[#ccc] rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-[#333] mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-[#1a1a1a]">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージ..."
                className="flex-1 px-4 py-3 bg-[#141414] border border-[#222] rounded-xl text-white text-sm placeholder-[#444] outline-none focus:border-[#444] transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-11 h-11 bg-white rounded-xl text-black flex items-center justify-center disabled:opacity-30 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* コントロール */}
      <div className="flex items-center justify-center gap-5 px-4 py-4 border-t border-[#1a1a1a]">
        <button
          onClick={toggleMute}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition ${
            isMuted ? "bg-[#1a1a1a] text-[#ef4444]" : "bg-[#1a1a1a] text-white hover:bg-[#222]"
          }`}
        >
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>

        <button
          onClick={toggleVideo}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition ${
            isVideoOff ? "bg-[#1a1a1a] text-[#ef4444]" : "bg-[#1a1a1a] text-white hover:bg-[#222]"
          }`}
        >
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          onClick={hangUp}
          className="w-[52px] h-[52px] bg-[#ef4444] rounded-full flex items-center justify-center text-white transition hover:bg-[#dc2626]"
        >
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition relative ${
            isChatOpen ? "bg-white text-black" : "bg-[#1a1a1a] text-white hover:bg-[#222]"
          }`}
        >
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#ef4444] rounded-full text-[10px] flex items-center justify-center text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
