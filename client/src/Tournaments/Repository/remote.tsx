import http from "../../AxiosFile/axios";
import {
  CREATE_TOURNAMENT,
  DELETE_TOURNAMENT,
  GET_TOURNAMENTS,
  UPDATE_TOURNAMENT,
} from "../../Routes/ApiRoutes/apiRoutes";

export type Tournament = {
  id?: string | number;
  name: string;
  slug: string;
  domain?: string;
  role?: string;
  isActive?: boolean;
  pullTournamentAssets?: boolean;
};

export type CreateTournamentPayload = {
  name: string;
  slug?: string;
  domain?: string;
  pullTournamentAssets?: boolean;
};

export type UpdateTournamentPayload = {
  name?: string;
  slug?: string;
  domain?: string;
  isActive?: boolean;
  pullTournamentAssets?: boolean;
};

const unwrapTournaments = (response: any): Tournament[] => {
  const data = response?.data?.data || response?.data?.tournaments || response?.data || [];
  return Array.isArray(data) ? data : [];
};

export const getTournamentsApi = async () => {
  const response = await http.get(GET_TOURNAMENTS, {
    params: { _t: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return unwrapTournaments(response);
};

export const createTournamentApi = async (payload: CreateTournamentPayload) => {
  const response = await http.post(CREATE_TOURNAMENT, payload);
  return response?.data?.data || response?.data?.tournament || response?.data;
};

export const updateTournamentApi = async (
  id: string | number,
  payload: UpdateTournamentPayload,
) => {
  const response = await http.patch(UPDATE_TOURNAMENT(id), payload);
  return response?.data?.data || response?.data?.tournament || response?.data;
};

export const deleteTournamentApi = async (id: string | number) => {
  const response = await http.delete(DELETE_TOURNAMENT(id));
  return response?.data?.data || response?.data?.tournament || response?.data;
};
