import http from "../../AxiosFile/axios";
import {
  CREATE_GAME_DETAIL,
  DELETE_GAME_DETAIL,
  DELETE_MATCH_TEAM_MAPPING,
  DELETE_MATCH_TEAM_MAPPINGS,
  GET_ALL_MATCH_TEAM_MAPPINGS,
  GET_GAME_DETAILS,
  GET_MATCH_TEAM_MAPPINGS,
  REPLACE_MATCH_TEAM_MAPPINGS,
  UPDATE_GAME_DETAIL,
} from "../../Routes/ApiRoutes/apiRoutes";
import { GameDetail } from "../gameDetailsState";

const toPayload = (game: GameDetail) => ({
  gameNumber: game.gameNumber,
  roundName: game.roundName,
  phase: game.phase,
  matchId: game.matchId,
  enabled: Boolean(game.enabled),
  resultEnabled: Boolean(game.resultEnabled),
  todaysResultEnabled: Boolean(game.todaysResultEnabled),
  leagueStageResultEnabled: Boolean(game.leagueStageResultEnabled),
});

const unwrapGameDetails = (response: any) => {
  const data = response?.data;
  return data?.data || data?.games || data?.gameDetails || data || [];
};

export const createGameDetailApi = async (game: GameDetail) => {
  const response = await http.post(CREATE_GAME_DETAIL, toPayload(game));
  return response?.data;
};

export const getGameDetailsApi = async () => {
  const response = await http.get(GET_GAME_DETAILS);
  return unwrapGameDetails(response);
};

export const updateGameDetailApi = async (id: string | number, game: GameDetail) => {
  const response = await http.put(UPDATE_GAME_DETAIL(id), toPayload(game));
  return response?.data;
};

export const deleteGameDetailApi = async (id: string | number) => {
  const response = await http.delete(DELETE_GAME_DETAIL(id));
  return response?.data;
};

export const getMatchTeamMappingsApi = async (matchId: string | number) => {
  const response = await http.get(GET_MATCH_TEAM_MAPPINGS(matchId));
  return response?.data?.data || [];
};

export const getAllMatchTeamMappingsApi = async () => {
  const response = await http.get(GET_ALL_MATCH_TEAM_MAPPINGS);
  return response?.data?.data || [];
};

export const replaceMatchTeamMappingsApi = async (
  matchId: string | number,
  mappings: Array<{
    roomTeamId: string | number;
    permanentTeamId: string | number;
    slotNumber?: number;
  }>,
) => {
  const response = await http.put(REPLACE_MATCH_TEAM_MAPPINGS(matchId), {
    mappings,
  });
  return response?.data;
};

export const deleteMatchTeamMappingApi = async (
  matchId: string | number,
  roomTeamId: string | number,
) => {
  const response = await http.delete(DELETE_MATCH_TEAM_MAPPING(matchId, roomTeamId));
  return response?.data;
};

export const deleteMatchTeamMappingsApi = async (matchId: string | number) => {
  const response = await http.delete(DELETE_MATCH_TEAM_MAPPINGS(matchId));
  return response?.data;
};
