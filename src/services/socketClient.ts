import { io, Socket } from "socket.io-client";
import API_BASE_URL from "@/config/api";

let socket: Socket | null = null;

// Rooms to rejoin on every (re)connect: Socket.IO drops room membership on reconnect
const quizRooms = new Set<string>();
const quizHostRooms = new Set<string>();

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
      // Fallback for when the auth cookie isn't sent cross-site; the server
      // tries this and the cookie, using whichever is valid
      auth: (cb) => {
        let token: string | null = null;
        try {
          token = localStorage.getItem("authToken");
        } catch {}
        cb(token ? { token } : {});
      },
    });

    socket.on("connect", () => {
      quizRooms.forEach((quizId) => socket?.emit("quiz:join-room", { quizId }));
      quizHostRooms.forEach((quizId) =>
        socket?.emit("quiz:join-host-room", { quizId }),
      );
    });
  }
  return socket;
};

export const joinQuizRoom = (quizId: string) => {
  quizRooms.add(quizId);
  const s = getSocket();
  s.emit("quiz:join-room", { quizId });
};

// Host-only room carrying live vote counts; the server checks the caller owns the quiz
export const joinQuizHostRoom = (quizId: string) => {
  quizHostRooms.add(quizId);
  getSocket().emit("quiz:join-host-room", { quizId });
};
