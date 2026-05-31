import http from "../../AxiosFile/axios";
import {
  CREATE_FULL_TEAM_BANNER,
  CREATE_NOTIFICATION_TEAM_BANNER,
  DELETE_FULL_TEAM_BANNER,
  DELETE_NOTIFICATION_TEAM_BANNER,
  GET_FULL_TEAM_BANNERS,
  GET_NOTIFICATION_TEAM_BANNERS,
  UPDATE_FULL_TEAM_BANNER,
  UPDATE_NOTIFICATION_TEAM_BANNER,
} from "../../Routes/ApiRoutes/apiRoutes";

export type TeamBanner = {
  id: string | number;
  name?: string;
  teamName?: string;
  title?: string;
  image_url?: string;
  banner_url?: string;
  bannerUrl?: string;
  fullTeamBanner?: string;
  notificationTeamBanner?: string;
  image?: string;
  path?: string;
  file_name?: string;
  filename?: string;
  team_id?: string | number;
  teamId?: string | number;
  description?: string;
  active?: boolean | number | string;
  created_at?: string;
  updated_at?: string;
};

export type TeamBannerKind = "full" | "notification";

const getRoutes = (kind: TeamBannerKind) =>
  kind === "full"
    ? {
        create: CREATE_FULL_TEAM_BANNER,
        get: GET_FULL_TEAM_BANNERS,
        update: UPDATE_FULL_TEAM_BANNER,
        delete: DELETE_FULL_TEAM_BANNER,
        fileField: "image",
      }
    : {
        create: CREATE_NOTIFICATION_TEAM_BANNER,
        get: GET_NOTIFICATION_TEAM_BANNERS,
        update: UPDATE_NOTIFICATION_TEAM_BANNER,
        delete: DELETE_NOTIFICATION_TEAM_BANNER,
        fileField: "image",
      };

export const getTeamBannerName = (banner: TeamBanner) =>
  String(banner.name || banner.teamName || banner.title || banner.file_name || banner.filename || "Team Banner");

export const getTeamBannerUrl = (banner?: TeamBanner | null) =>
  String(
    banner?.image_url ||
      banner?.banner_url ||
      banner?.bannerUrl ||
      banner?.fullTeamBanner ||
      banner?.notificationTeamBanner ||
      banner?.image ||
      banner?.path ||
      "",
  );

export const getTeamBannersApi = async (kind: TeamBannerKind): Promise<TeamBanner[]> => {
  const response = await http.get(getRoutes(kind).get);
  const rows = response?.data?.data || response?.data?.banners || response?.data || [];
  return Array.isArray(rows) ? rows : [];
};

export const createTeamBannerApi = async (kind: TeamBannerKind, data: FormData) => {
  const response = await http.post(getRoutes(kind).create, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data;
};

export const updateTeamBannerApi = async (kind: TeamBannerKind, id: string | number, data: FormData) => {
  const response = await http.put(getRoutes(kind).update(id), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data;
};

export const deleteTeamBannerApi = async (kind: TeamBannerKind, id: string | number) => {
  const response = await http.delete(getRoutes(kind).delete(id));
  return response?.data;
};

export const getTeamBannerFileField = (kind: TeamBannerKind) => getRoutes(kind).fileField;
