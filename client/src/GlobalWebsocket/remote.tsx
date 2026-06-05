import http from "../AxiosFile/axios";
import * as ROUTES from "../Routes/ApiRoutes/apiRoutes";
import { getSelectedTournamentSlug } from "../Tournaments/tournamentState";

const getWebSocketBaseUrl = () => {
  const apiBaseUrl = ROUTES.API_BASE_URL.replace(/\/+$/, "");
  return apiBaseUrl.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
};

/* ================= REALTIME REST ================= */

export const fetchRealTimeData = async (matchId: string | number) => {
  try {
    const tournamentSlug = getSelectedTournamentSlug();
    const response = await http.get(`/${tournamentSlug}${ROUTES.REAL_TIME_API}/${matchId}`);

    return response?.data ?? null;
  } catch (error: any) {
    console.error("fetchRealTimeData error:", error?.message);
    return null;
  }
};

/* ================= WEBSOCKET (FIXED) ================= */
export const createStandingsSocket = (matchId: string | number) => {
  const tournamentSlug = getSelectedTournamentSlug();
  const WS_URL = `${getWebSocketBaseUrl()}/${tournamentSlug}/ws/realtime/${matchId}`;

  console.log("WS CONNECT →", WS_URL);

  return new WebSocket(WS_URL);
};

/* ================= TEAM API ================= */
export const fetchTeamLiveData = async () => {
  try {
    const response = await http.get(`${ROUTES.TEAMS}`);
    return response?.data ?? null;
  } catch (error: any) {
    console.error("fetchTeamLiveData error:", error?.message);
    return null;
  }
};
