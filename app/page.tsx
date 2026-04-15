"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Contact {
  username: string;
  lastMessage?: string;
  lastTime?: number;
}

export default function Home() {
  const router = useRouter();
  const [myUsername, setMyUsername] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("watapp-username");
    if (saved) {
      setMyUsername(saved);
      setIsSetup(true);
    }
    const savedContacts = localStorage.getItem("watapp-contacts");
    if (savedContacts) {
      try {
        setContacts(JSON.parse(savedContacts));
      } catch {}
    }
  }, []);

  const saveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUsername.trim()) return;
    localStorage.setItem("watapp-username", myUsername.trim());
    setIsSetup(true);
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newContact.trim();
    if (!name || name === myUsername) return;
    if (contacts.some((c) => c.username === name)) return;
    const updated = [{ username: name }, ...contacts];
    setContacts(updated);
    localStorage.setItem("watapp-contacts", JSON.stringify(updated));
    setNewContact("");
    setShowAdd(false);
  };

  const openChat = (contactName: string) => {
    router.push(`/chat/${encodeURIComponent(contactName)}`);
  };

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  // ユーザー名設定画面
  if (!isSetup) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-[32px] font-extrabold tracking-tight text-white">WatApp</h1>
            <p className="text-[#666] text-sm mt-1">通話・チャット</p>
          </div>
          <form onSubmit={saveUsername}>
            <div className="mb-6">
              <label className="block text-xs text-[#888] mb-1.5">あなたの名前</label>
              <input
                type="text"
                value={myUsername}
                onChange={(e) => setMyUsername(e.target.value)}
                placeholder="名前を入力"
                className="w-full px-4 py-3.5 bg-[#141414] border border-[#222] rounded-xl text-white text-[15px] placeholder-[#444] outline-none focus:border-[#444] transition"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!myUsername.trim()}
              className="w-full py-4 bg-white text-black font-bold text-base rounded-[14px] hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              はじめる
            </button>
          </form>
        </div>
      </main>
    );
  }

  // メインのチャット一覧画面
  return (
    <div className="flex-1 flex flex-col h-dvh bg-[#0a0a0a]">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
        <div>
          <h1 className="text-xl font-bold text-white">チャット</h1>
          <p className="text-[11px] text-[#555] mt-0.5">{myUsername}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white hover:bg-[#222] transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("watapp-username");
              setIsSetup(false);
              setMyUsername("");
            }}
            className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#666] hover:bg-[#222] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* 連絡先追加フォーム */}
      {showAdd && (
        <div className="px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d]">
          <form onSubmit={addContact} className="flex gap-2">
            <input
              type="text"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="相手の名前を入力"
              className="flex-1 px-4 py-3 bg-[#141414] border border-[#222] rounded-xl text-white text-sm placeholder-[#444] outline-none focus:border-[#444] transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newContact.trim()}
              className="px-5 py-3 bg-white text-black font-bold text-sm rounded-xl hover:opacity-85 disabled:opacity-30 transition"
            >
              追加
            </button>
          </form>
        </div>
      )}

      {/* 連絡先リスト */}
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-[#555] text-sm">まだ連絡先がありません</p>
            <p className="text-[#333] text-xs mt-1">右上の＋ボタンから追加しよう</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <button
              key={contact.username}
              onClick={() => openChat(contact.username)}
              className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-[#111] active:bg-[#151515] transition text-left border-b border-[#111]"
            >
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-[#555]">
                  {contact.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-white">{contact.username}</span>
                  {contact.lastTime && (
                    <span className="text-[11px] text-[#444]">{formatTime(contact.lastTime)}</span>
                  )}
                </div>
                <p className="text-sm text-[#555] truncate mt-0.5">
                  {contact.lastMessage || "チャットを始めよう"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
