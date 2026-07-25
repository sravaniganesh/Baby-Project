import { io } from "socket.io-client";
import API from "../config/api";

let socket;

export function connectAdminSocket(adminId) {
  const SOCKET_URL = (API.defaults.baseURL || "").replace("/api", "");

  socket = io(SOCKET_URL);

  socket.emit("register_admin", adminId);

  return socket;
}

export function getAdminSocket() {
  return socket;
}