import http from "../../AxiosFile/axios";
import {
  GET_CIRCLE_ANALYSIS,
  UPDATE_CIRCLE_ANALYSIS,
} from "../../Routes/ApiRoutes/apiRoutes";
import { getTeamTableApi } from "../../TeamRecordTable/Repositary/remote";
import {
  CircleAnalysisResponse,
  CircleAnalysisTeam,
  TeamIdentityRecord,
} from "../types";

const STORAGE_KEY = "circle_analysis_response";
const CHANGE_EVENT = "circle-analysis-updated";
const DEFAULT_CIRCLES = [1, 2, 3, 4, 5, 6, 7, 8];

const getTeamId = (team: TeamIdentityRecord) => team.team_id || team.teamId || team.id || team._id || "";

const compareTeamId = (left: TeamIdentityRecord, right: TeamIdentityRecord) => {
  const leftId = getTeamId(left);
  const rightId = getTeamId(right);
  const leftNumber = Number(leftId);
  const rightNumber = Number(rightId);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return String(leftId).localeCompare(String(rightId), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const normalizeCircleNumber = (value: unknown, fallback = 8) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(8, Math.max(1, Math.round(parsed)));
};

const normalizeKills = (kills: unknown) => {
  const source = kills && typeof kills === "object" ? (kills as Record<string, unknown>) : {};

  return DEFAULT_CIRCLES.reduce<Record<number, number>>((acc, circle) => {
    const parsed = Number(source[circle] ?? source[String(circle)] ?? 0);
    acc[circle] = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
    return acc;
  }, {});
};

export const mapTeamToCircleAnalysis = (
  team: TeamIdentityRecord,
  saved?: Partial<CircleAnalysisTeam>,
): CircleAnalysisTeam => {
  const teamId = String(getTeamId(team) || saved?.teamId || "");
  const teamName = String(team.team_name || team.teamName || saved?.teamName || `Team ${teamId || ""}`).trim();
  const shortLabel = String(
    team.short_tag || team.shortTag || team.tag || saved?.shortLabel || teamName.slice(0, 3) || teamId,
  ).toUpperCase();

  return {
    teamId,
    teamName,
    shortLabel,
    logoUrl: String(team.team_logo || team.teamLogo || saved?.logoUrl || ""),
    countryLogoUrl: String(team.country_logo || team.countryLogo || saved?.countryLogoUrl || ""),
    isDead: saved?.isDead ?? false,
    hasBooyah: saved?.hasBooyah ?? false,
    lastCircle: normalizeCircleNumber(saved?.lastCircle, 8),
    killsPerCircle: normalizeKills(saved?.killsPerCircle),
  };
};

const normalizeResponse = (payload: any): CircleAnalysisResponse => {
  const teams = Array.isArray(payload?.teams) ? payload.teams : [];

  return {
    circles: Array.isArray(payload?.circles) && payload.circles.length ? payload.circles : DEFAULT_CIRCLES,
    teams: teams.map((team: CircleAnalysisTeam) => ({
      ...team,
      teamId: String(team.teamId || ""),
      teamName: String(team.teamName || "Unknown Team"),
      shortLabel: String(team.shortLabel || "TEAM").toUpperCase(),
      logoUrl: String(team.logoUrl || ""),
      countryLogoUrl: String(team.countryLogoUrl || ""),
      isDead: Boolean(team.isDead),
      hasBooyah: Boolean(team.hasBooyah),
      lastCircle: normalizeCircleNumber(team.lastCircle, 8),
      killsPerCircle: normalizeKills(team.killsPerCircle),
    })),
    updatedAt: String(payload?.updatedAt || new Date().toISOString()),
  };
};

const readStoredResponse = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeResponse(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
};

const writeStoredResponse = (payload: CircleAnalysisResponse) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: payload }));
};

export const getCircleAnalysisTeamsApi = async () => {
  const teams = await getTeamTableApi();
  return Array.isArray(teams) ? [...teams].sort(compareTeamId).slice(0, 12) : [];
};

export const buildCircleAnalysisFromTeams = (
  teams: TeamIdentityRecord[],
  savedResponse?: CircleAnalysisResponse | null,
): CircleAnalysisResponse => {
  const savedById = new Map(
    (savedResponse?.teams || []).map((team) => [String(team.teamId), team]),
  );

  return {
    circles: DEFAULT_CIRCLES,
    teams: teams.slice(0, 12).map((team) => {
      const teamId = String(getTeamId(team));
      return mapTeamToCircleAnalysis(team, savedById.get(teamId));
    }),
    updatedAt: savedResponse?.updatedAt || new Date().toISOString(),
  };
};

export const getCircleAnalysisApi = async () => {
  try {
    const response = await http.get(GET_CIRCLE_ANALYSIS);
    if (response?.data?.data || response?.data?.teams) {
      const normalized = normalizeResponse(response?.data?.data || response?.data);
      writeStoredResponse(normalized);
      return normalized;
    }
  } catch (err) {
    console.log("Circle analysis API fallback:", err);
  }

  const stored = readStoredResponse();
  if (stored) return stored;

  const teams = await getCircleAnalysisTeamsApi();
  const generated = buildCircleAnalysisFromTeams(teams);
  writeStoredResponse(generated);
  return generated;
};

export const updateCircleAnalysisApi = async (payload: CircleAnalysisResponse) => {
  const normalized = normalizeResponse({
    ...payload,
    updatedAt: new Date().toISOString(),
  });

  writeStoredResponse(normalized);

  try {
    const response = await http.put(UPDATE_CIRCLE_ANALYSIS, normalized);
    return response?.data?.data ? normalizeResponse(response.data.data) : normalized;
  } catch (err) {
    console.log("Circle analysis saved locally because API is unavailable:", err);
    return normalized;
  }
};

export const subscribeCircleAnalysisUpdates = (callback: (data: CircleAnalysisResponse) => void) => {
  const handleCustomEvent = (event: Event) => {
    callback(normalizeResponse((event as CustomEvent).detail));
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      callback(normalizeResponse(JSON.parse(event.newValue)));
    }
  };

  window.addEventListener(CHANGE_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
};
