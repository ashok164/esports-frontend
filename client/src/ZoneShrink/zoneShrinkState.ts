import http from "../AxiosFile/axios";
import {
  CREATE_ZONE_SHRINK,
  GET_ZONE_SHRINK,
  PATCH_ZONE_SHRINK,
  UPDATE_ZONE_SHRINK,
} from "../Routes/ApiRoutes/apiRoutes";

export const ZONE_SHRINK_UPDATED_EVENT = "zone-shrink-updated";
export const ZONE_SHRINK_STORAGE_KEY = "zone_shrink_trigger";

export type ZoneShrinkState = {
  enabled: boolean;
  triggerId: number;
  durationSeconds: number;
  playSound: boolean;
  updatedAt?: string;
};

export const defaultZoneShrinkState: ZoneShrinkState = {
  enabled: false,
  triggerId: 0,
  durationSeconds: 10,
  playSound: true,
};

export const getZoneShrinkState = (): ZoneShrinkState => {
  try {
    const raw = localStorage.getItem(ZONE_SHRINK_STORAGE_KEY);
    if (!raw) return defaultZoneShrinkState;
    return { ...defaultZoneShrinkState, ...JSON.parse(raw) };
  } catch {
    return defaultZoneShrinkState;
  }
};

export const setZoneShrinkState = (state: ZoneShrinkState) => {
  localStorage.setItem(ZONE_SHRINK_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(ZONE_SHRINK_UPDATED_EVENT));
};

const mapZoneShrinkResponse = (data: any): ZoneShrinkState => {
  const row = data?.data || data || {};
  const currentState = getZoneShrinkState();
  const active = row.active === true || row.active === 1 || row.active === "1" || row.active === "true";
  const updatedAt = String(row.updated_at || row.updatedAt || "");

  return {
    ...defaultZoneShrinkState,
    ...currentState,
    enabled: active,
    updatedAt,
    triggerId: active && updatedAt ? new Date(updatedAt).getTime() || currentState.triggerId : currentState.triggerId,
  };
};

export const getZoneShrinkApi = async (): Promise<ZoneShrinkState> => {
  const response = await http.get(GET_ZONE_SHRINK);
  return mapZoneShrinkResponse(response?.data);
};

export const createZoneShrinkApi = async (active: boolean): Promise<ZoneShrinkState> => {
  const response = await http.post(CREATE_ZONE_SHRINK, { active });
  return mapZoneShrinkResponse(response?.data);
};

export const updateZoneShrinkApi = async (active: boolean): Promise<ZoneShrinkState> => {
  const response = await http.put(UPDATE_ZONE_SHRINK, { active });
  return mapZoneShrinkResponse(response?.data);
};

export const patchZoneShrinkApi = async (active: boolean): Promise<ZoneShrinkState> => {
  const response = await http.patch(PATCH_ZONE_SHRINK, { active });
  return mapZoneShrinkResponse(response?.data);
};
