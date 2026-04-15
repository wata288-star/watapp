"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

interface ChatMessage {
  username: string;
  message: string;
  timestamp: number;
  socketId: string;
}

function getChatRoomId(a: string, b: string): string {
  return [a, b].sort().join("--");
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const contactName = decodeURIComponent(params.name as string);
  const [myUsername, setMyUsername] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketIdRef = useRef("");
  const roomIdRef = useRef("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // チャット履歴をlocalStorageから復元
  const loadMessages = useCallback((roomId: string) => {
    try {
      const saved = localStorage.getItem(`watapp-chat-${roomId}`);
      if (saved) return JSON.parse(saved) as ChatMessage[];
    } catch {}
    return [];
  }, []);

  const saveMessages = useCallback((roomId: string, msgs: ChatMessage[]) => {
    // 最新100件のみ保存
    const toSave = msgs.slice(-100);
    localStorage.setItem(`watapp-chat-${roomId}`, JSON.stringify(toSave));
  }, []);

  // 連絡先のlastMessageを更新
  const updateContactLastMessage = useCallback((msg: string, time: number) => {
    try {
      const saved = localStorage.getItem("watapp-contacts");
      if (!saved) return;
      const contacts = JSON.parse(saved);
      const idx = contacts.findIndex((c: { username: string }) => c.username === contactName);
      if (idx >= 0) {
        contacts[idx].lastMessage = msg;
        contacts[idx].lastTime = time;
        // 最新のチャットを先頭に移動
        const [contact] = contacts.splice(idx, 1);
        contacts.unshift(contact);
        localStorage.setItem("watapp-contacts", JSON.stringify(contacts));
      }
    } catch {}
  }, [contactName]);

  useEffect(() => {
    const saved = localStorage.getItem("watapp-username");
    if (!saved) {
      router.push("/");
      return;
    }
    setMyUsername(saved);

    const roomId = getChatRoomId(saved, contactName);
    roomIdRef.current = roomId;

    // 保存済みメッセージ復元
    const savedMsgs = loadMessages(roomId);
    setMessages(savedMsgs);

    const socket = connectSocket();
    socketIdRef.current = socket.id || "";

    socket.on("connect", () => {
      socketIdRef.current = socket.id || "";
      socket.emit("join-room", { roomId, username: saved });
    });

    socket.on("room-users", (users: { socketId: string; username: string }[]) => {
      setIsOnline(users.some((u) => u.username === contactName));
    });

    socket.on("user-joined", ({ username: joinedName }: { username: string }) => {
      if (joinedName === contactName) setIsOnline(true);
    });

    socket.on("user-left", ({ username: leftName }: { username: string }) => {
      if (leftName === contactName) setIsOnline(false);
    });

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, msg];
        saveMessages(roomId, updated);
        return updated;
      });
      updateContactLastMessage(msg.message, msg.timestamp);
    });

    if (socket.connected) {
      socketIdRef.current = socket.id || "";
      socket.emit("join-room", { roomId, username: saved });
    }

    return () => {
      disconnectSocket();
    };
  }, [contactName, router, loadMessages, saveMessages, updateContactLastMessage]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    getSocket().emit("chat-message", {
      roomId: roomIdRef.current,
      message: newMessage.trim(),
    });
    setNewMessage("");
  };

  const startCall = (withVideo: boolean) => {
    const roomId = roomIdRef.current;
    router.push(`/room/${encodeURIComponent(roomId)}?username=${encodeURIComponent(myUsername)}&video=${withVideo}`);
  };

  return (
    <div className="flex-1 flex flex-col h-dvh bg-[#0a0a0a]">
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
        <button
          onClick={() => router.push("/")}
          className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center shrink-0">
          <span className="text-base font-bold text-[#555]">
            {contactName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-white truncate">{contactName}</div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[#34d399]" : "bg-[#333]"}`} />
            <span className="text-[11px] text-[#555]">{isOnline ? "オンライン" : "オフライン"}</span>
          </div>
        </div>

        {/* 通話ボタン */}
        <button
          onClick={() => startCall(false)}
          className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-white transition"
          title="音声通話"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </button>
        <button
          onClick={() => startCall(true)}
          className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-white transition"
          title="ビデオ通話"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </header>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[#333] text-sm">メッセージはまだありません</p>
            <p className="text-[#222] text-xs mt-1">最初のメッセージを送ろう</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.username === myUsername;
          return (
            <div key={i} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 text-[15px] leading-relaxed ${
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

      {/* 入力欄 */}
      <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-[#1a1a1a]">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージ..."
          className="flex-1 px-4 py-3 bg-[#141414] border border-[#222] rounded-xl text-white text-[15px] placeholder-[#444] outline-none focus:border-[#444] transition"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="w-11 h-11 bg-white rounded-xl text-black flex items-center justify-center disabled:opacity-30 transition shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
