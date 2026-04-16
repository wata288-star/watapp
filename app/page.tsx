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

// ダミー記事データ（コラムアプリの偽装用）
const ARTICLES = [
  { id: 1, title: "朝5分の習慣が人生を変える｜今日から始める朝活のすすめ", author: "暮らしの知恵袋", likes: 342, date: "3時間前", img: "/art-1.jpg", cat: "ライフスタイル", avatar: "#f5a623" },
  { id: 2, title: "無印良品で買ってよかったキッチングッズ10選", author: "シンプルライフ研究所", likes: 891, date: "5時間前", img: "/art-2.jpg", cat: "暮らし", avatar: "#7ed321" },
  { id: 3, title: "読書嫌いだった私が年間100冊読めるようになった方法", author: "本のソムリエ", likes: 567, date: "8時間前", img: "/art-3.jpg", cat: "自己啓発", avatar: "#4a90d9" },
  { id: 4, title: "一人暮らしの自炊｜週末2時間で平日5日分の作り置き", author: "ゆる自炊部", likes: 1203, date: "12時間前", img: "/art-4.jpg", cat: "料理", avatar: "#bd10e0" },
  { id: 5, title: "在宅ワーク3年目でわかった、集中できる部屋づくり", author: "リモートワーカーの手帖", likes: 445, date: "1日前", img: "/art-5.jpg", cat: "仕事", avatar: "#f08c56" },
  { id: 6, title: "スマホ断ちを1週間やってみた結果", author: "デジタルウェルネス", likes: 723, date: "1日前", img: "/art-6.jpg", cat: "ライフスタイル", avatar: "#50c8b4" },
  { id: 7, title: "30代から始める資産形成｜まずやるべき3つのこと", author: "お金の教室", likes: 1567, date: "2日前", img: "/art-7.jpg", cat: "マネー", avatar: "#d0021b" },
  { id: 8, title: "心が疲れた時に読みたい、気持ちが楽になる考え方", author: "こころの処方箋", likes: 2341, date: "2日前", img: "/art-8.jpg", cat: "メンタルヘルス", avatar: "#9013fe" },
  { id: 9, title: "IKEAの収納ハック｜6畳部屋を広く見せるテクニック", author: "収納マスター", likes: 678, date: "3日前", img: "/art-9.jpg", cat: "インテリア", avatar: "#b8e986" },
  { id: 10, title: "コンビニで見つけた、仕事帰りのご褒美スイーツ5選", author: "スイーツ探検隊", likes: 432, date: "3日前", img: "/art-10.jpg", cat: "グルメ", avatar: "#f5a623" },
  { id: 11, title: "睡眠の質が劇的に変わる｜寝る前の5つの習慣", author: "ぐっすり研究室", likes: 1890, date: "4日前", img: "/art-11.jpg", cat: "健康", avatar: "#4a90d9" },
  { id: 12, title: "カフェ巡り好きが教える、東京の隠れ家カフェ8選", author: "カフェ散歩", likes: 534, date: "4日前", img: "/art-12.jpg", cat: "お出かけ", avatar: "#50c8b4" },
];

const TRENDING_TAGS = ["朝活", "ミニマリスト", "作り置き", "在宅ワーク", "読書", "節約術"];

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
  const [currentTab, setCurrentTab] = useState<"home" | "discover" | "chat" | "notify" | "mypage">("home");

  const ADMIN_IDS = ["WATARU"];

  // 保存済みデータを復元
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
      socket.emit("register", { username: myUsername, userId: myUserId }, () => {});
    };
    socket.on("connect", doRegister);
    if (socket.connected) doRegister();
    const onContactAdded = ({ userId, username }: { userId: string; username: string }) => {
      addContactToList({ userId, username, lastMessage: `${username} があなたを追加しました`, lastTime: Date.now() });
    };
    socket.on("contact-added", onContactAdded);
    return () => {
      socket.off("connect", doRegister);
      socket.off("contact-added", onContactAdded);
    };
  }, [isSetup, myUserId, myUsername, addContactToList]);

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

  // ===== ログイン画面（コラムアプリ風に偽装） =====
  if (!isSetup) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#34d399] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#333]">コラムノート</h1>
            <p className="text-[#999] text-sm mt-1">暮らしのヒントをお届け</p>
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

  // ===== メイン画面 =====
  return (
    <div className="flex-1 flex flex-col h-dvh bg-white">

      {/* ========== ホームタブ（コラム記事フィード） ========== */}
      {currentTab === "home" && (
        <>
          <header className="px-4 pt-4 pb-2 border-b border-[#f0f0f0]">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-[#f5f5f5] rounded-full">
                <svg className="w-4 h-4 text-[#bbb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <span className="text-sm text-[#bbb]">検索</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {/* 急上昇 */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-lg font-bold text-[#333] mb-2">急上昇</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {TRENDING_TAGS.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-[#f5f5f5] rounded-full text-sm text-[#555] whitespace-nowrap border border-[#eee]">{tag}</span>
                ))}
              </div>
            </div>

            {/* 今日の注目記事 */}
            <div className="px-4 pt-4">
              <h2 className="text-lg font-bold text-[#333]">今日の注目記事</h2>
              <p className="text-xs text-[#bbb] mb-3">読みごたえのある記事を毎日ピックアップ</p>

              {/* メイン記事（大きいカード） */}
              <div className="rounded-2xl overflow-hidden mb-4 shadow-sm border border-[#f0f0f0]">
                <img src={ARTICLES[0].img} alt="" className="w-full h-48 object-cover" />
                <div className="p-3.5">
                  <p className="text-[15px] font-bold text-[#333] leading-snug">{ARTICLES[0].title}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: ARTICLES[0].avatar }} />
                    <span className="text-[11px] text-[#999]">{ARTICLES[0].author}</span>
                    <span className="text-[11px] text-[#ccc]">{ARTICLES[0].date}</span>
                    <span className="text-[11px] text-[#ccc] ml-auto">♡ {ARTICLES[0].likes}</span>
                  </div>
                </div>
              </div>

              {/* 記事リスト */}
              {ARTICLES.slice(1).map((article) => (
                <div key={article.id} className="flex gap-3 py-3.5 border-t border-[#f0f0f0]">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#333] leading-snug line-clamp-2">{article.title}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: article.avatar }} />
                      <span className="text-[11px] text-[#999]">{article.author}</span>
                      <span className="text-[11px] text-[#ccc]">{article.date}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-[#ccc]">♡ {article.likes}</span>
                      <span className="text-[10px] text-[#ccc] bg-[#f8f8f8] px-1.5 py-0.5 rounded">{article.cat}</span>
                    </div>
                  </div>
                  <img src={article.img} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                </div>
              ))}

              <div className="text-center py-6">
                <span className="text-sm text-[#bbb]">もっとみる</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== みつけるタブ ========== */}
      {currentTab === "discover" && (
        <>
          <header className="px-4 pt-4 pb-3 border-b border-[#f0f0f0]">
            <h1 className="text-xl font-bold text-[#333]">みつける</h1>
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-[#f5f5f5] rounded-full">
              <svg className="w-4 h-4 text-[#bbb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <span className="text-sm text-[#bbb]">キーワードで検索</span>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-[#999] mb-3 font-medium">カテゴリから探す</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { cat: "ライフスタイル", img: "/art-1.jpg" },
                { cat: "料理", img: "/art-4.jpg" },
                { cat: "仕事", img: "/art-5.jpg" },
                { cat: "健康", img: "/art-11.jpg" },
                { cat: "マネー", img: "/art-7.jpg" },
                { cat: "インテリア", img: "/art-9.jpg" },
                { cat: "自己啓発", img: "/art-3.jpg" },
                { cat: "グルメ", img: "/art-10.jpg" },
              ].map((item) => (
                <div key={item.cat} className="relative rounded-xl overflow-hidden h-24">
                  <img src={item.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{item.cat}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#999] mt-6 mb-3 font-medium">人気の記事</p>
            {ARTICLES.slice(0, 5).map((article) => (
              <div key={article.id} className="flex gap-3 py-3 border-t border-[#f0f0f0]">
                <img src={article.img} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#333] leading-snug line-clamp-2">{article.title}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: article.avatar }} />
                    <span className="text-[10px] text-[#999]">{article.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========== チャットタブ（本体機能） ========== */}
      {currentTab === "chat" && (
        <>
          <header className="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0] bg-white">
            <h1 className="text-lg font-bold text-[#333]">メッセージ</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMyId(!showMyId)} className="h-8 px-2.5 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[11px] text-[#999] hover:bg-[#eee] transition gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
                ID
              </button>
              <button onClick={() => { setShowAdd(!showAdd); setSearchResult(null); setSearchError(""); setSearchId(""); }} className="w-8 h-8 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[#999] hover:bg-[#eee] transition">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
              </button>
            </div>
          </header>

          {/* マイID */}
          {showMyId && (
            <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
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
            <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
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
                <p className="text-[#ccc] text-sm">メッセージはありません</p>
                <p className="text-[#ddd] text-xs mt-1">IDで友達を追加しよう</p>
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
        </>
      )}

      {/* ========== 通知タブ ========== */}
      {currentTab === "notify" && (
        <>
          <header className="px-4 pt-4 pb-3 border-b border-[#f0f0f0]"><h1 className="text-xl font-bold text-[#333]">通知</h1></header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-[#e0e0e0] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
              <p className="text-[#ccc] text-sm">通知はありません</p>
            </div>
          </div>
        </>
      )}

      {/* ========== マイページタブ ========== */}
      {currentTab === "mypage" && (
        <>
          <header className="px-4 pt-4 pb-3 border-b border-[#f0f0f0]"><h1 className="text-xl font-bold text-[#333]">マイページ</h1></header>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-[#f0f0f0] rounded-full flex items-center justify-center"><span className="text-xl font-bold text-[#bbb]">{myUsername.charAt(0).toUpperCase()}</span></div>
              <div><p className="text-base font-semibold text-[#333]">{myUsername}</p><p className="text-xs text-[#bbb]">ID: {myUserId}</p></div>
            </div>

            <div className="space-y-1">
              {[
                { label: "お気に入り記事", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" },
                { label: "閲覧履歴", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
                { label: "設定", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[#f8f8f8] transition text-left">
                  <svg className="w-5 h-5 text-[#bbb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                  <span className="text-[14px] text-[#555]">{item.label}</span>
                </button>
              ))}
              <button onClick={() => { if (confirm("ログアウトしますか？")) { disconnectSocket(); localStorage.removeItem("watapp-admin"); localStorage.setItem("watapp-loggedOut", "true"); setIsSetup(false); setIsAdmin(false); setCurrentTab("home"); } }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[#f8f8f8] transition text-left">
                <svg className="w-5 h-5 text-[#bbb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                <span className="text-[14px] text-[#ef4444]">ログアウト</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========== 下部ナビゲーションバー ========== */}
      <nav className="flex items-center border-t border-[#f0f0f0] bg-white px-2 pb-[env(safe-area-inset-bottom)]">
        {([
          { id: "home" as const, label: "ホーム", icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
          { id: "discover" as const, label: "みつける", icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
          { id: "chat" as const, label: "トーク", icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" },
          { id: "notify" as const, label: "通知", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
          { id: "mypage" as const, label: "マイページ", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition ${currentTab === tab.id ? "text-[#333]" : "text-[#ccc]"}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={currentTab === tab.id ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </nav>

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
