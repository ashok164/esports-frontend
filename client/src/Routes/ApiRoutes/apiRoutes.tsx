// export const API_BASE_URL = "http://82.29.155.252:3000";
export const API_BASE_URL = "http://localhost:3000";
export const REAL_TIME_API = "/tablestandings";
export const TEAMS = "/teams";
export const CREATE_TEAM_TABLE = "/api/teams/create";
export const GET_TEAM_DETAILS='/api/teams/all'
export const UPDATE_TEAM_DETAILS = (id: string | number) => `/api/teams/update/${id}`;
export const DELETE_TEAM_DETAILS = (id: string | number) => `/api/teams/delete/${id}`;
export const CREATE_PLAYER_UPLOAD = "/api/team-players";
export const GET_PLAYER_UPLOADS = "/api/view-team-player";
export const UPDATE_PLAYER_UPLOAD = (id: string | number) => `/api/team-players/${id}`;
export const DELETE_PLAYER_UPLOAD = (id: string | number) => `/api/team-players/${id}`;
