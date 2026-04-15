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

function generateUserId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// メッセージID生成
let msgIdCounter = 0;
function generateMsgId() {
  return `${Date.now()}-${++msgIdCounter}`;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
    maxHttpBufferSize: 15e6,
  });

  const users = new Map();
  const rooms = new Map();

  io.on("connection", (socket) => {
    // ユーザー登録
    socket.on("register", ({ username, userId: existingId }, callback) => {
      if (existingId && users.has(existingId)) {
        const user = users.get(existingId);
        user.socketId = socket.id;
        user.username = username;
        user.lastSeen = Date.now();
        socket.data.userId = existingId;
        socket.data.username = username;
        callback({ userId: existingId, username });
        return;
      }

      if (existingId) {
        users.set(existingId, { username, socketId: socket.id, lastSeen: Date.now() });
        socket.data.userId = existingId;
        socket.data.username = username;
        callback({ userId: existingId, username });
        return;
      }

      let userId;
      do { userId = generateUserId(); } while (users.has(userId));
      users.set(userId, { username, socketId: socket.id, lastSeen: Date.now() });
      socket.data.userId = userId;
      socket.data.username = username;
      callback({ userId, username });
    });

    socket.on("find-user", ({ userId }, callback) => {
      const user = users.get(userId.toUpperCase());
      if (user) {
        callback({ found: true, userId: userId.toUpperCase(), username: user.username });
      } else {
        callback({ found: false });
      }
    });

    socket.on("check-status", ({ targetUserId }, callback) => {
      const target = users.get(targetUserId);
      if (!target) { callback({ online: false, lastSeen: null }); return; }
      callback({ online: !!target.socketId, lastSeen: target.lastSeen || null });
    });

    // ID変更
    socket.on("change-id", ({ oldId, newId }, callback) => {
      const id = newId.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (id.length < 3 || id.length > 8) { callback({ success: false, error: "IDは3〜8文字で入力してください" }); return; }
      if (id === oldId) { callback({ success: false, error: "現在のIDと同じです" }); return; }
      if (users.has(id)) { callback({ success: false, error: "このIDはすでに使われています" }); return; }

      // 旧IDのデータを新IDに移行
      const userData = users.get(oldId);
      if (userData) {
        users.delete(oldId);
        users.set(id, userData);
      } else {
        users.set(id, { username: socket.data.username, socketId: socket.id, lastSeen: Date.now() });
      }
      socket.data.userId = id;
      callback({ success: true, newId: id });
    });

    socket.on("add-contact", ({ targetUserId }, callback) => {
      const targetUser = users.get(targetUserId);
      const myUserId = socket.data.userId;
      const myUsername = socket.data.username;
      if (!targetUser || !myUserId) { callback({ success: false }); return; }
      if (targetUser.socketId) {
        io.to(targetUser.socketId).emit("contact-added", { userId: myUserId, username: myUsername });
      }
      callback({ success: true });
    });

    // ルームに参加
    socket.on("join-room", ({ roomId, username }) => {
      if (socket.data.roomId && socket.data.roomId !== roomId) {
        const prevRoom = rooms.get(socket.data.roomId);
        if (prevRoom) {
          prevRoom.delete(socket.id);
          if (prevRoom.size === 0) rooms.delete(socket.data.roomId);
          socket.to(socket.data.roomId).emit("user-left", { socketId: socket.id, username: socket.data.username });
        }
        socket.leave(socket.data.roomId);
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;

      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      const room = rooms.get(roomId);
      room.set(socket.id, username);

      socket.to(roomId).emit("user-joined", { socketId: socket.id, username });

      const roomUsers = [];
      room.forEach((name, id) => {
        if (id !== socket.id) roomUsers.push({ socketId: id, username: name });
      });
      socket.emit("room-users", roomUsers);
    });

    // WebRTC シグナリング
    socket.on("offer", ({ to, offer }) => {
      socket.to(to).emit("offer", { from: socket.id, offer, username: socket.data.username });
    });
    socket.on("answer", ({ to, answer }) => {
      socket.to(to).emit("answer", { from: socket.id, answer });
    });
    socket.on("ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // チャットメッセージ送信（msgId付き）
    socket.on("chat-message", ({ roomId, message, type, fileData, fileName }) => {
      const msgId = generateMsgId();
      io.to(roomId).emit("chat-message", {
        msgId,
        username: socket.data.username,
        message,
        timestamp: Date.now(),
        socketId: socket.id,
        type: type || "text",
        fileData: fileData || undefined,
        fileName: fileName || undefined,
      });
    });

    // メッセージ編集
    socket.on("edit-message", ({ roomId, msgId, newMessage }) => {
      io.to(roomId).emit("message-edited", {
        msgId,
        newMessage,
        editedBy: socket.data.username,
        editedAt: Date.now(),
      });
    });

    // 既読通知（管理者用）
    socket.on("mark-read", ({ roomId, username }) => {
      socket.to(roomId).emit("messages-read", {
        readBy: username,
        readAt: Date.now(),
      });
    });

    // 位置情報送信
    socket.on("send-location", ({ roomId, lat, lng, username }) => {
      socket.to(roomId).emit("user-location", {
        username,
        lat,
        lng,
        timestamp: Date.now(),
      });
    });

    // 切断処理
    socket.on("disconnect", () => {
      const { roomId, username, userId } = socket.data;
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.delete(socket.id);
        if (room.size === 0) rooms.delete(roomId);
        socket.to(roomId).emit("user-left", { socketId: socket.id, username });
      }
      if (userId && users.has(userId)) {
        const user = users.get(userId);
        user.socketId = null;
        user.lastSeen = Date.now();
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> サーバー起動: http://${hostname}:${port}`);
  });
});
