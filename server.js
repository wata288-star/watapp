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

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // ルームごとのユーザー管理
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log(`接続: ${socket.id}`);

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
      const users = [];
      room.forEach((name, id) => {
        if (id !== socket.id) {
          users.push({ socketId: id, username: name });
        }
      });
      socket.emit("room-users", users);

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

    // チャットメッセージ送信
    socket.on("chat-message", ({ roomId, message }) => {
      io.to(roomId).emit("chat-message", {
        username: socket.data.username,
        message,
        timestamp: Date.now(),
        socketId: socket.id,
      });
    });

    // 切断処理
    socket.on("disconnect", () => {
      const { roomId, username } = socket.data;
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
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> サーバー起動: http://${hostname}:${port}`);
  });
});
