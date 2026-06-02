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

const RECONNECT_DELAY_MS = 500;
const WS_STALE_LIMIT_MS = 5000;

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

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null) ?? "";

const minimizePlayer = (player: any) => ({
  account_id: firstValue(player?.account_id, player?.player_uid, player?.playerUid),
  nickname: firstValue(player?.nickname, player?.player_name, player?.playerName, player?.name),
  player_state: firstValue(player?.player_state, player?.playerState, 0),
  be_killed_time: firstValue(player?.be_killed_time, player?.beKilledTime, 0),
  hp_info: {
    current_hp: firstValue(player?.hp_info?.current_hp, player?.hpInfo?.currentHp, 0),
    total_hp: firstValue(player?.hp_info?.total_hp, player?.hpInfo?.totalHp, 200),
  },
  player_image: firstValue(player?.player_image, player?.player_pic, player?.playerPic),
});

const minimizeTeam = (team: any) => {
  const players = Array.isArray(team?.player_stats)
    ? team.player_stats
    : Array.isArray(team?.players)
      ? team.players
      : [];

  return {
    team_id: firstValue(team?.team_id, team?.permanent_team_id, team?.teamId, team?.permanentTeamId),
    room_team_id: firstValue(team?.room_team_id, team?.roomTeamId, null),
    team_name: firstValue(team?.team_name, team?.teamName, team?.name),
    short_tag: firstValue(team?.short_tag, team?.teamTag, team?.tag),
    team_logo: firstValue(team?.team_logo, team?.teamLogo),
    country_logo: firstValue(team?.country_logo, team?.countryLogo),
    full_team_banner: firstValue(team?.full_team_banner, team?.fullTeamBanner),
    notification_team_banner: firstValue(
      team?.notification_team_banner,
      team?.notificationTeamBanner,
    ),
    booyah_banner: firstValue(team?.booyah_banner, team?.booyah_image, team?.booyahBanner),
    win_rate: firstValue(team?.win_rate, team?.winRate, 0),
    ranking_score: firstValue(team?.ranking_score, team?.placementPoints, 0),
    killing_score: firstValue(team?.killing_score, team?.kill_count, team?.kills, 0),
    live_kills: firstValue(team?.live_kills, team?.liveKills, team?.killing_score, 0),
    live_points: firstValue(team?.live_points, team?.livePoints, 0),
    total_points: firstValue(team?.total_points, team?.totalPoints, 0),
    historical_kills: firstValue(team?.historical_kills, team?.historicalKills, 0),
    historical_points: firstValue(team?.historical_points, team?.historicalPoints, 0),
    is_playing: firstValue(team?.is_playing, team?.isPlaying, players.length > 0),
    is_eliminated: Boolean(firstValue(team?.is_eliminated, team?.isEliminated, false)),
    player_stats: players.map(minimizePlayer),
  };
};

const minimizeLiveRows = (rows: any[]) => rows.map(minimizeTeam);

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
        team_id: teamId,
        team_name: team?.team_name ?? team?.teamName,
        short_tag: team?.short_tag ?? team?.shortTag ?? team?.teamTag ?? team?.tag,
        team_logo: team?.team_logo ?? team?.teamLogo,
        country_logo: team?.country_logo ?? team?.countryLogo,
      };
    });
  }, []);

  const publishStandings = useCallback((nextStandings: Team[]) => {
    setStandings(nextStandings);
    setLoading(false);
  }, []);

  const updateStandings = useCallback((result: any) => {
    if (!result) return;

    const source = collectLiveRows(result);

    if (!source) return;

    const liveRows = minimizeLiveRows(source);

    const mappedData = historicalRowsRef.current.length > 0
      ? mergeHistoricalWithLiveStandings(
          historicalRowsRef.current,
          liveRows,
          previousStandingsRef.current,
        )
      : mapTeamData(liveRows, previousStandingsRef.current);

    previousStandingsRef.current = mappedData;
    publishStandings(
      historicalRowsRef.current.length > 0
        ? mappedData.filter((team) => team.isPlaying)
        : mappedData,
    );
  }, [publishStandings]);

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

    connect();

    loadHistoricalRows().catch((err) => {
      console.warn("Failed to load historical leaderboard rows.", err);
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
    }, 1000);

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
