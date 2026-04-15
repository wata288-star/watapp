// カスタムサーバー: Next.js + Socket.IO シグナリングサーバー
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ユーザーIDを生成（6桁の英数字）
function generateUserId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
    maxHttpBufferSize: 15e6, // 15MB（写真・動画送信用）
  });

  // ユーザー登録情報 { odl: { username, visitorId, socketId } }
  const users = new Map();
  // ルームごとのユーザー管理
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log(`接続: ${socket.id}`);

    // ユーザー登録（名前を設定してIDを発行）
    socket.on("register", ({ username, userId: existingId }, callback) => {
      // 既存IDがあればそれを使う（再接続時）
      if (existingId && users.has(existingId)) {
        const user = users.get(existingId);
        user.socketId = socket.id;
        user.username = username;
        socket.data.userId = existingId;
        socket.data.username = username;
        console.log(`再接続: ${username} (ID: ${existingId})`);
        callback({ userId: existingId, username });
        return;
      }

      // 既存IDがあるけどサーバーに無い場合（サーバー再起動後など）→ 同じIDで再登録
      if (existingId) {
        users.set(existingId, { username, socketId: socket.id });
        socket.data.userId = existingId;
        socket.data.username = username;
        console.log(`再登録: ${username} (ID: ${existingId})`);
        callback({ userId: existingId, username });
        return;
      }

      // 新規登録
      let userId;
      do {
        userId = generateUserId();
      } while (users.has(userId));

      users.set(userId, { username, socketId: socket.id });
      socket.data.userId = userId;
      socket.data.username = username;
      console.log(`新規登録: ${username} (ID: ${userId})`);
      callback({ userId, username });
    });

    // ユーザーIDで相手を検索
    socket.on("find-user", ({ userId }, callback) => {
      const user = users.get(userId.toUpperCase());
      if (user) {
        callback({ found: true, userId: userId.toUpperCase(), username: user.username });
      } else {
        callback({ found: false });
      }
    });

    // 連絡先追加 → 相手にも通知して自動的に連絡先を追加
    socket.on("add-contact", ({ targetUserId }, callback) => {
      const targetUser = users.get(targetUserId);
      const myUserId = socket.data.userId;
      const myUsername = socket.data.username;

      if (!targetUser || !myUserId) {
        callback({ success: false });
        return;
      }

      // 相手がオンラインなら通知を送る
      if (targetUser.socketId) {
        io.to(targetUser.socketId).emit("contact-added", {
          userId: myUserId,
          username: myUsername,
        });
      }

      callback({ success: true });
      console.log(`${myUsername} (${myUserId}) → ${targetUser.username} (${targetUserId}) を連絡先に追加`);
    });

    // ルームに参加
    socket.on("join-room", ({ roomId, username }) => {
      // 前のルームから退出
      if (socket.data.roomId && socket.data.roomId !== roomId) {
        const prevRoom = rooms.get(socket.data.roomId);
        if (prevRoom) {
          prevRoom.delete(socket.id);
          if (prevRoom.size === 0) rooms.delete(socket.data.roomId);
          socket.to(socket.data.roomId).emit("user-left", {
            socketId: socket.id,
            username: socket.data.username,
          });
        }
        socket.leave(socket.data.roomId);
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      const room = rooms.get(roomId);
      room.set(socket.id, username);

      // 部屋の他のユーザーに通知
      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        username,
      });

      // 既存ユーザー一覧を送信
      const roomUsers = [];
      room.forEach((name, id) => {
        if (id !== socket.id) {
          roomUsers.push({ socketId: id, username: name });
        }
      });
      socket.emit("room-users", roomUsers);

      console.log(`${username} がルーム ${roomId} に参加 (現在 ${room.size}人)`);
    });

    // WebRTC シグナリング: オファー送信
    socket.on("offer", ({ to, offer }) => {
      socket.to(to).emit("offer", {
        from: socket.id,
        offer,
        username: socket.data.username,
      });
    });

    // WebRTC シグナリング: アンサー送信
    socket.on("answer", ({ to, answer }) => {
      socket.to(to).emit("answer", {
        from: socket.id,
        answer,
      });
    });

    // WebRTC シグナリング: ICE候補送信
    socket.on("ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    // チャットメッセージ送信（テキスト / 画像 / 動画）
    socket.on("chat-message", ({ roomId, message, type, fileData, fileName }) => {
      io.to(roomId).emit("chat-message", {
        username: socket.data.username,
        message,
        timestamp: Date.now(),
        socketId: socket.id,
        type: type || "text",
        fileData: fileData || undefined,
        fileName: fileName || undefined,
      });
    });

    // 切断処理
    socket.on("disconnect", () => {
      const { roomId, username, userId } = socket.data;
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
        socket.to(roomId).emit("user-left", {
          socketId: socket.id,
          username,
        });
        console.log(`${username} がルーム ${roomId} から退出`);
      }
      // ユーザー情報はそのまま保持（再接続用）
      // ただしsocketIdはクリア
      if (userId && users.has(userId)) {
        users.get(userId).socketId = null;
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> サーバー起動: http://${hostname}:${port}`);
  });
});
