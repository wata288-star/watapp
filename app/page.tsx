"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

interface Contact {
  userId: string;
  username: string;
  lastMessage?: string;
  lastTime?: number;
}

export default function Home() {
  const router = useRouter();
  const [myUsername, setMyUsername] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<{ found: boolean; userId?: string; username?: string } | null>(null);
  const [searchError, setSearchError] = useState("");
  const [showMyId, setShowMyId] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ userId: string; username: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [idTapCount, setIdTapCount] = useState(0);

  // 保存済みデータを復元
  useEffect(() => {
    const savedAdmin = localStorage.getItem("watapp-admin");
    if (savedAdmin === "true") setIsAdmin(true);
    const savedName = localStorage.getItem("watapp-username");
    const savedId = localStorage.getItem("watapp-userId");
    if (savedName && savedId) {
      setMyUsername(savedName);
      setMyUserId(savedId);
      setIsSetup(true);
    }
    const savedContacts = localStorage.getItem("watapp-contacts");
    if (savedContacts) {
      try { setContacts(JSON.parse(savedContacts)); } catch {}
    }
  }, []);

  // 連絡先を追加するヘルパー（重複チェック付き）
  const addContactToList = useCallback((newContact: Contact) => {
    setContacts((prev) => {
      if (prev.some((c) => c.userId === newContact.userId)) return prev;
      const updated = [newContact, ...prev];
      localStorage.setItem("watapp-contacts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // セットアップ済みならSocket接続してregister + 通知リッスン
  useEffect(() => {
    if (!isSetup || !myUserId) return;
    const socket = connectSocket();
    const doRegister = () => {
      socket.emit("register", { username: myUsername, userId: myUserId }, () => {});
    };
    socket.on("connect", doRegister);
    if (socket.connected) doRegister();

    // 相手が自分を追加したときの通知 → 自動で連絡先に追加
    const onContactAdded = ({ userId, username }: { userId: string; username: string }) => {
      addContactToList({ userId, username, lastMessage: `${username} があなたを追加しました`, lastTime: Date.now() });
    };
    socket.on("contact-added", onContactAdded);

    return () => {
      socket.off("connect", doRegister);
      socket.off("contact-added", onContactAdded);
    };
  }, [isSetup, myUserId, myUsername, addContactToList]);

  // 新規登録
  const register = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!myUsername.trim()) return;
    setIsRegistering(true);

    const socket = connectSocket();
    const doRegister = () => {
      socket.off("connect", doRegister); // 登録後はリスナー解除
      socket.emit(
        "register",
        { username: myUsername.trim(), userId: null },
        (res: { userId: string; username: string }) => {
          setMyUserId(res.userId);
          localStorage.setItem("watapp-username", res.username);
          localStorage.setItem("watapp-userId", res.userId);
          setIsSetup(true);
          setIsRegistering(false);
        }
      );
    };
    socket.on("connect", doRegister);
    if (socket.connected) doRegister();
  }, [myUsername]);

  // IDで検索
  const searchUser = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim().toUpperCase();
    if (!id) return;
    if (id === myUserId) {
      setSearchError("自分のIDは追加できません");
      setSearchResult(null);
      return;
    }
    setSearchError("");
    setSearchResult(null);

    const socket = getSocket();
    socket.emit("find-user", { userId: id }, (res: { found: boolean; userId?: string; username?: string }) => {
      if (res.found) {
        setSearchResult(res);
      } else {
        setSearchError("このIDのユーザーは見つかりません");
      }
    });
  }, [searchId, myUserId]);

  // 連絡先に追加 → サーバー経由で相手にも通知
  const addContact = useCallback(() => {
    if (!searchResult?.found || !searchResult.userId || !searchResult.username) return;
    if (contacts.some((c) => c.userId === searchResult.userId)) {
      setSearchError("すでに連絡先に追加済みです");
      return;
    }
    const newContact: Contact = {
      userId: searchResult.userId,
      username: searchResult.username,
    };

    // 自分の連絡先に追加
    addContactToList(newContact);

    // サーバー経由で相手に通知（相手側にも自動で連絡先追加される）
    const socket = getSocket();
    socket.emit("add-contact", { targetUserId: searchResult.userId }, () => {});

    setSearchId("");
    setSearchResult(null);
    setShowAdd(false);
  }, [searchResult, contacts, addContactToList]);

  const openChat = (contact: Contact) => {
    const adminParam = isAdmin ? "&admin=1" : "";
    router.push(`/chat/${encodeURIComponent(contact.userId)}?name=${encodeURIComponent(contact.username)}${adminParam}`);
  };

  // トーク履歴を削除
  const deleteChatHistory = useCallback((contact: Contact) => {
    const roomId = [myUserId, contact.userId].sort().join("--");
    localStorage.removeItem(`watapp-chat-${roomId}`);
    // lastMessageもクリア
    setContacts((prev) => {
      const updated = prev.map((c) =>
        c.userId === contact.userId ? { ...c, lastMessage: undefined, lastTime: undefined } : c
      );
      localStorage.setItem("watapp-contacts", JSON.stringify(updated));
      return updated;
    });
    setContextMenu(null);
  }, [myUserId]);

  // フレンドを削除
  const deleteContact = useCallback((userId: string) => {
    setContacts((prev) => {
      const updated = prev.filter((c) => c.userId !== userId);
      localStorage.setItem("watapp-contacts", JSON.stringify(updated));
      return updated;
    });
    // チャット履歴も一緒に消す
    const roomId = [myUserId, userId].sort().join("--");
    localStorage.removeItem(`watapp-chat-${roomId}`);
    setContextMenu(null);
  }, [myUserId]);

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  // ユーザー名設定画面（初回のみ）
  if (!isSetup) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-[32px] font-extrabold tracking-tight text-white">Watapp</h1>
            <p className="text-[#666] text-sm mt-1">通話・チャット</p>
          </div>
          <form onSubmit={register}>
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
              disabled={!myUsername.trim() || isRegistering}
              className="w-full py-4 bg-white text-black font-bold text-base rounded-[14px] hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              {isRegistering ? "登録中..." : "はじめる"}
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
          {/* マイID表示ボタン */}
          <button
            onClick={() => setShowMyId(!showMyId)}
            className="h-9 px-3 bg-[#1a1a1a] rounded-full flex items-center justify-center text-xs text-[#888] hover:bg-[#222] transition gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
            ID
          </button>
          {/* 連絡先追加ボタン */}
          <button
            onClick={() => { setShowAdd(!showAdd); setSearchResult(null); setSearchError(""); setSearchId(""); }}
            className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white hover:bg-[#222] transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </button>
          {/* 設定ボタン */}
          <button
            onClick={() => {
              if (confirm("ログアウトしますか？")) {
                disconnectSocket();
                localStorage.removeItem("watapp-username");
                localStorage.removeItem("watapp-userId");
                localStorage.removeItem("watapp-contacts");
                localStorage.removeItem("watapp-admin");
                setIsSetup(false);
                setMyUsername("");
                setMyUserId("");
                setContacts([]);
                setIsAdmin(false);
                setShowMyId(false);
                setShowAdminInput(false);
                setIdTapCount(0);
              }
            }}
            className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#666] hover:bg-[#222] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* マイID表示 */}
      {showMyId && (
        <div className="px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]">
          <p className="text-xs text-[#666] mb-2">あなたのID（相手に教えてね）</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = idTapCount + 1;
                setIdTapCount(next);
                if (next >= 5) setShowAdminInput(true);
              }}
              className="flex-1 px-4 py-3 bg-[#141414] border border-[#222] rounded-xl text-left"
            >
              <span className="text-[22px] font-mono font-bold text-white tracking-[6px]">{myUserId}</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(myUserId);
              }}
              className="px-4 py-3 bg-[#1a1a1a] border border-[#222] rounded-xl text-sm text-[#888] hover:bg-[#222] transition"
            >
              コピー
            </button>
          </div>
          {/* 管理者モード：IDを5回タップで入力欄表示、1919で解除 */}
          {isAdmin && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-[#34d399]" />
              <span className="text-xs text-[#444]">管理者モード</span>
              <button
                onClick={() => { setIsAdmin(false); localStorage.removeItem("watapp-admin"); }}
                className="text-xs text-[#333] ml-auto hover:text-[#666] transition"
              >
                解除
              </button>
            </div>
          )}
          {showAdminInput && !isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (adminCode === "1919") {
                  setIsAdmin(true);
                  localStorage.setItem("watapp-admin", "true");
                  setShowAdminInput(false);
                  setAdminCode("");
                  setIdTapCount(0);
                } else {
                  setAdminCode("");
                }
              }}
              className="flex items-center gap-2 mt-3"
            >
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="コード"
                maxLength={4}
                className="w-24 px-3 py-2 bg-[#141414] border border-[#222] rounded-lg text-white text-sm font-mono tracking-[2px] placeholder-[#333] outline-none focus:border-[#444] transition text-center"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#1a1a1a] border border-[#222] rounded-lg text-xs text-[#555] hover:bg-[#222] transition"
              >
                OK
              </button>
            </form>
          )}
        </div>
      )}

      {/* 連絡先追加フォーム（ID検索） */}
      {showAdd && (
        <div className="px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]">
          <p className="text-xs text-[#666] mb-2">相手のIDで検索</p>
          <form onSubmit={searchUser} className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => { setSearchId(e.target.value.toUpperCase()); setSearchError(""); setSearchResult(null); }}
              placeholder="IDを入力（6桁）"
              maxLength={6}
              className="flex-1 px-4 py-3 bg-[#141414] border border-[#222] rounded-xl text-white text-base font-mono tracking-[3px] placeholder-[#444] outline-none focus:border-[#444] transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={searchId.trim().length < 2}
              className="px-5 py-3 bg-white text-black font-bold text-sm rounded-xl hover:opacity-85 disabled:opacity-30 transition"
            >
              検索
            </button>
          </form>

          {/* 検索エラー */}
          {searchError && (
            <p className="text-xs text-[#ef4444] mt-2">{searchError}</p>
          )}

          {/* 検索結果 */}
          {searchResult?.found && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-[#141414] border border-[#222] rounded-xl">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-[#555]">
                  {searchResult.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-white">{searchResult.username}</p>
                <p className="text-[11px] text-[#555] font-mono">ID: {searchResult.userId}</p>
              </div>
              <button
                onClick={addContact}
                className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg hover:opacity-85 transition"
              >
                追加
              </button>
            </div>
          )}
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
            <p className="text-[#333] text-xs mt-1">IDボタンで自分のIDを確認 →</p>
            <p className="text-[#333] text-xs">相手にIDを教えて追加してもらおう</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.userId} className="relative border-b border-[#111]">
              <button
                onClick={() => openChat(contact)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ userId: contact.userId, username: contact.username }); }}
                className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-[#111] active:bg-[#151515] transition text-left"
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
              {/* メニューボタン（3点） */}
              <button
                onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu?.userId === contact.userId ? null : { userId: contact.userId, username: contact.username }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#444] hover:text-[#888] transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* コンテキストメニュー（オーバーレイ） */}
      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-2xl p-2 pb-8 animate-[slideUp_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-4 mt-1" />
            <p className="text-center text-sm text-[#888] mb-3">{contextMenu.username}</p>
            <button
              onClick={() => {
                const contact = contacts.find((c) => c.userId === contextMenu.userId);
                if (contact) deleteChatHistory(contact);
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-white hover:bg-[#222] rounded-xl transition"
            >
              <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              トーク履歴を削除
            </button>
            <button
              onClick={() => {
                if (confirm(`${contextMenu.username} を連絡先から削除しますか？`)) {
                  deleteContact(contextMenu.userId);
                }
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] text-[#ef4444] hover:bg-[#222] rounded-xl transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              フレンドを削除
            </button>
            <button
              onClick={() => setContextMenu(null)}
              className="w-full flex items-center justify-center py-3.5 text-[15px] text-[#888] hover:bg-[#222] rounded-xl transition mt-1"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
