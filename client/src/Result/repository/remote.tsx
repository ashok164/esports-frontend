import http from "../../AxiosFile/axios";
import {
  CREATE_RESULT,
  DELETE_RESULT,
  FETCH_MATCH_RESULT_DATA,
  GET_RESULT_BOOYAH,
  GET_RESULT_BY_MATCH_ID,
  GET_RESULT_MVP,
  GET_RESULT_TEAM_STATS,
  GET_RESULT_TOP_FRAGGERS,
  GET_RESULTS_BY_MATCH_IDS,
  SAVE_REALTIME_RESULT_BY_MATCH_IDS,
  SYNC_RESULTS_SHEET,
  UPDATE_RESULT,
} from "../../Routes/ApiRoutes/apiRoutes";

export type ResultRow = {
  id?: string | number;
  _id?: string | number;
  matchIds?: string;
  teamId: string;
  teamLogo: string;
  countryLogo: string;
  teamName: string;
  teamTag: string;
  kills: string | number;
  placement: string | number;
  booyahCount: string | number;
  totalKills: string | number;
  [key: string]: any;
};

const DEFAULT_MATCH_STATS_SIGN = "c00ca1f055c6ab2876cc41e6771f79d2";
const DEFAULT_MATCH_STATS_TS = 1779806936;
const MATCH_STATS_TIMEOUT_MS = 60000;
const RESULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcXFMNMoIJUay3C0Xahnpg76uEIDwLdDsI1zZ7HxQ6PQwVB77eoTDrvlOiph2KSjjT-JHkDyCKPRYS/pubhtml";
const RESULT_BROADCAST_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1NitHDkGLecivEAlT9MHOU4mu3MGM-4dpqUSSYP0-Ruk/edit?gid=1233086821#gid=1233086821";
const OVERALL_RESULT_BROADCAST_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1NitHDkGLecivEAlT9MHOU4mu3MGM-4dpqUSSYP0-Ruk/edit?gid=923569097#gid=923569097";
const LEAGUE_STAGE_RESULT_BROADCAST_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1NitHDkGLecivEAlT9MHOU4mu3MGM-4dpqUSSYP0-Ruk/edit?gid=1123167887#gid=1123167887";
const BROADCAST_RESULTS_SPREADSHEET_ID = "1NitHDkGLecivEAlT9MHOU4mu3MGM-4dpqUSSYP0-Ruk";

export const createResultApi = async (result: Partial<ResultRow> | Array<Partial<ResultRow>>) => {
  const response = await http.post(CREATE_RESULT, result);
  return response?.data;
};

export const getResultByMatchIdApi = async (matchId: string | number) => {
  const response = await http.get(GET_RESULT_BY_MATCH_ID(matchId));
  return response?.data;
};

export const getResultTeamStatsApi = async (matchId: string | number) => {
  const response = await http.get(GET_RESULT_TEAM_STATS(matchId));
  return response?.data;
};

export const getResultMvpApi = async (matchId: string | number) => {
  const response = await http.get(GET_RESULT_MVP(matchId));
  return response?.data;
};

export const getResultTopFraggersApi = async (matchId: string | number) => {
  const response = await http.get(GET_RESULT_TOP_FRAGGERS(matchId));
  return response?.data;
};

export const getResultBooyahApi = async (matchId: string | number) => {
  const response = await http.get(GET_RESULT_BOOYAH(matchId));
  return response?.data;
};

export const getResultsByMatchIdsApi = async (matchIds: Array<string | number>) => {
  const response = await http.post(GET_RESULTS_BY_MATCH_IDS, { matchIds });
  return response?.data;
};

export const updateResultApi = async (id: string | number, result: ResultRow) => {
  const response = await http.put(UPDATE_RESULT(id), result);
  return response?.data;
};

export const deleteResultApi = async (id: string | number) => {
  const response = await http.delete(DELETE_RESULT(id));
  return response?.data;
};

export const fetchMatchResultDataApi = async (matchIds: string[]) => {
  const payload = {
    match_ids: matchIds,
    single_match_id: [],
    _ts: DEFAULT_MATCH_STATS_TS,
    _sign: DEFAULT_MATCH_STATS_SIGN,
  };

  const response = await http.post(FETCH_MATCH_RESULT_DATA, payload, {
    timeout: MATCH_STATS_TIMEOUT_MS,
  });
  return response?.data;
};

export const saveRealtimeResultDataApi = async (matchIds: string[]) => {
  const response = await http.post(SAVE_REALTIME_RESULT_BY_MATCH_IDS, {
    matchIds,
  });

  return response?.data;
};

type SyncResultsSheetOptions = {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetName?: string;
  sheetIndex?: number;
  sheetGid?: number;
};

export const syncResultsSheetApi = async (results: ResultRow[], options: SyncResultsSheetOptions = {}) => {
  const response = await http.post(SYNC_RESULTS_SHEET, {
    spreadsheetUrl: options.spreadsheetUrl || RESULT_SHEET_URL,
    spreadsheetId: options.spreadsheetId,
    sheetName: options.sheetName || "Result DB",
    sheetIndex: options.sheetIndex ?? 1,
    sheetGid: options.sheetGid,
    gid: options.sheetGid,
    worksheetGid: options.sheetGid,
    results,
  });

  return response?.data;
};

export const syncSingleResultSheetApi = async (results: ResultRow[]) =>
  syncResultsSheetApi(results, {
    spreadsheetId: BROADCAST_RESULTS_SPREADSHEET_ID,
    spreadsheetUrl: RESULT_BROADCAST_SHEET_URL,
    sheetName: "Result",
    sheetGid: 1233086821,
  });

export const syncOverallResultSheetApi = async (results: ResultRow[]) =>
  syncResultsSheetApi(results, {
    spreadsheetId: BROADCAST_RESULTS_SPREADSHEET_ID,
    spreadsheetUrl: OVERALL_RESULT_BROADCAST_SHEET_URL,
    sheetName: "Overall Result",
    sheetGid: 923569097,
  });

export const syncLeagueStageResultSheetApi = async (results: ResultRow[]) =>
  syncResultsSheetApi(results, {
    spreadsheetId: BROADCAST_RESULTS_SPREADSHEET_ID,
    spreadsheetUrl: LEAGUE_STAGE_RESULT_BROADCAST_SHEET_URL,
    sheetName: "League Stage Result",
    sheetGid: 1123167887,
  });
