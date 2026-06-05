export const DEFAULT_TOURNAMENT_SLUG = "saggu-family";
export const SELECTED_TOURNAMENT_SLUG_KEY = "selected_tournament_slug";
export const SELECTED_TOURNAMENT_NAME_KEY = "selected_tournament_name";
export const TOURNAMENT_ROUTE_PREFIX = "/tournaments";

export const normalizeTournamentSlug = (value?: string | null) =>
  String(value || DEFAULT_TOURNAMENT_SLUG)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || DEFAULT_TOURNAMENT_SLUG;

export const getSelectedTournamentSlug = () => {
  if (typeof window === "undefined") return DEFAULT_TOURNAMENT_SLUG;
  return normalizeTournamentSlug(
    window.localStorage.getItem(SELECTED_TOURNAMENT_SLUG_KEY),
  );
};

export const setSelectedTournamentSlug = (slug: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SELECTED_TOURNAMENT_SLUG_KEY,
    normalizeTournamentSlug(slug),
  );
};

export const getSelectedTournamentName = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SELECTED_TOURNAMENT_NAME_KEY) || "";
};

export const setSelectedTournamentName = (name?: string | null) => {
  if (typeof window === "undefined") return;
  const cleanName = String(name || "").trim();
  if (cleanName) {
    window.localStorage.setItem(SELECTED_TOURNAMENT_NAME_KEY, cleanName);
  } else {
    window.localStorage.removeItem(SELECTED_TOURNAMENT_NAME_KEY);
  }
};

export const setSelectedTournament = (slug: string, name?: string | null) => {
  setSelectedTournamentSlug(slug);
  setSelectedTournamentName(name);
};

export const getTournamentPath = (path = "/routes", slug = getSelectedTournamentSlug()) => {
  const normalizedSlug = normalizeTournamentSlug(slug);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === TOURNAMENT_ROUTE_PREFIX) {
    return `${TOURNAMENT_ROUTE_PREFIX}/${normalizedSlug}`;
  }

  if (normalizedPath.startsWith(`${TOURNAMENT_ROUTE_PREFIX}/`)) {
    return normalizedPath;
  }

  return `${TOURNAMENT_ROUTE_PREFIX}/${normalizedSlug}${normalizedPath}`;
};
