import http from "../AxiosFile/axios";
import * as ROUTES from "../Routes/ApiRoutes/apiRoutes";

/* ================= REALTIME REST ================= */

export const fetchRealTimeData = async (matchId: string | number) => {
  try {
    const response = await http.get(`${ROUTES.REAL_TIME_API}/${matchId}`);

    return response?.data ?? null;
  } catch (error: any) {
    console.error("fetchRealTimeData error:", error?.message);
    return null;
  }
};

/* ================= WEBSOCKET (FIXED) ================= */
export const createStandingsSocket = (matchId: string | number) => {
  const WS_URL = `ws://82.29.155.252:3000/ws/realtime/${matchId}`;

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
