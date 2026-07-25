import { io, Socket } from "socket.io-client";
import API from "../config/api";

export type SenderRole = "user" | "doctor";

export interface SocketMessage {
  sender: SenderRole;
  text: string;
  createdAt: string;
}

let socket: Socket | null = null;

// derive socket url from API base
const SOCKET_URL = (API.defaults.baseURL || "").replace("/api", "");

/* ================= CONNECT ================= */

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });
  }

  return socket;
};

/* ================= SAFE JOIN ================= */

export const joinRoom = (
  chatId: string,
  role: "user" | "doctor",
  status: "requested" | "accepted" | "active" | "paused"
) => {
  if (!socket) return;

  if (status === "requested") {
    console.log("🚫 join blocked (requested)");
    return;
  }

  socket.emit("joinChat", { chatId, role });
};
/* ================= SEND MESSAGE ================= */

export const sendMessage = (chatId: string, message: SocketMessage) => {
  if (!socket) return;

  // ✅ FIXED: use chatId (NOT roomId)
  socket.emit("send_message", { chatId, message });
};

/* ================= RECEIVE MESSAGE ================= */

export const onReceiveMessage = (
  callback: (message: SocketMessage) => void
) => {
  if (!socket) return () => {};

 socket.off("receive_message", callback);
  socket.on("receive_message", callback);

  return () => {
    socket?.off("receive_message", callback);
  };
};

/* ================= DISCONNECT ================= */

export const disconnectSocket = () => {
  if (socket) {
    socket.off();
    socket.disconnect();
    socket = null;
  }
};