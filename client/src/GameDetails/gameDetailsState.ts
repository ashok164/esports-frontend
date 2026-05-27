export type GameDetail = {
  id?: string | number;
  _id?: string | number;
  gameNumber: string;
  roundName: string;
  phase: string;
  matchId: string;
  enabled?: boolean;
  resultEnabled?: boolean;
  todaysResultEnabled?: boolean;
  leagueStageResultEnabled?: boolean;
};

export type ActiveGameDetails = {
  matchIds: string;
  gameNumber: string;
  roundName: string;
  phase: string;
};

export const GAME_DETAILS_STORAGE_KEY = "tournament_game_details";
export const ACTIVE_GAME_DETAILS_STORAGE_KEY = "tournament_active_game_details";
export const GAME_DETAILS_UPDATED_EVENT = "tournament-game-details-updated";

export const DEFAULT_ACTIVE_GAME_DETAILS: ActiveGameDetails = {
  matchIds: "1865398120330647552",
  gameNumber: "1",
  roundName: "Grand Finals",
  phase: "Champion Rush",
};

const isBrowser = () => typeof window !== "undefined";

export const getGameRecordId = (game: GameDetail) => game.id || game._id;

export const normalizeGameDetail = (game: any): GameDetail => ({
  id: game?.id,
  _id: game?._id,
  gameNumber: String(game?.gameNumber ?? game?.game_number ?? ""),
  roundName: String(game?.roundName ?? game?.round_name ?? ""),
  phase: String(game?.phase ?? ""),
  matchId: String(game?.matchId ?? game?.match_id ?? ""),
  enabled: Boolean(game?.enabled ?? game?.is_enabled ?? false),
  resultEnabled: Boolean(game?.resultEnabled ?? game?.result_enabled ?? false),
  todaysResultEnabled: Boolean(game?.todaysResultEnabled ?? game?.todays_result_enabled ?? false),
  leagueStageResultEnabled: Boolean(game?.leagueStageResultEnabled ?? game?.league_stage_result_enabled ?? false),
});

export const readStoredGameDetails = (): GameDetail[] => {
  if (!isBrowser()) return [];

  try {
    const stored = window.localStorage.getItem(GAME_DETAILS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeGameDetail) : [];
  } catch {
    return [];
  }
};

export const writeStoredGameDetails = (games: GameDetail[]) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(GAME_DETAILS_STORAGE_KEY, JSON.stringify(games));
};

export const getActiveGameDetails = (): ActiveGameDetails => {
  if (!isBrowser()) return DEFAULT_ACTIVE_GAME_DETAILS;

  try {
    const stored = window.localStorage.getItem(ACTIVE_GAME_DETAILS_STORAGE_KEY);
    if (!stored) return DEFAULT_ACTIVE_GAME_DETAILS;

    const parsed = JSON.parse(stored);
    return {
      matchIds: String(parsed?.matchIds || DEFAULT_ACTIVE_GAME_DETAILS.matchIds),
      gameNumber: String(parsed?.gameNumber || DEFAULT_ACTIVE_GAME_DETAILS.gameNumber),
      roundName: String(parsed?.roundName || DEFAULT_ACTIVE_GAME_DETAILS.roundName),
      phase: String(parsed?.phase || DEFAULT_ACTIVE_GAME_DETAILS.phase),
    };
  } catch {
    return DEFAULT_ACTIVE_GAME_DETAILS;
  }
};

export const getResultGameDetails = (): ActiveGameDetails => {
  const games = readStoredGameDetails().filter((game) => game.matchId.trim());
  const resultGame = games.find((game) => game.resultEnabled);

  if (!resultGame) {
    return {
      ...getActiveGameDetails(),
      matchIds: "",
    };
  }

  return {
    matchIds: resultGame.matchId.trim(),
    gameNumber: resultGame.gameNumber || DEFAULT_ACTIVE_GAME_DETAILS.gameNumber,
    roundName: resultGame.roundName || DEFAULT_ACTIVE_GAME_DETAILS.roundName,
    phase: resultGame.phase || DEFAULT_ACTIVE_GAME_DETAILS.phase,
  };
};

export const getTodaysResultGameDetails = (): ActiveGameDetails => {
  const games = readStoredGameDetails().filter((game) => game.todaysResultEnabled && game.matchId.trim());

  return {
    ...getActiveGameDetails(),
    matchIds: games.map((game) => game.matchId.trim()).join(","),
  };
};

export const getLeagueStageResultGameDetails = (): ActiveGameDetails => {
  const games = readStoredGameDetails().filter((game) => game.leagueStageResultEnabled && game.matchId.trim());

  return {
    ...getActiveGameDetails(),
    matchIds: games.map((game) => game.matchId.trim()).join(","),
  };
};

export const publishActiveGameDetails = (games: GameDetail[]) => {
  if (!isBrowser()) return;

  const enabledGames = games.filter((game) => game.enabled && game.matchId.trim());
  const primaryGame = enabledGames[0] || games[0];

  const activeDetails: ActiveGameDetails = {
    matchIds:
      enabledGames.map((game) => game.matchId.trim()).filter(Boolean).join(",") ||
      DEFAULT_ACTIVE_GAME_DETAILS.matchIds,
    gameNumber: primaryGame?.gameNumber || DEFAULT_ACTIVE_GAME_DETAILS.gameNumber,
    roundName: primaryGame?.roundName || DEFAULT_ACTIVE_GAME_DETAILS.roundName,
    phase: primaryGame?.phase || DEFAULT_ACTIVE_GAME_DETAILS.phase,
  };

  writeStoredGameDetails(games);
  window.localStorage.setItem(
    ACTIVE_GAME_DETAILS_STORAGE_KEY,
    JSON.stringify(activeDetails),
  );
  window.dispatchEvent(new CustomEvent(GAME_DETAILS_UPDATED_EVENT, { detail: activeDetails }));
};
