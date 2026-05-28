import { useCallback, useEffect, useRef, useState } from "react";
import { mapTeamData, mergeHistoricalWithLiveStandings, Team } from "../Datamapper/liveStandingsMapper";
import { createStandingsSocket } from "../../GlobalWebsocket/remote";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
  getLeagueStageResultGameDetails,
  getResultGameDetails,
} from "../../GameDetails/gameDetailsState";
import { getTeamTableApi } from "../../TeamRecordTable/Repositary/remote";
import { getResultsByMatchIdsApi } from "../../Result/repository/remote";

const RECONNECT_DELAY_MS = 1500;
const WS_STALE_LIMIT_MS = 12000;

const splitMatchIds = (matchIds: string) =>
  matchIds
    .split(",")
    .map((matchId) => matchId.trim())
    .filter(Boolean);

const uniqueMatchIds = (matchIds: string[]) => Array.from(new Set(matchIds));

const collectHistoricalRows = (payload: any) => {
  const data = payload?.data || payload;
  const rows =
    payload?.overall ||
    data?.overall ||
    data?.overallLeaderboard ||
    data?.totalResults ||
    data?.total_results ||
    data?.results ||
    data?.standings ||
    data;

  return Array.isArray(rows) ? rows : [];
};

const collectLiveRows = (result: any) => {
  const source =
    result?.data?.liveStandings2 ??
    result?.liveStandings2 ??
    result?.data?.standings ??
    result?.data?.team_stats ??
    result?.standings ??
    result?.team_stats ??
    (Array.isArray(result) ? result : null);

  return Array.isArray(source) ? source : null;
};

const useLiveStandingsController = () => {
  const [standings, setStandings] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const lastMessageTimeRef = useRef(Date.now());
  const connectionIdRef = useRef(0);
  const previousStandingsRef = useRef<Team[]>([]);
  const historicalRowsRef = useRef<any[]>([]);

  const [activeDetails, setActiveDetails] = useState(getActiveGameDetails);
  const matchId = activeDetails.matchIds;
  const matchNumber = activeDetails.gameNumber;
  const dayName = activeDetails.roundName;
  const modeName = activeDetails.phase;

  /* ================= UPDATE ================= */
  const loadHistoricalRows = useCallback(async () => {
    const resultIds = uniqueMatchIds([
      ...splitMatchIds(getLeagueStageResultGameDetails().matchIds),
      ...splitMatchIds(getResultGameDetails().matchIds),
    ]);

    const [teams, resultPayload] = await Promise.all([
      getTeamTableApi(),
      resultIds.length > 0 ? getResultsByMatchIdsApi(resultIds) : Promise.resolve(null),
    ]);

    const teamRows = Array.isArray(teams) ? teams : [];
    const resultRows = collectHistoricalRows(resultPayload);
    const resultByTeamId = new Map(
      resultRows
        .map((row: any) => [
          String(row?.teamId ?? row?.team_id ?? row?.permanentTeamId ?? row?.permanent_team_id ?? ""),
          row,
        ] as const)
        .filter(([teamId]) => teamId),
    );

    historicalRowsRef.current = teamRows.map((team: any) => {
      const teamId = String(team?.teamId ?? team?.team_id ?? "");
      return {
        ...team,
        ...(resultByTeamId.get(teamId) || {}),
        teamId,
        teamName: team?.teamName ?? team?.team_name,
        teamTag: team?.teamTag ?? team?.shortTag ?? team?.short_tag ?? team?.tag,
        teamLogo: team?.teamLogo ?? team?.team_logo,
        countryLogo: team?.countryLogo ?? team?.country_logo,
      };
    });
  }, []);

  const updateStandings = useCallback((result: any) => {
    if (!result) return;

    const source = collectLiveRows(result);

    if (!source) return;

    const mappedData = historicalRowsRef.current.length > 0
      ? mergeHistoricalWithLiveStandings(
          historicalRowsRef.current,
          source,
          previousStandingsRef.current,
        )
      : mapTeamData(source, previousStandingsRef.current);

    previousStandingsRef.current = mappedData;
    setStandings(
      historicalRowsRef.current.length > 0
        ? mappedData.filter((team) => team.isPlaying)
        : mappedData,
    );
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
  }, [matchId, updateStandings]);

  useEffect(() => {
    const handleGameDetailsChange = () => {
      setActiveDetails(getActiveGameDetails());
      loadHistoricalRows().catch((err) => {
        console.warn("Failed to refresh historical leaderboard rows.", err);
      });
    };

    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, handleGameDetailsChange);
    window.addEventListener("storage", handleGameDetailsChange);

    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, handleGameDetailsChange);
      window.removeEventListener("storage", handleGameDetailsChange);
    };
  }, [loadHistoricalRows]);

  /* ================= INIT ================= */
  useEffect(() => {
    isMountedRef.current = true;

    loadHistoricalRows()
      .catch((err) => {
        console.warn("Failed to load historical leaderboard rows.", err);
      })
      .finally(() => {
        connect();
      });

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
  }, [connect, loadHistoricalRows]);

  /* ================= MANUAL REFRESH ================= */
  const refresh = useCallback(() => {
    socketRef.current?.close();
    loadHistoricalRows()
      .catch((err) => {
        console.warn("Failed to refresh historical leaderboard rows.", err);
      })
      .finally(() => {
        connect();
      });
  }, [connect, loadHistoricalRows]);

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
