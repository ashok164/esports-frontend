// export const API_BASE_URL = "http://82.29.155.252:3000";
export const API_BASE_URL = "https://api.freefireesportsnepal.com";
// export const API_BASE_URL = "http://127.0.0.1:3000";
export const REAL_TIME_API = "/tablestandings";
export const GET_REALTIME_SETTINGS = "/settings";
export const UPDATE_REALTIME_SETTINGS = "/settings";
export const TEAMS = "/teams";
export const CREATE_TEAM_TABLE = "/api/teams/create";
export const GET_TEAM_DETAILS = "/api/teams/all";
export const GET_TODAYS_PLAYING_TEAMS = "/api/teams/todays-playing";
export const GET_BROADCAST_TEAM_ROSTER = (tournamentSlug?: string | null) =>
  tournamentSlug
    ? `/${encodeURIComponent(tournamentSlug)}/api/broadcast/team-roster`
    : "/api/broadcast/team-roster";
export const UPDATE_TEAM_DETAILS = (id: string | number) =>
  `/api/teams/update/${id}`;
export const UPDATE_TEAM_PLAYING = (id: string | number) =>
  `/api/teams/${id}/playing`;
export const DELETE_TEAM_DETAILS = (id: string | number) =>
  `/api/teams/delete/${id}`;
export const GET_COUNTRY_LOGOS = "/api/teams/country-logos";
export const CREATE_COUNTRY_LOGO = "/api/teams/country-logos";
export const UPDATE_COUNTRY_LOGO = (id: string | number) =>
  `/api/teams/country-logos/${id}`;
export const DELETE_COUNTRY_LOGO = (id: string | number) =>
  `/api/teams/country-logos/${id}`;
export const CREATE_TOURNAMENT_LOGO = "/api/tournamentLogo/create";
export const GET_TOURNAMENT_LOGOS = "/api/tournamentLogo/all";
export const UPDATE_TOURNAMENT_LOGO = (id: string | number) =>
  `/api/tournamentLogo/update/${id}`;
export const DELETE_TOURNAMENT_LOGO = (id: string | number) =>
  `/api/tournamentLogo/delete/${id}`;
export const GET_ZONE_SHRINK = "/api/zone-shrink";
export const CREATE_ZONE_SHRINK = "/api/zone-shrink";
export const UPDATE_ZONE_SHRINK = "/api/zone-shrink";
export const PATCH_ZONE_SHRINK = "/api/zone-shrink";
export const CREATE_FULL_TEAM_BANNER = "/api/fullTeamBanner/create";
export const GET_FULL_TEAM_BANNERS = "/api/fullTeamBanner/all";
export const UPDATE_FULL_TEAM_BANNER = (id: string | number) =>
  `/api/fullTeamBanner/update/${id}`;
export const DELETE_FULL_TEAM_BANNER = (id: string | number) =>
  `/api/fullTeamBanner/delete/${id}`;
export const CREATE_NOTIFICATION_TEAM_BANNER = "/api/notificationTeamBanner/create";
export const GET_NOTIFICATION_TEAM_BANNERS = "/api/notificationTeamBanner/all";
export const UPDATE_NOTIFICATION_TEAM_BANNER = (id: string | number) =>
  `/api/notificationTeamBanner/update/${id}`;
export const DELETE_NOTIFICATION_TEAM_BANNER = (id: string | number) =>
  `/api/notificationTeamBanner/delete/${id}`;
export const CREATE_TOURNAMENT_ASSET = "/api/tournamentAssets/create";
export const GET_TOURNAMENT_ASSETS = "/api/tournamentAssets/all";
export const UPDATE_TOURNAMENT_ASSET = (id: string | number) =>
  `/api/tournamentAssets/update/${id}`;
export const DELETE_TOURNAMENT_ASSET = (id: string | number) =>
  `/api/tournamentAssets/delete/${id}`;
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
export const BROADCAST_DISPLAY_SETTINGS = (tournamentSlug?: string | null) =>
  tournamentSlug
    ? `/${encodeURIComponent(tournamentSlug)}/api/broadcast-display-settings`
    : "/api/broadcast-display-settings";
export const GET_BROADCAST_DISPLAY_SETTINGS = BROADCAST_DISPLAY_SETTINGS();
export const UPDATE_BROADCAST_DISPLAY_SETTINGS = BROADCAST_DISPLAY_SETTINGS();
export const LOGIN_ADMIN = "/api/auth/login";
export const REGISTER_ADMIN = "/api/auth/register";
export const GET_AUTH_ME = "/api/auth/me";
export const GET_TOURNAMENTS = "/api/auth/tournaments";
export const CREATE_TOURNAMENT = "/api/auth/tournaments";
export const UPDATE_TOURNAMENT = (id: string | number) => `/api/auth/tournaments/${id}`;
export const DELETE_TOURNAMENT = (id: string | number) => `/api/auth/tournaments/${id}`;
export const GET_AUTH_USERS = "/api/auth/users";
export const UPDATE_AUTH_USER = (id: string | number) => `/api/auth/users/${id}`;
export const ASSIGN_USER_TOURNAMENT = (id: string | number) =>
  `/api/auth/users/${id}/tournaments`;
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
export const CREATE_GAME_DETAIL = "/api/game-details/create";
export const GET_GAME_DETAILS = "/api/game-details/all";
export const UPDATE_GAME_DETAIL = (id: string | number) =>
  `/api/game-details/update/${id}`;
export const DELETE_GAME_DETAIL = (id: string | number) =>
  `/api/game-details/delete/${id}`;
export const GET_CIRCLE_ANALYSIS = "/api/circle-analysis";
export const UPDATE_CIRCLE_ANALYSIS = "/api/circle-analysis";
export const FETCH_MATCH_RESULT_DATA = "/api/match_stats/match_data";
export const CREATE_RESULT = "/api/results/create";
export const SAVE_REALTIME_RESULT_BY_MATCH_IDS = "/api/results/from-realtime/by-match-ids";
export const GET_RESULT_BY_MATCH_ID = (matchId: string | number) =>
  `/api/results/${matchId}`;
export const GET_RESULT_TEAM_STATS = (matchId: string | number) =>
  `/api/results/team-stats/${matchId}`;
export const GET_RESULT_MVP = (matchId: string | number) =>
  `/api/results/mvp/${matchId}`;
export const GET_RESULT_TOP_FRAGGERS = (matchId: string | number) =>
  `/api/results/top-fraggers/${matchId}`;
export const GET_RESULT_BOOYAH = (matchId: string | number) =>
  `/api/results/booyah/${matchId}`;
export const GET_RESULTS_BY_MATCH_IDS = "/api/results/by-match-ids";
export const GET_RESULT_INVENTORY = "/api/results/inventory/all";
export const UPDATE_RESULT = (id: string | number) =>
  `/api/results/update/${id}`;
export const DELETE_RESULT = (id: string | number) =>
  `/api/results/delete/${id}`;
export const DELETE_RESULTS_BY_MATCH_ID = (matchId: string | number) =>
  `/api/results/${matchId}`;
export const SYNC_RESULTS_SHEET = "/api/results/sync-sheet";
