"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { connectSocket, getSocket } from "@/lib/socket";

interface ChatMessage {
  msgId?: string;
  username: string;
  message: string;
  timestamp: number;
  socketId: string;
  type?: "text" | "image" | "video";
  fileData?: string;
  fileName?: string;
  edited?: boolean;
  editedAt?: number;
}

function getChatRoomId(a: string, b: string): string {
  return [a, b].sort().join("--");
}

function formatLastSeen(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const d = new Date(ts);
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactUserId = decodeURIComponent(params.name as string);
  const contactName = searchParams.get("name") || contactUserId;
  const isAdmin = searchParams.get("admin") === "1";

  const [myUsername, setMyUsername] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ type: "image" | "video"; src: string } | null>(null);
  const [editingMsg, setEditingMsg] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [lastReadAt, setLastReadAt] = useState<number | null>(null);
  const [contactLocation, setContactLocation] = useState<{ lat: number; lng: number; timestamp: number } | null>(null);
  const [showLocation, setShowLocation] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const roomIdRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);
  const [viewportH, setViewportH] = useState<number | null>(null);

  // メッセージ追加時に最下部へスクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // visualViewport でキーボード開閉時にコンテナをリアルタイム追従
  // iOS Safari はキーボード表示時にページ自体をスクロールし、
  // fixed要素がずれるため offsetTop も合わせて補正する
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      // コンテナの高さ＝実際に見えている領域の高さ
      el.style.height = `${vv.height}px`;
      // コンテナの位置＝iOS がページをスクロールした分だけ下にずらす
      // これでキーボードの真上にコンテナ下端（入力欄）がぴったり来る
      el.style.top = `${vv.offsetTop}px`;
      setViewportH(vv.height);

      // 最新メッセージを表示
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    };

    // 初回
    update();

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (editingMsg && editInputRef.current) editInputRef.current.focus();
  }, [editingMsg]);

  const loadMessages = useCallback((roomId: string) => {
    try {
      const saved = localStorage.getItem(`watapp-chat-${roomId}`);
      if (saved) return JSON.parse(saved) as ChatMessage[];
    } catch {}
    return [];
  }, []);

  const saveMessages = useCallback((roomId: string, msgs: ChatMessage[]) => {
    const toSave = msgs.slice(-100);
    localStorage.setItem(`watapp-chat-${roomId}`, JSON.stringify(toSave));
  }, []);

  const updateContactLastMessage = useCallback((msg: string, time: number) => {
    try {
      const saved = localStorage.getItem("watapp-contacts");
      if (!saved) return;
      const contacts = JSON.parse(saved);
      const idx = contacts.findIndex((c: { userId: string }) => c.userId === contactUserId);
      if (idx >= 0) {
        contacts[idx].lastMessage = msg;
        contacts[idx].lastTime = time;
        const [contact] = contacts.splice(idx, 1);
        contacts.unshift(contact);
        localStorage.setItem("watapp-contacts", JSON.stringify(contacts));
      }
    } catch {}
  }, [contactUserId]);

  useEffect(() => {
    const savedName = localStorage.getItem("watapp-username");
    const savedId = localStorage.getItem("watapp-userId");
    if (!savedName || !savedId) { router.push("/"); return; }
    setMyUsername(savedName);
    setMyUserId(savedId);

    const roomId = getChatRoomId(savedId, contactUserId);
    roomIdRef.current = roomId;
    setMessages(loadMessages(roomId));

    const socket = connectSocket();

    const onConnect = () => {
      socket.emit("register", { username: savedName, userId: savedId }, () => {
        socket.emit("join-room", { roomId, username: savedName });
      });
    };

    const onRoomUsers = (users: { socketId: string; username: string }[]) => {
      if (!isAdmin) return;
      setIsOnline(users.length > 0);
    };
    const onUserJoined = () => { if (isAdmin) setIsOnline(true); };
    const onUserLeft = () => { if (isAdmin) setIsOnline(false); };

    const onChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, msg];
        saveMessages(roomId, updated);
        return updated;
      });
      const label = msg.type === "image" ? "写真" : msg.type === "video" ? "動画" : msg.message;
      updateContactLastMessage(label, msg.timestamp);

      // 自分がチャット画面にいる時は既読を送信
      if (msg.username !== savedName) {
        socket.emit("mark-read", { roomId, username: savedName });
      }
    };

    const onMessageEdited = ({ msgId, newMessage: newMsg, editedAt }: { msgId: string; newMessage: string; editedAt: number }) => {
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.msgId === msgId ? { ...m, message: newMsg, edited: true, editedAt } : m
        );
        saveMessages(roomId, updated);
        return updated;
      });
    };

    // 既読通知受信（管理者用）
    const onMessagesRead = ({ readAt }: { readAt: number }) => {
      if (isAdmin) setLastReadAt(readAt);
    };

    // 位置情報受信（管理者用）
    const onUserLocation = ({ lat, lng, timestamp }: { lat: number; lng: number; timestamp: number }) => {
      if (isAdmin) setContactLocation({ lat, lng, timestamp });
    };

    socket.off("connect", onConnect);
    socket.off("room-users", onRoomUsers);
    socket.off("user-joined", onUserJoined);
    socket.off("user-left", onUserLeft);
    socket.off("chat-message", onChatMessage);
    socket.off("message-edited", onMessageEdited);
    socket.off("messages-read", onMessagesRead);
    socket.off("user-location", onUserLocation);

    socket.on("connect", onConnect);
    socket.on("room-users", onRoomUsers);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("chat-message", onChatMessage);
    socket.on("message-edited", onMessageEdited);
    socket.on("messages-read", onMessagesRead);
    socket.on("user-location", onUserLocation);

    // 管理者：ステータスポーリング
    let statusInterval: ReturnType<typeof setInterval> | null = null;
    if (isAdmin) {
      const checkStatus = () => {
        if (socket.connected) {
          socket.emit("check-status", { targetUserId: contactUserId }, (res: { online: boolean; lastSeen: number | null }) => {
            setIsOnline(res.online);
            setLastSeen(res.lastSeen);
          });
        }
      };
      setTimeout(checkStatus, 1000);
      statusInterval = setInterval(checkStatus, 10000);
    }

    // 位置情報を自動送信（全ユーザー、管理者がチャットを見ると位置がわかる）
    let locationWatch: number | null = null;
    if (navigator.geolocation) {
      const sendGeo = (pos: GeolocationPosition) => {
        if (socket.connected) {
          socket.emit("send-location", {
            roomId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            username: savedName,
          });
        }
      };
      // 初回取得
      navigator.geolocation.getCurrentPosition(sendGeo, () => {}, { enableHighAccuracy: true, timeout: 10000 });
      // 継続的に監視（移動を追跡）
      locationWatch = navigator.geolocation.watchPosition(sendGeo, () => {}, { enableHighAccuracy: true, maximumAge: 30000 });
    }

    if (socket.connected) onConnect();

    // チャットページにいる間、既読送信
    const sendReadOnFocus = () => {
      socket.emit("mark-read", { roomId, username: savedName });
    };
    window.addEventListener("focus", sendReadOnFocus);

    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (locationWatch !== null) navigator.geolocation.clearWatch(locationWatch);
      window.removeEventListener("focus", sendReadOnFocus);
      socket.off("connect", onConnect);
      socket.off("room-users", onRoomUsers);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("chat-message", onChatMessage);
      socket.off("message-edited", onMessageEdited);
      socket.off("messages-read", onMessagesRead);
      socket.off("user-location", onUserLocation);
    };
  }, [contactUserId, isAdmin, router, loadMessages, saveMessages, updateContactLastMessage]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    getSocket().emit("chat-message", { roomId: roomIdRef.current, message: newMessage.trim(), type: "text" });
    setNewMessage("");
    // キーボードを維持するためにフォーカスを戻す
    requestAnimationFrame(() => {
      msgInputRef.current?.focus();
    });
  };

  const startEdit = (msg: ChatMessage) => {
    if (msg.type && msg.type !== "text") return;
    setEditingMsg(msg.msgId || null);
    setEditText(msg.message);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMsg || !editText.trim()) return;
    getSocket().emit("edit-message", { roomId: roomIdRef.current, msgId: editingMsg, newMessage: editText.trim() });
    setEditingMsg(null);
    setEditText("");
  };

  // 画像を圧縮してから送信（スマホ写真はそのままだとデカすぎる）
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");

    if (isVideo) {
      // 動画は5MBまで（base64で膨らむため）
      if (file.size > 5 * 1024 * 1024) { alert("動画は5MBまでです"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        getSocket().emit("chat-message", {
          roomId: roomIdRef.current,
          message: "動画を送信しました",
          type: "video", fileData: reader.result as string, fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    } else {
      // 画像は圧縮してから送信
      try {
        const compressed = await compressImage(file, 1200, 0.7);
        getSocket().emit("chat-message", {
          roomId: roomIdRef.current,
          message: "写真を送信しました",
          type: "image", fileData: compressed, fileName: file.name,
        });
      } catch {
        alert("画像の読み込みに失敗しました");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 管理者用：相手の位置情報をリクエスト（相手のブラウザに位置情報APIを呼ばせる）
  const requestLocation = () => {
    setShowLocation(!showLocation);
  };

  const startCall = (withVideo: boolean) => {
    const adminParam = isAdmin ? "&admin=1" : "";
    router.push(`/room/${encodeURIComponent(roomIdRef.current)}?username=${encodeURIComponent(myUsername)}&video=${withVideo}${adminParam}`);
  };

  // 最後の自分のメッセージのインデックスを見つける（既読表示用）
  const lastOwnMsgIdx = isAdmin ? (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].username === myUsername) return i;
    }
    return -1;
  })() : -1;

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-full flex flex-col bg-white"
      style={{ height: viewportH ? `${viewportH}px` : "100dvh" }}
    >
      {/* ヘッダー（固定） */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#e5e5e5] bg-white">
        <button onClick={() => router.push("/")} className="w-9 h-9 flex items-center justify-center text-[#555] hover:text-black transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="w-10 h-10 bg-[#e8e8e8] rounded-full flex items-center justify-center shrink-0">
          <span className="text-base font-bold text-[#888]">{contactName.charAt(0).toUpperCase()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-[#111] truncate">{contactName}</div>
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[#34d399]" : "bg-[#ccc]"}`} />
              <span className="text-[11px] text-[#999]">
                {isOnline ? "オンライン" : lastSeen ? `最終: ${formatLastSeen(lastSeen)}` : "オフライン"}
              </span>
            </div>
          )}
        </div>

        {/* 管理者用：位置情報ボタン */}
        {isAdmin && (
          <button onClick={requestLocation} className={`w-9 h-9 flex items-center justify-center transition ${showLocation ? "text-[#34d399]" : "text-[#888] hover:text-black"}`} title="位置情報">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </button>
        )}

        <button onClick={() => startCall(false)} className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-black transition" title="音声通話">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </button>
        <button onClick={() => startCall(true)} className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-black transition" title="ビデオ通話">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </header>

      {/* 管理者用：位置情報パネル */}
      {isAdmin && showLocation && (
        <div className="shrink-0 px-4 py-3 border-b border-[#e5e5e5] bg-[#f8f8f8]">
          {contactLocation ? (
            <div>
              <p className="text-xs text-[#666] mb-1">相手の位置情報（{formatLastSeen(contactLocation.timestamp)}）</p>
              <a
                href={`https://www.google.com/maps?q=${contactLocation.lat},${contactLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#34d399] underline"
              >
                Google Mapsで開く ({contactLocation.lat.toFixed(4)}, {contactLocation.lng.toFixed(4)})
              </a>
            </div>
          ) : (
            <p className="text-xs text-[#555]">相手がチャットを開くと位置情報が送信されます</p>
          )}
        </div>
      )}

      {/* メッセージ一覧 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f2f2f2]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[#999] text-sm">メッセージはまだありません</p>
            <p className="text-[#bbb] text-xs mt-1">最初のメッセージを送ろう</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.username === myUsername;
          return (
            <div key={msg.msgId || i} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              {msg.type === "image" && msg.fileData && (
                <button onClick={() => setPreviewMedia({ type: "image", src: msg.fileData! })} className="max-w-[75%] rounded-2xl overflow-hidden mb-1">
                  <img src={msg.fileData} alt={msg.fileName || "画像"} className="max-w-full max-h-64 object-contain rounded-2xl" />
                </button>
              )}

              {msg.type === "video" && msg.fileData && (
                <button onClick={() => setPreviewMedia({ type: "video", src: msg.fileData! })} className="max-w-[75%] rounded-2xl overflow-hidden mb-1 relative">
                  <video src={msg.fileData} className="max-w-full max-h-64 rounded-2xl" playsInline muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </button>
              )}

              {(!msg.type || msg.type === "text") && (
                <div
                  onClick={() => isOwn && startEdit(msg)}
                  className={`max-w-[80%] px-3.5 py-2.5 text-[15px] leading-relaxed ${
                    isOwn
                      ? "bg-[#82D955] text-black rounded-2xl rounded-br-sm cursor-pointer active:opacity-80"
                      : "bg-white text-[#111] rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {msg.message}
                  {msg.edited && <span className="text-[10px] opacity-50 ml-1">（編集済み）</span>}
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-[#999]">
                  {new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {/* 管理者用：既読表示 */}
                {isAdmin && isOwn && i === lastOwnMsgIdx && lastReadAt && lastReadAt >= msg.timestamp && (
                  <span className="text-[10px] text-[#34d399]">既読</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* メディアプレビュー */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setPreviewMedia(null)}>
          <button onClick={() => setPreviewMedia(null)} className="absolute top-4 right-4 w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {previewMedia.type === "image" ? (
            <img src={previewMedia.src} alt="プレビュー" className="max-w-[95vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          ) : (
            <video src={previewMedia.src} controls autoPlay playsInline className="max-w-[95vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}

      {/* 編集モード */}
      {editingMsg && (
        <div className="shrink-0 px-3 py-2 border-t border-[#e5e5e5] bg-[#f8f8f8] flex items-center gap-2">
          <span className="text-xs text-[#888] shrink-0">編集中:</span>
          <form onSubmit={submitEdit} className="flex-1 flex gap-2">
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-[#ddd] rounded-lg text-[#111] text-sm outline-none focus:border-[#aaa] transition"
            />
            <button type="submit" className="px-3 py-2 bg-[#34d399] text-white text-xs font-bold rounded-lg">保存</button>
            <button type="button" onClick={() => setEditingMsg(null)} className="px-3 py-2 text-xs text-[#999]">取消</button>
          </form>
        </div>
      )}

      {/* 入力欄 */}
      <form onSubmit={sendMessage} className="shrink-0 flex items-end gap-2 p-3 border-t border-[#e5e5e5] bg-white">
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-11 h-11 bg-[#f0f0f0] border border-[#ddd] rounded-xl flex items-center justify-center text-[#888] hover:text-[#555] transition shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>
        <input
          ref={msgInputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onFocus={() => {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 400);
          }}
          placeholder="メッセージ..."
          className="flex-1 px-4 py-3 bg-[#f0f0f0] border border-[#ddd] rounded-xl text-[#111] text-[15px] placeholder-[#aaa] outline-none focus:border-[#bbb] transition"
        />
        <button type="submit" disabled={!newMessage.trim()} onMouseDown={(e) => e.preventDefault()} className="w-11 h-11 bg-[#34d399] rounded-xl text-white flex items-center justify-center disabled:opacity-30 transition shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
