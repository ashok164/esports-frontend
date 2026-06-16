import http from "../../AxiosFile/axios";

export type SpectatorPlayer = {
  uid: string;
  name: string;
  camUrl: string;
};

export type SpectatorGroupPayload = {
  groupId: string;
  spectIds: string[];
};

export type SpectatorGroup = {
  groupId: string;
  spectIds: string[];
  tournamentId?: string | number;
  createdAt?: string;
  updatedAt?: string;
};

export type SpectatorSnapshot = {
  success?: boolean;
  spectatorId: string;
  tournamentId?: string | number;
  latest: null | {
    spectatorId: string;
    matchId: string;
    playerId: string;
    name: string;
    camera: string;
  };
};

export type SpectatorResolvedCamera = {
  success?: boolean;
  spectatorId: string;
  matchId: string;
  playerId: string;
  name: string;
  camera: string;
};

export const createSpectatorGroupApi = async (payload: SpectatorGroupPayload) => {
  const response = await http.post("/api/spectator/create", payload);
  return response.data;
};

export const getSpectatorGroupsApi = async () => {
  const response = await http.get("/api/spectator/groups");
  return response.data as { success?: boolean; groups: SpectatorGroup[] };
};

export const updateSpectatorGroupApi = async (
  groupId: string,
  payload: SpectatorGroupPayload,
) => {
  const response = await http.put(`/api/spectator/groups/${encodeURIComponent(groupId)}`, payload);
  return response.data;
};

export const deleteSpectatorGroupApi = async (groupId: string) => {
  const response = await http.delete(`/api/spectator/groups/${encodeURIComponent(groupId)}`);
  return response.data;
};

export const getSpectatorSnapshotApi = async (spectId: string) => {
  const response = await http.get(`/api/spectator/${encodeURIComponent(spectId)}`);
  return response.data as SpectatorSnapshot;
};

export const resolveSpectatorApi = async (spectId: string) => {
  const response = await http.get(`/api/spectator/resolve/${encodeURIComponent(spectId)}`);
  return response.data;
};

export const getSpectatorPlayersApi = async () => {
  const response = await http.get("/api/spectator/players");
  return response.data as { success?: boolean; players: SpectatorPlayer[] };
};

export const seedSampleSpectatorApi = async () => {
  const response = await http.post("/api/spectator/seed-sample");
  return response.data;
};
