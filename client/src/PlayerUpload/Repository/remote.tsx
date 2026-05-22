import http from "../../AxiosFile/axios";
import {
  CREATE_PLAYER_UPLOAD,
  DELETE_PLAYER_BY_UID,
  DELETE_TEAM_PLAYERS,
  DELETE_PLAYER_UPLOAD,
  GET_PLAYER_BY_UID,
  GET_TEAM_PLAYERS_BY_TEAM_ID,
  GET_PLAYER_UPLOADS,
  UPDATE_PLAYER_BY_UID,
  UPDATE_TEAM_PLAYERS,
  UPDATE_PLAYER_UPLOAD,
} from "../../Routes/ApiRoutes/apiRoutes";

export const createPlayerUploadApi = async (data: FormData) => {
  const response = await http.post(CREATE_PLAYER_UPLOAD, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getPlayerUploadsApi = async () => {
  const response = await http.get(GET_PLAYER_UPLOADS);
  return response.data;
};

export const getTeamPlayersByTeamIdApi = async (teamId: string | number) => {
  const response = await http.get(GET_TEAM_PLAYERS_BY_TEAM_ID(teamId));
  return response.data;
};

export const getPlayerByUidApi = async (playerUid: string | number) => {
  const response = await http.get(GET_PLAYER_BY_UID(playerUid));
  return response.data;
};

export const updatePlayerUploadApi = async (
  playerUploadId: string | number,
  data: FormData,
) => {
  const response = await http.put(UPDATE_PLAYER_UPLOAD(playerUploadId), data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateTeamPlayersApi = async (
  playerUploadId: string | number,
  data: FormData,
) => {
  const response = await http.put(UPDATE_TEAM_PLAYERS(playerUploadId), data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updatePlayerByUidApi = async (
  playerUid: string | number,
  data: FormData,
) => {
  const response = await http.put(UPDATE_PLAYER_BY_UID(playerUid), data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deletePlayerUploadApi = async (playerUploadId: string | number) => {
  const response = await http.delete(DELETE_PLAYER_UPLOAD(playerUploadId));
  return response.data;
};

export const deleteTeamPlayersApi = async (teamId: string | number) => {
  const response = await http.delete(DELETE_TEAM_PLAYERS(teamId));
  return response.data;
};

export const deletePlayerByUidApi = async (playerUid: string | number) => {
  const response = await http.delete(DELETE_PLAYER_BY_UID(playerUid));
  return response.data;
};
