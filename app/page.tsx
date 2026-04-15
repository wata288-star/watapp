"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const generateRoomId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    setRoomId(id);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) return;
    router.push(`/room/${roomId.trim()}?username=${encodeURIComponent(username.trim())}`);
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-[32px] font-extrabold tracking-tight text-white">WatApp</h1>
          <p className="text-[#666] text-sm mt-1">通話・チャット</p>
        </div>

        <form onSubmit={joinRoom}>
          <div className="mb-4">
            <label className="block text-xs text-[#888] mb-1.5">名前</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="名前を入力"
              className="w-full px-4 py-3.5 bg-[#141414] border border-[#222] rounded-xl text-white text-[15px] placeholder-[#444] outline-none focus:border-[#444] transition"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-[#888] mb-1.5">ルームID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="ID"
                className="flex-1 px-4 py-3.5 bg-[#141414] border border-[#222] rounded-xl text-white text-[15px] placeholder-[#444] outline-none focus:border-[#444] transition font-mono tracking-[3px]"
                required
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="px-4 py-3.5 bg-[#141414] border border-[#222] rounded-xl text-[#888] text-xs hover:bg-[#1a1a1a] transition whitespace-nowrap"
              >
                生成
              </button>
            </div>
            <p className="text-[11px] text-[#444] mt-1.5">同じIDで相手と繋がれます</p>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !roomId.trim()}
            className="w-full py-4 bg-white text-black font-bold text-base rounded-[14px] hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            参加する
          </button>
        </form>
      </div>
    </main>
  );
}
