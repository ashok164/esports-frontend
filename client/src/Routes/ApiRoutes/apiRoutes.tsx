// export const API_BASE_URL = "http://82.29.155.252:3000";
// export const API_BASE_URL = "https://api.freefireesportsnepal.com";
export const API_BASE_URL = "http://localhost:3000";
export const REAL_TIME_API = "/tablestandings";
export const TEAMS = "/teams";
export const CREATE_TEAM_TABLE = "/api/teams/create";
export const GET_TEAM_DETAILS = "/api/teams/all";
export const UPDATE_TEAM_DETAILS = (id: string | number) =>
  `/api/teams/update/${id}`;
export const DELETE_TEAM_DETAILS = (id: string | number) =>
  `/api/teams/delete/${id}`;
export const CREATE_PLAYER_UPLOAD = "/team-players";
export const GET_PLAYER_UPLOADS = "/view-team-player";
export const UPDATE_PLAYER_UPLOAD = (id: string | number) =>
  `/team-players/${id}`;
export const DELETE_PLAYER_UPLOAD = (id: string | number) =>
  `/team-players/${id}`;
export const GET_TEAM_PLAYERS_BY_TEAM_ID = (teamId: string | number) =>
  `/team-players/by-team-id/${teamId}`;
export const UPDATE_TEAM_PLAYERS = (id: string | number) =>
  `/team-players/${id}`;
export const DELETE_TEAM_PLAYERS = (id: string | number) =>
  `/team-players/by-team-id/${id}`;
export const GET_PLAYER_BY_UID = (playerUid: string | number) =>
  `/team-players/by-player-uid/${playerUid}`;
export const UPDATE_PLAYER_BY_UID = (playerUid: string | number) =>
  `/team-players/by-player-uid/${playerUid}`;
export const DELETE_PLAYER_BY_UID = (playerUid: string | number) =>
  `/team-players/by-player-uid/${playerUid}`;
export const GET_PROJECT_COLOR_THEME = "/api/theme/colors";
export const CREATE_PROJECT_COLOR_THEME = "/api/theme/colors";
export const UPDATE_PROJECT_COLOR_THEME = "/api/theme/colors";
export const PATCH_PROJECT_COLOR_THEME = "/api/theme/colors";
export const LOGIN_ADMIN = "/api/auth/login";
export const REGISTER_ADMIN = "/api/auth/register";
export const GET_AUTH_ME = "/api/auth/me";
export const CREATE_WEAPON_UPLOAD = "/api/weapons/create";
export const GET_WEAPON_UPLOADS = "/api/weapons/all";
export const UPDATE_WEAPON_UPLOAD = (id: string | number) =>
  `/api/weapons/update/${id}`;
export const DELETE_WEAPON_UPLOAD = (id: string | number) =>
  `/api/weapons/delete/${id}`;
export const CREATE_CHARACTER_UPLOAD = "/api/characters/create";
export const GET_CHARACTER_UPLOADS = "/api/characters/all";
export const UPDATE_CHARACTER_UPLOAD = (id: string | number) =>
  `/api/characters/update/${id}`;
export const DELETE_CHARACTER_UPLOAD = (id: string | number) =>
  `/api/characters/delete/${id}`;
export const CREATE_SKILL_UPLOAD = "/api/skills/create";
export const GET_SKILL_UPLOADS = "/api/skills/all";
export const UPDATE_SKILL_UPLOAD = (id: string | number) =>
  `/api/skills/update/${id}`;
export const DELETE_SKILL_UPLOAD = (id: string | number) =>
  `/api/skills/delete/${id}`;
export const CREATE_ROLE_UPLOAD = "/api/roles/create";
export const GET_ROLE_UPLOADS = "/api/roles/all";
export const UPDATE_ROLE_UPLOAD = (id: string | number) =>
  `/api/roles/update/${id}`;
export const DELETE_ROLE_UPLOAD = (id: string | number) =>
  `/api/roles/delete/${id}`;
export const CREATE_EQUIPMENT_UPLOAD = "/api/equipment/create";
export const GET_EQUIPMENT_UPLOADS = "/api/equipment/all";
export const UPDATE_EQUIPMENT_UPLOAD = (id: string | number) =>
  `/api/equipment/update/${id}`;
export const DELETE_EQUIPMENT_UPLOAD = (id: string | number) =>
  `/api/equipment/delete/${id}`;
