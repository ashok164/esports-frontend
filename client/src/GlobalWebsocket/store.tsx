import { createStandingsSocket } from "./remote";

let socket: WebSocket | null = null;

let listeners: Array<(data: any) => void> = [];

let latestData: any = null;
let activeMatchId: string | number | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

export const connectRealtime = (matchId: string | number) => {
  clearReconnectTimer();

  if (
    socket &&
    socket.readyState === WebSocket.OPEN &&
    String(activeMatchId) === String(matchId)
  ) {
    return socket;
  }

  if (socket && String(activeMatchId) !== String(matchId)) {
    socket.close();
  }

  activeMatchId = matchId;
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

    if (listeners.length === 0 || String(activeMatchId) !== String(matchId)) return;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
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

    if (listeners.length === 0) {
      clearReconnectTimer();
      socket?.close();
      socket = null;
    }
  };
};

export const getRealtimeData = () => latestData;
