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
  const [editingId, setEditingId] = useState(false);
  const [newIdInput, setNewIdInput] = useState("");
  const [idError, setIdError] = useState("");
  const [loginMode, setLoginMode] = useState<"new" | "id">("new");
  const [loginId, setLoginId] = useState("");
  const [loginError, setLoginError] = useState("");
  const [toast, setToast] = useState<{ username: string; message: string; userId: string } | null>(null);

  const ADMIN_IDS = ["WATARU"];

  // トースト表示（3秒で自動消去）
  const showToast = useCallback((username: string, message: string, userId: string) => {
    setToast({ username, message, userId });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const savedAdmin = localStorage.getItem("watapp-admin");
    if (savedAdmin === "true") setIsAdmin(true);
    const savedName = localStorage.getItem("watapp-username");
    const savedId = localStorage.getItem("watapp-userId");
    const loggedOut = localStorage.getItem("watapp-loggedOut");
    if (savedName && savedId && loggedOut !== "true") {
      setMyUsername(savedName);
      setMyUserId(savedId);
      setIsSetup(true);
      if (ADMIN_IDS.includes(savedId)) {
        setIsAdmin(true);
        localStorage.setItem("watapp-admin", "true");
      }
    } else if (savedName) {
      setMyUsername(savedName);
    }
    const savedContacts = localStorage.getItem("watapp-contacts");
    if (savedContacts) {
      try { setContacts(JSON.parse(savedContacts)); } catch {}
    }
  }, []);

  const addContactToList = useCallback((newContact: Contact) => {
    setContacts((prev) => {
      if (prev.some((c) => c.userId === newContact.userId)) return prev;
      const updated = [newContact, ...prev];
      localStorage.setItem("watapp-contacts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!isSetup || !myUserId) return;
    const socket = connectSocket();
    const doRegister = () => {
      socket.emit("register", { username: myUsername, userId: myUserId }, () => {
        // 全連絡先のルームに参加（メッセージ受信を監視）
        const saved = localStorage.getItem("watapp-contacts");
        if (saved) {
          try {
            const contactList = JSON.parse(saved) as Contact[];
            contactList.forEach((c) => {
              const roomId = [myUserId, c.userId].sort().join("--");
              socket.emit("join-room", { roomId, username: myUsername });
            });
          } catch {}
        }
      });
    };
    socket.on("connect", doRegister);
    if (socket.connected) doRegister();

    const onContactAdded = ({ userId, username }: { userId: string; username: string }) => {
      addContactToList({ userId, username, lastMessage: `${username} があなたを追加しました`, lastTime: Date.now() });
      showToast(username, "あなたを追加しました", userId);
      // 新しい連絡先のルームにも参加
      const roomId = [myUserId, userId].sort().join("--");
      socket.emit("join-room", { roomId, username: myUsername });
    };
    socket.on("contact-added", onContactAdded);

    // トーク一覧画面でメッセージを受信 → トースト＋連絡先リスト更新
    const onChatMessage = (msg: { username: string; message: string; timestamp: number; socketId: string; type?: string }) => {
      // 自分のメッセージは無視
      if (msg.username === myUsername) return;

      // 連絡先リストの最終メッセージを更新
      const label = msg.type === "image" ? "写真" : msg.type === "video" ? "動画" : msg.message;
      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.username === msg.username);
        if (idx < 0) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMessage: label, lastTime: msg.timestamp };
        // 最新メッセージの連絡先を一番上に
        const [contact] = updated.splice(idx, 1);
        updated.unshift(contact);
        localStorage.setItem("watapp-contacts", JSON.stringify(updated));
        return updated;
      });

      // トースト通知
      showToast(msg.username, label, "");
    };
    socket.on("chat-message", onChatMessage);

    return () => {
      socket.off("connect", doRegister);
      socket.off("contact-added", onContactAdded);
      socket.off("chat-message", onChatMessage);
    };
  }, [isSetup, myUserId, myUsername, addContactToList, showToast]);

  const register = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!myUsername.trim()) return;
    setIsRegistering(true);
    const existingId = localStorage.getItem("watapp-userId");
    const socket = connectSocket();
    const doRegister = () => {
      socket.off("connect", doRegister);
      socket.emit("register", { username: myUsername.trim(), userId: existingId || null }, (res: { userId: string; username: string }) => {
        setMyUserId(res.userId);
        localStorage.setItem("watapp-username", res.username);
        localStorage.setItem("watapp-userId", res.userId);
        localStorage.removeItem("watapp-loggedOut");
        if (ADMIN_IDS.includes(res.userId)) { setIsAdmin(true); localStorage.setItem("watapp-admin", "true"); }
        setIsSetup(true);
        setIsRegistering(false);
      });
    };
    socket.on("connect", doRegister);
    if (socket.connected) doRegister();
  }, [myUsername]);

  const searchUser = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim().toUpperCase();
    if (!id) return;
    if (id === myUserId) { setSearchError("自分のIDは追加できません"); setSearchResult(null); return; }
    setSearchError(""); setSearchResult(null);
    const socket = getSocket();
    socket.emit("find-user", { userId: id }, (res: { found: boolean; userId?: string; username?: string }) => {
      if (res.found) setSearchResult(res);
      else setSearchError("このIDのユーザーは見つかりません");
    });
  }, [searchId, myUserId]);

  const addContact = useCallback(() => {
    if (!searchResult?.found || !searchResult.userId || !searchResult.username) return;
    if (contacts.some((c) => c.userId === searchResult.userId)) { setSearchError("すでに連絡先に追加済みです"); return; }
    addContactToList({ userId: searchResult.userId, username: searchResult.username });
    const socket = getSocket();
    socket.emit("add-contact", { targetUserId: searchResult.userId }, () => {});
    setSearchId(""); setSearchResult(null); setShowAdd(false);
  }, [searchResult, contacts, addContactToList]);

  const loginWithId = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const id = loginId.trim().toUpperCase();
    if (!id) return;
    setLoginError(""); setIsRegistering(true);
    const socket = connectSocket();
    const doLogin = () => {
      socket.off("connect", doLogin);
      socket.emit("find-user", { userId: id }, (res: { found: boolean; userId?: string; username?: string }) => {
        if (res.found && res.userId && res.username) {
          socket.emit("register", { username: res.username, userId: res.userId }, (regRes: { userId: string; username: string }) => {
            setMyUserId(regRes.userId); setMyUsername(regRes.username);
            localStorage.setItem("watapp-username", regRes.username);
            localStorage.setItem("watapp-userId", regRes.userId);
            localStorage.removeItem("watapp-loggedOut");
            if (ADMIN_IDS.includes(regRes.userId)) { setIsAdmin(true); localStorage.setItem("watapp-admin", "true"); }
            setIsSetup(true); setIsRegistering(false);
          });
        } else { setLoginError("このIDのアカウントは見つかりません"); setIsRegistering(false); }
      });
    };
    socket.on("connect", doLogin);
    if (socket.connected) doLogin();
  }, [loginId]);

  const changeId = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const id = newIdInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (id.length < 3 || id.length > 8) { setIdError("IDは3〜8文字の英数字で入力してね"); return; }
    setIdError("");
    const socket = getSocket();
    socket.emit("change-id", { oldId: myUserId, newId: id }, (res: { success: boolean; newId?: string; error?: string }) => {
      if (res.success && res.newId) {
        setMyUserId(res.newId); localStorage.setItem("watapp-userId", res.newId);
        if (ADMIN_IDS.includes(res.newId)) { setIsAdmin(true); localStorage.setItem("watapp-admin", "true"); }
        setEditingId(false); setNewIdInput(""); setIdError("");
      } else { setIdError(res.error || "変更できませんでした"); }
    });
  }, [newIdInput, myUserId]);

  const openChat = (contact: Contact) => {
    const adminParam = isAdmin ? "&admin=1" : "";
    router.push(`/chat/${encodeURIComponent(contact.userId)}?name=${encodeURIComponent(contact.username)}${adminParam}`);
  };

  const deleteChatHistory = useCallback((contact: Contact) => {
    const roomId = [myUserId, contact.userId].sort().join("--");
    localStorage.removeItem(`watapp-chat-${roomId}`);
    setContacts((prev) => {
      const updated = prev.map((c) => c.userId === contact.userId ? { ...c, lastMessage: undefined, lastTime: undefined } : c);
      localStorage.setItem("watapp-contacts", JSON.stringify(updated));
      return updated;
    });
    setContextMenu(null);
  }, [myUserId]);

  const deleteContact = useCallback((userId: string) => {
    setContacts((prev) => {
      const updated = prev.filter((c) => c.userId !== userId);
      localStorage.setItem("watapp-contacts", JSON.stringify(updated));
      return updated;
    });
    const roomId = [myUserId, userId].sort().join("--");
    localStorage.removeItem(`watapp-chat-${roomId}`);
    setContextMenu(null);
  }, [myUserId]);

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  // ===== ログイン画面 =====
  if (!isSetup) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-white h-dvh">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#34d399] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#333]">Watapp</h1>
            <p className="text-[#999] text-sm mt-1">プライベートメッセンジャー</p>
          </div>

          <div className="flex mb-6 bg-[#f5f5f5] rounded-xl p-1">
            <button onClick={() => { setLoginMode("new"); setLoginError(""); }} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${loginMode === "new" ? "bg-white text-[#333] shadow-sm" : "text-[#999]"}`}>新規登録</button>
            <button onClick={() => { setLoginMode("id"); setLoginError(""); }} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${loginMode === "id" ? "bg-white text-[#333] shadow-sm" : "text-[#999]"}`}>IDでログイン</button>
          </div>

          {loginMode === "new" ? (
            <form onSubmit={register}>
              <div className="mb-6">
                <label className="block text-xs text-[#999] mb-1.5">ニックネーム</label>
                <input type="text" value={myUsername} onChange={(e) => setMyUsername(e.target.value)} placeholder="名前を入力" className="w-full px-4 py-3.5 bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl text-[#333] text-[15px] placeholder-[#ccc] outline-none focus:border-[#34d399] transition" required autoFocus />
              </div>
              <button type="submit" disabled={!myUsername.trim() || isRegistering} className="w-full py-4 bg-[#34d399] text-white font-bold text-base rounded-xl hover:bg-[#2bc48a] disabled:opacity-30 transition">{isRegistering ? "登録中..." : "はじめる"}</button>
            </form>
          ) : (
            <form onSubmit={loginWithId}>
              <div className="mb-6">
                <label className="block text-xs text-[#999] mb-1.5">ユーザーID</label>
                <input type="text" value={loginId} onChange={(e) => { setLoginId(e.target.value.toUpperCase()); setLoginError(""); }} placeholder="IDを入力" maxLength={8} className="w-full px-4 py-3.5 bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl text-[#333] text-[17px] font-mono tracking-[4px] placeholder-[#ccc] outline-none focus:border-[#34d399] transition" required autoFocus />
                {loginError && <p className="text-xs text-[#ef4444] mt-2">{loginError}</p>}
              </div>
              <button type="submit" disabled={!loginId.trim() || isRegistering} className="w-full py-4 bg-[#34d399] text-white font-bold text-base rounded-xl hover:bg-[#2bc48a] disabled:opacity-30 transition">{isRegistering ? "ログイン中..." : "ログイン"}</button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // ===== メイン画面（トーク一覧） =====
  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* ヘッダー */}
      <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5] bg-white">
        <h1 className="text-lg font-bold text-[#333]">トーク</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMyId(!showMyId)} className="h-8 px-2.5 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[11px] text-[#999] hover:bg-[#eee] transition gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
            ID
          </button>
          <button onClick={() => { setShowAdd(!showAdd); setSearchResult(null); setSearchError(""); setSearchId(""); }} className="w-8 h-8 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[#999] hover:bg-[#eee] transition">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
          </button>
          <button onClick={() => { if (confirm("ログアウトしますか？")) { disconnectSocket(); localStorage.removeItem("watapp-admin"); localStorage.setItem("watapp-loggedOut", "true"); setIsSetup(false); setIsAdmin(false); } }} className="w-8 h-8 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[#999] hover:bg-[#eee] transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
          </button>
        </div>
      </header>

      {/* マイID */}
      {showMyId && (
        <div className="shrink-0 px-5 py-3 border-b border-[#e5e5e5] bg-[#fafafa]">
          <p className="text-[11px] text-[#bbb] mb-2">あなたのID</p>
          <div className="flex items-center gap-2">
            <button onClick={() => { const n = idTapCount + 1; setIdTapCount(n); if (n >= 5) setShowAdminInput(true); }} className="flex-1 px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-left">
              <span className="text-lg font-mono font-bold text-[#333] tracking-[4px]">{myUserId}</span>
            </button>
            <button onClick={() => navigator.clipboard?.writeText(myUserId)} className="px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-xs text-[#999]">コピー</button>
            <button onClick={() => { setEditingId(!editingId); setNewIdInput(""); setIdError(""); }} className="px-2.5 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#999]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
            </button>
          </div>
          {editingId && (
            <form onSubmit={changeId} className="mt-2">
              <div className="flex items-center gap-2">
                <input type="text" value={newIdInput} onChange={(e) => { setNewIdInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setIdError(""); }} placeholder="新しいID" maxLength={8} className="flex-1 px-3 py-2 bg-white border border-[#e5e5e5] rounded-lg text-[#333] text-sm font-mono tracking-[2px] placeholder-[#ccc] outline-none focus:border-[#34d399] transition" autoFocus />
                <button type="submit" disabled={newIdInput.length < 3} className="px-3 py-2 bg-[#34d399] text-white text-xs font-bold rounded-lg disabled:opacity-30">変更</button>
              </div>
              {idError && <p className="text-xs text-[#ef4444] mt-1">{idError}</p>}
            </form>
          )}
          {isAdmin && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span className="text-[11px] text-[#bbb]">管理者</span>
              <button onClick={() => { setIsAdmin(false); localStorage.removeItem("watapp-admin"); }} className="text-[11px] text-[#ddd] ml-auto">解除</button>
            </div>
          )}
          {showAdminInput && !isAdmin && (
            <form onSubmit={(e) => { e.preventDefault(); if (adminCode === "1919") { setIsAdmin(true); localStorage.setItem("watapp-admin", "true"); setShowAdminInput(false); setAdminCode(""); setIdTapCount(0); } else { setAdminCode(""); } }} className="flex items-center gap-2 mt-2">
              <input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="コード" maxLength={4} className="w-20 px-2 py-1.5 bg-white border border-[#e5e5e5] rounded-lg text-[#333] text-sm font-mono tracking-[2px] placeholder-[#ccc] outline-none text-center" autoFocus />
              <button type="submit" className="px-2 py-1.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg text-xs text-[#999]">OK</button>
            </form>
          )}
        </div>
      )}

      {/* ID検索 */}
      {showAdd && (
        <div className="shrink-0 px-5 py-3 border-b border-[#e5e5e5] bg-[#fafafa]">
          <form onSubmit={searchUser} className="flex gap-2">
            <input type="text" value={searchId} onChange={(e) => { setSearchId(e.target.value.toUpperCase()); setSearchError(""); setSearchResult(null); }} placeholder="相手のID" maxLength={8} className="flex-1 px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#333] text-sm font-mono tracking-[2px] placeholder-[#ccc] outline-none focus:border-[#34d399] transition" autoFocus />
            <button type="submit" disabled={searchId.trim().length < 2} className="px-4 py-2.5 bg-[#34d399] text-white font-bold text-xs rounded-lg disabled:opacity-30">検索</button>
          </form>
          {searchError && <p className="text-xs text-[#ef4444] mt-1.5">{searchError}</p>}
          {searchResult?.found && (
            <div className="mt-2 flex items-center gap-3 p-2.5 bg-white border border-[#e5e5e5] rounded-lg">
              <div className="w-9 h-9 bg-[#f0f0f0] rounded-full flex items-center justify-center shrink-0"><span className="text-sm font-bold text-[#aaa]">{searchResult.username?.charAt(0).toUpperCase()}</span></div>
              <div className="flex-1"><p className="text-sm font-medium text-[#333]">{searchResult.username}</p><p className="text-[10px] text-[#bbb] font-mono">ID: {searchResult.userId}</p></div>
              <button onClick={addContact} className="px-3 py-1.5 bg-[#34d399] text-white font-bold text-xs rounded-lg">追加</button>
            </div>
          )}
        </div>
      )}

      {/* 連絡先リスト */}
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="w-12 h-12 text-[#e0e0e0] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
            <p className="text-[#ccc] text-sm">トークはありません</p>
            <p className="text-[#ddd] text-xs mt-1">右上の＋ボタンで友達を追加しよう</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.userId} className="relative border-b border-[#f5f5f5]">
              <button onClick={() => openChat(contact)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ userId: contact.userId, username: contact.username }); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] active:bg-[#f5f5f5] transition text-left">
                <div className="w-11 h-11 bg-[#f0f0f0] rounded-full flex items-center justify-center shrink-0"><span className="text-base font-bold text-[#bbb]">{contact.username.charAt(0).toUpperCase()}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><span className="text-[14px] font-medium text-[#333]">{contact.username}</span>{contact.lastTime && <span className="text-[11px] text-[#ccc]">{formatTime(contact.lastTime)}</span>}</div>
                  <p className="text-[13px] text-[#aaa] truncate mt-0.5">{contact.lastMessage || "チャットを始めよう"}</p>
                </div>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu?.userId === contact.userId ? null : { userId: contact.userId, username: contact.username }); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#ccc]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* トースト通知 */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-[slideDown_0.3s_ease-out]">
          <div
            onClick={() => {
              setToast(null);
              // 該当する連絡先のチャットを開く
              const contact = contacts.find((c) => c.username === toast.username);
              if (contact) openChat(contact);
            }}
            className="bg-white rounded-2xl shadow-lg border border-[#e5e5e5] px-4 py-3 flex items-center gap-3 cursor-pointer active:bg-[#f8f8f8] transition"
          >
            <div className="w-10 h-10 bg-[#e8f4fd] rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[#5bb8f5]">{toast.username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#333]">{toast.username}</p>
              <p className="text-[12px] text-[#999] truncate">{toast.message}</p>
            </div>
            <span className="text-[10px] text-[#ccc] shrink-0">今</span>
          </div>
        </div>
      )}

      {/* コンテキストメニュー */}
      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-2 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#e0e0e0] rounded-full mx-auto mb-4 mt-1" />
            <p className="text-center text-sm text-[#999] mb-3">{contextMenu.username}</p>
            <button onClick={() => { const c = contacts.find((c) => c.userId === contextMenu.userId); if (c) deleteChatHistory(c); }} className="w-full flex items-center gap-3 px-5 py-3.5 text-[14px] text-[#333] hover:bg-[#f8f8f8] rounded-xl transition">
              <svg className="w-5 h-5 text-[#bbb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              トーク履歴を削除
            </button>
            <button onClick={() => { if (confirm(`${contextMenu.username} を削除しますか？`)) deleteContact(contextMenu.userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 text-[14px] text-[#ef4444] hover:bg-[#f8f8f8] rounded-xl transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
              フレンドを削除
            </button>
            <button onClick={() => setContextMenu(null)} className="w-full py-3.5 text-[14px] text-[#999] hover:bg-[#f8f8f8] rounded-xl transition mt-1">キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}
