import http from "../../AxiosFile/axios";
import {
  CREATE_TOURNAMENT_LOGO,
  DELETE_TOURNAMENT_LOGO,
  GET_TOURNAMENT_LOGOS,
  UPDATE_TOURNAMENT_LOGO,
} from "../../Routes/ApiRoutes/apiRoutes";

export type TournamentLogo = {
  id: number | string;
  name?: string;
  tournamentName?: string;
  tournamentLogo?: string;
  logo?: string;
  logoUrl?: string;
  image?: string;
  image_url?: string;
  path?: string;
  filename?: string;
  file_name?: string;
  active: boolean | number | string;
  created_at?: string;
  updated_at?: string;
};

export const getTournamentLogoName = (logo: TournamentLogo) =>
  String(logo.name || logo.tournamentName || logo.file_name || logo.filename || "Tournament Logo");

export const getTournamentLogoUrl = (logo?: TournamentLogo | null) =>
  String(logo?.image_url || logo?.tournamentLogo || logo?.logoUrl || logo?.logo || logo?.image || logo?.path || "");

export const isTournamentLogoActive = (logo?: TournamentLogo | null) =>
  logo?.active === true || logo?.active === 1 || logo?.active === "1" || logo?.active === "true";

export const getTournamentLogosApi = async (): Promise<TournamentLogo[]> => {
  const response = await http.get(GET_TOURNAMENT_LOGOS);
  const rows = response?.data?.data || response?.data?.logos || response?.data || [];
  return Array.isArray(rows) ? rows : [];
};

export const createTournamentLogoApi = async (data: FormData) => {
  const response = await http.post(CREATE_TOURNAMENT_LOGO, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response?.data;
};

export const updateTournamentLogoApi = async (
  id: string | number,
  data: FormData | Partial<TournamentLogo>,
) => {
  const response = await http.put(UPDATE_TOURNAMENT_LOGO(id), data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });

  return response?.data;
};

export const deleteTournamentLogoApi = async (id: string | number) => {
  const response = await http.delete(DELETE_TOURNAMENT_LOGO(id));
  return response?.data;
};
