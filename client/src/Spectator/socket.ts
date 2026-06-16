import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../Routes/ApiRoutes/apiRoutes";

let spectatorSocket: Socket | null = null;

const getSocketBaseUrl = () => API_BASE_URL.replace(/\/$/, "");

export const getSpectatorSocket = () => {
  if (spectatorSocket) {
    return spectatorSocket;
  }

  spectatorSocket = io(`${getSocketBaseUrl()}/spectator-camera`, {
    transports: ["websocket"],
  });

  return spectatorSocket;
};
