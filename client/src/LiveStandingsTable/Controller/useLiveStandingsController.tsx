import { useCallback, useEffect, useRef, useState } from "react";
import { mapTeamData, Team } from "../Datamapper/liveStandingsMapper";
import { createStandingsSocket } from "../../GlobalWebsocket/remote";

const RECONNECT_DELAY_MS = 1500;
const WS_STALE_LIMIT_MS = 12000;

const useLiveStandingsController = () => {
  const [standings, setStandings] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const lastMessageTimeRef = useRef(Date.now());
  const connectionIdRef = useRef(0);

  const matchId = "1865398120330647552";
  const matchNumber = "1";
  const dayName = "Grand Finals";
  const modeName='Champion Rush'

  /* ================= UPDATE ================= */
  const updateStandings = useCallback((result: any) => {
    if (!result) return;

    const source =
      result?.data?.standings ??
      result?.data?.team_stats ??
      result?.standings ??
      result?.team_stats ??
      (Array.isArray(result) ? result : null);

    if (!source) return;

    // Fixed: mapTeamData now takes only the raw source array directly.
    const mappedData = mapTeamData(source);
    setStandings(mappedData);
    setLoading(false);
  }, []);

  /* ================= CONNECT ================= */
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const currentConnectionId = ++connectionIdRef.current;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Close old socket connection if any
    socketRef.current?.close();

    const socket = createStandingsSocket(matchId);
    socketRef.current = socket;

    setLoading(true);

    socket.onopen = () => {
      if (connectionIdRef.current !== currentConnectionId) return;
      console.log("WS CONNECTED ⚡");
    };

    socket.onmessage = (event) => {
      if (connectionIdRef.current !== currentConnectionId) return;

      lastMessageTimeRef.current = Date.now();

      try {
        const parsed = JSON.parse(event.data);
        updateStandings(parsed);
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    socket.onerror = () => {
      if (connectionIdRef.current !== currentConnectionId) return;

      console.warn("WS ERROR → reconnecting");
      socket.close();
    };

    socket.onclose = () => {
      if (!isMountedRef.current) return;
      if (connectionIdRef.current !== currentConnectionId) return;

      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, [updateStandings]);

  /* ================= INIT ================= */
  useEffect(() => {
    isMountedRef.current = true;

    connect();

    const interval = setInterval(() => {
      const socket = socketRef.current;

      if (
        socket?.readyState === WebSocket.OPEN &&
        Date.now() - lastMessageTimeRef.current > WS_STALE_LIMIT_MS
      ) {
        console.warn("WS STALE → reconnecting");
        socket.close();
      }
    }, 4000);

    return () => {
      isMountedRef.current = false;

      clearInterval(interval);

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      socketRef.current?.close();
    };
  }, [connect]);

  /* ================= MANUAL REFRESH ================= */
  const refresh = useCallback(() => {
    socketRef.current?.close();
    connect();
  }, [connect]);

  return {
    standings,
    loading,
    refresh,
    matchNumber,
    dayName,
    modeName,
  };
};

export default useLiveStandingsController;
