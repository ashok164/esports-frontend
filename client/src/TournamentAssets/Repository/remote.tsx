import http from "../../AxiosFile/axios";
import {
  CREATE_TOURNAMENT_ASSET,
  DELETE_TOURNAMENT_ASSET,
  GET_TOURNAMENT_ASSETS,
  UPDATE_TOURNAMENT_ASSET,
} from "../../Routes/ApiRoutes/apiRoutes";

export type TournamentAsset = {
  id: string | number;
  asset_id?: string;
  assetId?: string;
  name?: string;
  description?: string;
  active?: boolean | number | string;
  image_url?: string;
  imageUrl?: string;
  image?: string;
  path?: string;
  file_name?: string;
  filename?: string;
  created_at?: string;
  updated_at?: string;
};

export const getTournamentAssetId = (asset: TournamentAsset) => String(asset.asset_id || asset.assetId || "");

export const getTournamentAssetName = (asset: TournamentAsset) =>
  String(asset.name || asset.file_name || asset.filename || "Tournament Asset");

export const getTournamentAssetUrl = (asset?: TournamentAsset | null) =>
  String(asset?.image_url || asset?.imageUrl || asset?.image || asset?.path || "");

export const isTournamentAssetActive = (asset?: TournamentAsset | null) =>
  asset?.active === true || asset?.active === 1 || asset?.active === "1" || asset?.active === "true";

const getRows = (data: any) => {
  const rows = data?.data || data?.assets || data?.items || data?.records || data || [];
  return Array.isArray(rows) ? rows : [];
};

export const getTournamentAssetsApi = async (): Promise<TournamentAsset[]> => {
  const response = await http.get(GET_TOURNAMENT_ASSETS);
  return getRows(response?.data);
};

export const createTournamentAssetApi = async (data: FormData) => {
  const response = await http.post(CREATE_TOURNAMENT_ASSET, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data;
};

export const updateTournamentAssetApi = async (id: string | number, data: FormData) => {
  const response = await http.put(UPDATE_TOURNAMENT_ASSET(id), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data;
};

export const deleteTournamentAssetApi = async (id: string | number) => {
  const response = await http.delete(DELETE_TOURNAMENT_ASSET(id));
  return response?.data;
};
