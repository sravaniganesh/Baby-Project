console.log(__dirname);
const path = require("path");

// 🔥 SOCKET MAPS
const userSocketMap = {};
const doctorSocketMap = {};

let ioInstance;

module.exports = {
  attachIO: (io) => {
    ioInstance = io;

    ioInstance.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);
      
      /* ===============================
   SEND MESSAGE (REALTIME)
=============================== */
socket.on("send_message", ({ chatId, message }) => {
  console.log("📨 MESSAGE:", chatId);

  ioInstance.to(chatId).emit("receive_message", message);
});
/* ===============================
   ✍️ TYPING INDICATOR
=============================== */
socket.on("typing", ({ chatId, role }) => {
  socket.to(chatId).emit("typing", { role });
});

socket.on("stop_typing", ({ chatId, role }) => {
  socket.to(chatId).emit("stop_typing", { role });
});
      /* ===============================
         JOIN CHAT ROOM
      =============================== */
      socket.on("joinChat", async ({ chatId, role }) => {
        try {
          const Chat = require(path.join(__dirname, "models", "Chat"));

          const chat = await Chat.findById(chatId);
          if (!chat) return;

          if (chat.status === "requested") {
  console.log("🚫 joinChat blocked (requested)");
  return;
}

          socket.join(chatId);

          let updated = false;

          if (role === "doctor" && !chat.isDoctorInChat) {
            chat.isDoctorInChat = true;
            updated = true;
          }

          if (role === "user" && !chat.isUserInChat) {
            chat.isUserInChat = true;
            updated = true;
          }

          /* ===============================
             START TIMER (ONLY ONCE)
          =============================== */
          if (
            chat.status === "accepted" &&
            chat.isDoctorInChat &&
            chat.isUserInChat
          ) {
            chat.status = "active";
            chat.lastPausedAt = null;
            updated = true;

            ioInstance.to(chatId).emit("startTimer", {
              remainingTime: chat.remainingTime,
            });
          }
          /* ===============================
   ⏱️ TIMER ENGINE (SERVER SIDE)
=============================== */
const chatController = require("./controllers/chatController");

if (!chat._interval) {
  chat._interval = setInterval(async () => {
    const currentChat = await Chat.findById(chatId);

    if (!currentChat) return;

    if (currentChat.status !== "active") return;

    if (currentChat.remainingTime <= 0) {
      // 🔥 SESSION ENDED → CALL WALLET DEDUCTION
      await chatController.handleSessionPayment({
        chatId,
        type: "chat",
      });

      return;
    }

    currentChat.remainingTime -= 1;
    await currentChat.save();

    ioInstance.to(chatId).emit("timerTick", {
      remainingTime: currentChat.remainingTime,
    });

  }, 1000);
}

          /* ===============================
             RESUME TIMER
          =============================== */
          if (
            chat.status === "paused" &&
            chat.isDoctorInChat &&
            chat.isUserInChat
          ) {
            chat.status = "active";
            chat.lastPausedAt = null;
            updated = true;

            ioInstance.to(chatId).emit("resumeTimer", {
              remainingTime: chat.remainingTime,
            });
          }

          if (updated) await chat.save();
        } catch (err) {
          console.error("joinChat error:", err);
        }
      });

      /* ===============================
         LEAVE CHAT
      =============================== */
    socket.on("leaveChat", async ({ chatId, role }) => {
  try {
    const Chat = require(path.join(__dirname, "models", "Chat"));

    const chat = await Chat.findById(chatId);
    if (!chat) return;

    let updated = false;

    if (role === "user" && chat.isUserInChat) {
      chat.isUserInChat = false;
      updated = true;
    }

    if (role === "doctor" && chat.isDoctorInChat) {
      chat.isDoctorInChat = false;
      updated = true;
    }

    // 🚫 DO NOTHING for requested/accepted
    if (chat.status === "requested" || chat.status === "accepted") {
      if (updated) await chat.save();
      return;
    }

    // ✅ ONLY active → paused
    if (
      chat.status === "active" &&
      (!chat.isUserInChat || !chat.isDoctorInChat)
    ) {
      chat.status = "paused";
      chat.lastPausedAt = new Date();
      updated = true;

      ioInstance.to(chatId).emit("pauseTimer");
    }

    if (updated) {
      await chat.save();
      ioInstance.to(chatId).emit("chatUpdated", chat);
    }

  } catch (err) {
    console.error("leaveChat error:", err);
  }
});

        
      /* ===============================
   ⏱️ SESSION ENDED (WALLET DEDUCT)
=============================== */
socket.on("sessionEnded", async ({ chatId, type }) => {
  try {
    const chatController = require("./controllers/chatController");

    await chatController.handleSessionPayment({
      chatId,
      type: type || "chat",
    });
  } catch (err) {
    console.error("Session end error:", err);
  }
});

      /* ===============================
         EXISTING LOGIC (UNCHANGED)
      =============================== */
      socket.on("register_doctor", (doctorId) => {
        doctorSocketMap[socket.id] = doctorId;

        ioInstance.emit("doctorStatusUpdate", {
          doctorId,
          availability: "online",
        });
      });

      socket.on("register_user", (userId) => {
        userSocketMap[socket.id] = userId;
      });

      socket.on("disconnect", () => {
        const doctorId = doctorSocketMap[socket.id];

        if (doctorId) {
          ioInstance.emit("doctorStatusUpdate", {
            doctorId,
            availability: "offline",
          });
          delete doctorSocketMap[socket.id];
        }

        delete userSocketMap[socket.id];
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });
  },

  getIO: () => {
    if (!ioInstance) {
      throw new Error("Socket.io not initialized");
    }
    return ioInstance;
  },
};