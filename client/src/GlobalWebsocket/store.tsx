import { createStandingsSocket } from "./remote";

let socket: WebSocket | null = null;

let listeners: Array<(data: any) => void> = [];

let latestData: any = null;

export const connectRealtime = (matchId: string | number) => {
  // Prevent multiple sockets
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  socket = createStandingsSocket(matchId);

  socket.onopen = () => {
    console.log("Realtime Connected");
  };

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);

      latestData = parsed;

      listeners.forEach((cb) => cb(parsed));
    } catch (err) {
      console.error("WS Parse Error", err);
    }
  };

  socket.onclose = () => {
    console.log("Realtime Closed");

    // Optional auto reconnect
    setTimeout(() => {
      connectRealtime(matchId);
    }, 3000);
  };

  socket.onerror = (err) => {
    console.error("WS Error", err);
  };

  return socket;
};

export const subscribeRealtime = (callback: (data: any) => void) => {
  listeners.push(callback);

  // instant latest data
  if (latestData) {
    callback(latestData);
  }

  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
};

export const getRealtimeData = () => latestData;