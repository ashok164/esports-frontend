import http from "../../AxiosFile/axios";
import {
  CREATE_TEAM_TABLE,
  DELETE_TEAM_DETAILS,
  GET_TEAM_DETAILS,
  GET_TODAYS_PLAYING_TEAMS,
  UPDATE_TEAM_PLAYING,
  UPDATE_TEAM_DETAILS,
} from "../../Routes/ApiRoutes/apiRoutes";
import { getSelectedTournamentSlug } from "../../Tournaments/tournamentState";

export type TodaysPlayingTeam = {
  id: string | number;
  teamId: string | number;
  name: string;
  tag: string;
  logo: string;
  teamLogo: string;
  countryLogo: string;
};

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? "";

const TEAM_TABLE_CACHE_TTL_MS = 15000;

type TeamTableCacheEntry = {
  data: any[] | null;
  expiresAt: number;
  promise: Promise<any[]> | null;
};

const unwrapTeams = (response: any) => {
  const data = response?.data;
  return data?.data || data?.teams || data?.teamDetails || data || [];
};

const withTournamentSlug = (path: string) => {
  const tournamentSlug = getSelectedTournamentSlug();
  return tournamentSlug
    ? `/${encodeURIComponent(tournamentSlug)}${path}`
    : path;
};

const teamTableCache = new Map<string, TeamTableCacheEntry>();

const getTeamTableCacheKey = () => {
  const tournamentSlug = getSelectedTournamentSlug();
  return tournamentSlug ? String(tournamentSlug).trim().toLowerCase() : "__default__";
};

const invalidateTeamTableCache = (cacheKey?: string) => {
  if (cacheKey) {
    teamTableCache.delete(cacheKey);
    return;
  }

  teamTableCache.clear();
};

const mapTodaysPlayingTeam = (team: any): TodaysPlayingTeam => {
  const logo = String(firstValue(team?.teamLogo, team?.team_logo, team?.logo, team?.logoUrl));
  const countryLogo = String(firstValue(team?.countryLogo, team?.country_logo, team?.flag, team?.countryUrl));

  return {
    id: firstValue(team?.id, team?._id, team?.teamId, team?.team_id),
    teamId: firstValue(team?.teamId, team?.team_id, team?.permanentTeamId, team?.permanent_team_id),
    name: String(firstValue(team?.teamName, team?.team_name, team?.name)),
    tag: String(firstValue(team?.shortTag, team?.short_tag, team?.teamTag, team?.team_tag, team?.tag)),
    logo,
    teamLogo: logo,
    countryLogo,
  };
};

export const createTeamTableApi = async (data: FormData) => {
  try {
    const apiCall = await http.post(CREATE_TEAM_TABLE, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    invalidateTeamTableCache();
    return apiCall;
  } catch (err) {
    console.log("API ERROR:", err);
    throw err;
  }
};

export const getTeamTableApi = async (options: { forceFresh?: boolean } = {}) => {
  const cacheKey = getTeamTableCacheKey();
  const now = Date.now();
  const cached = teamTableCache.get(cacheKey);

  if (!options.forceFresh && cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (!options.forceFresh && cached?.promise) {
    return cached.promise;
  }

  const promise = http
    .get(withTournamentSlug(GET_TEAM_DETAILS), {
      params: options.forceFresh ? { _t: now } : undefined,
      headers: options.forceFresh ? { "Cache-Control": "no-cache" } : undefined,
    })
    .then((response) => {
      const teams = unwrapTeams(response);
      const data = Array.isArray(teams) ? teams : [];

      teamTableCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + TEAM_TABLE_CACHE_TTL_MS,
        promise: null,
      });

      return data;
    })
    .catch((error) => {
      const current = teamTableCache.get(cacheKey);
      if (current?.promise === promise) {
        teamTableCache.delete(cacheKey);
      }
      throw error;
    });

  teamTableCache.set(cacheKey, {
    data: cached?.data || null,
    expiresAt: cached?.expiresAt || 0,
    promise,
  });

  return promise;
};

export const getTodaysPlayingTeamsApi = async (): Promise<TodaysPlayingTeam[]> => {
  const response = await http.get(withTournamentSlug(GET_TODAYS_PLAYING_TEAMS), {
    params: { _t: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  const teams = unwrapTeams(response);

  return Array.isArray(teams)
    ? teams.map(mapTodaysPlayingTeam)
    : [];
};

export const updateTeamTableApi = async (id: string | number, data: FormData) => {
  const response = await http.put(UPDATE_TEAM_DETAILS(id), data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  invalidateTeamTableCache();
  return response;
};

export const updateTeamPlayingApi = async (
  id: string | number,
  isPlaying: boolean,
) => {
  const response = await http.patch(UPDATE_TEAM_PLAYING(id), { isPlaying });
  invalidateTeamTableCache();
  return response;
};

export const deleteTeamTableApi = async (id: string | number) => {
  const response = await http.delete(DELETE_TEAM_DETAILS(id));
  invalidateTeamTableCache();
  return response;
};
