import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createGlobalStyle } from "styled-components";
import http from "../AxiosFile/axios";
import { BROADCAST_DISPLAY_SETTINGS, GET_BROADCAST_DISPLAY_SETTINGS, GET_PROJECT_COLOR_THEME } from "../Routes/ApiRoutes/apiRoutes";
import { getSelectedTournamentSlug } from "../Tournaments/tournamentState";

export type ProjectColorTheme = {
  useDefaultColors: boolean;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

export type BroadcastThemePreset = "theme1" | "theme2" | "theme3";

export type MatchNumberImageEntry = {
  id: string;
  gameNumber: string;
  name: string;
  imageUrl: string;
};

export type TeamEliminationImageEntry = {
  id: string;
  teamId: string;
  teamName: string;
  imageUrl: string;
};

type ProjectThemeContextValue = {
  theme: ProjectColorTheme;
  isCustomTheme: boolean;
  isLoading: boolean;
  broadcastSettings: BroadcastDisplaySettings;
};

export type BroadcastDisplaySettings = {
  broadcastThemeEnabled: boolean;
  selectedBroadcastTheme: BroadcastThemePreset;
  selectedBroadcastStyle: BroadcastThemePreset;
  championRushEnabled: boolean;
  matchNumberImageEnabled: boolean;
  teamEliminationImageEnabled: boolean;
  matchNumberImageUrl: string;
  teamEliminationImageUrl: string;
  matchNumberImageEntries: MatchNumberImageEntry[];
  teamEliminationImageEntries: TeamEliminationImageEntry[];
  showCountryFlags: boolean;
  showLiveStandingsPoints: boolean;
  showRosterTeamLogos: boolean;
  rosterPageSwitch: boolean;
  liveStandings2Color1: string;
  liveStandings2Color2: string;
  liveStandings2Color3: string;
  liveStandings2Color4: string;
  liveStandings2Color5: string;
  liveStandings2TextColor1: string;
  liveStandings2TextColor2: string;
  liveStandings2TextColor3: string;
  liveStandings2TextColor4: string;
};

export const BROADCAST_DISPLAY_SETTINGS_KEY = "broadcast_display_settings";
export const BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT = "broadcast-display-settings-updated";
export const DEFAULT_BROADCAST_DISPLAY_SETTINGS: BroadcastDisplaySettings = {
  broadcastThemeEnabled: true,
  selectedBroadcastTheme: "theme1",
  selectedBroadcastStyle: "theme1",
  championRushEnabled: true,
  matchNumberImageEnabled: false,
  teamEliminationImageEnabled: false,
  matchNumberImageUrl: "",
  teamEliminationImageUrl: "",
  matchNumberImageEntries: [],
  teamEliminationImageEntries: [],
  showCountryFlags: true,
  showLiveStandingsPoints: true,
  showRosterTeamLogos: true,
  rosterPageSwitch: false,
  liveStandings2Color1: "#022024",
  liveStandings2Color2: "#ffffff",
  liveStandings2Color3: "#044b52",
  liveStandings2Color4: "#011316",
  liveStandings2Color5: "#f04a18",
  liveStandings2TextColor1: "#ffffff",
  liveStandings2TextColor2: "#0a1719",
  liveStandings2TextColor3: "#01e6f1",
  liveStandings2TextColor4: "#ffffff",
};

const isBroadcastStyle = (value: unknown): value is BroadcastThemePreset =>
  value === "theme1" || value === "theme2" || value === "theme3";

const normalizeMatchNumberImageEntries = (value: unknown): MatchNumberImageEntry[] =>
  Array.isArray(value)
    ? value
        .map((item, index) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const gameNumber = String(row.gameNumber ?? "").trim();
          const imageUrl = String(row.imageUrl ?? "").trim();
          const name = String(row.name ?? "").trim();

          if (!gameNumber || !imageUrl) return null;

          return {
            id: String(row.id ?? `match-number-${index}`),
            gameNumber,
            name,
            imageUrl,
          };
        })
        .filter((item): item is MatchNumberImageEntry => Boolean(item))
    : [];

const normalizeTeamEliminationImageEntries = (value: unknown): TeamEliminationImageEntry[] =>
  Array.isArray(value)
    ? value
        .map((item, index) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const teamId = String(row.teamId ?? "").trim();
          const teamName = String(row.teamName ?? "").trim();
          const imageUrl = String(row.imageUrl ?? "").trim();

          if ((!teamId && !teamName) || !imageUrl) return null;

          return {
            id: String(row.id ?? `team-elimination-${index}`),
            teamId,
            teamName,
            imageUrl,
          };
        })
        .filter((item): item is TeamEliminationImageEntry => Boolean(item))
    : [];

export const normalizeBroadcastDisplaySettings = (value: unknown): BroadcastDisplaySettings => {
  const settings = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const selectedStyle = settings.selectedBroadcastStyle ?? settings.selectedBroadcastTheme;
  const style = isBroadcastStyle(selectedStyle) ? selectedStyle : "theme1";
  return {
    ...DEFAULT_BROADCAST_DISPLAY_SETTINGS,
    ...settings,
    selectedBroadcastTheme: style,
    selectedBroadcastStyle: style,
    matchNumberImageEntries: normalizeMatchNumberImageEntries(settings.matchNumberImageEntries),
    teamEliminationImageEntries: normalizeTeamEliminationImageEntries(settings.teamEliminationImageEntries),
  } as BroadcastDisplaySettings;
};

export const mergeBroadcastDisplaySettings = (
  savedSettings: BroadcastDisplaySettings,
  responseSettings: unknown,
): BroadcastDisplaySettings => {
  const remote = responseSettings && typeof responseSettings === "object"
    ? responseSettings as Record<string, unknown>
    : {};
  const remoteStyle = remote.selectedBroadcastStyle ?? remote.selectedBroadcastTheme;

  return normalizeBroadcastDisplaySettings({
    ...savedSettings,
    ...remote,
    ...(isBroadcastStyle(remoteStyle)
      ? { selectedBroadcastStyle: remoteStyle, selectedBroadcastTheme: remoteStyle }
      : {}),
  });
};

export const getBroadcastDisplaySettings = (): BroadcastDisplaySettings => {
  try {
    return normalizeBroadcastDisplaySettings(JSON.parse(localStorage.getItem(BROADCAST_DISPLAY_SETTINGS_KEY) || "{}"));
  } catch {
    return DEFAULT_BROADCAST_DISPLAY_SETTINGS;
  }
};

export const setBroadcastDisplaySettings = (settings: BroadcastDisplaySettings) => {
  localStorage.setItem(BROADCAST_DISPLAY_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, { detail: settings }));
};

export const DEFAULT_PROJECT_THEME: ProjectColorTheme = {
  useDefaultColors: true,
  primary: "#ef4444",
  secondary: "#38bdf8",
  accent: "#bfff00",
  background: "#0b0f19",
  surface: "#111827",
  surfaceAlt: "#1f293d",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textInverse: "#050505",
  border: "#334155",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export const BROADCAST_THEME_PRESETS: Record<BroadcastThemePreset, ProjectColorTheme> = {
  theme1: {
    useDefaultColors: false,
    primary: "#007f86",
    secondary: "#ff3d0d",
    accent: "#57f06a",
    background: "#071817",
    surface: "#102f34",
    surfaceAlt: "#f4f7ef",
    textPrimary: "#ffffff",
    textSecondary: "#d6ece8",
    textInverse: "#111827",
    border: "#1bc3b7",
    success: "#57f06a",
    warning: "#ffb000",
    danger: "#ff3d0d",
  },
  theme2: {
    useDefaultColors: false,
    primary: "#7c3aed",
    secondary: "#14b8a6",
    accent: "#facc15",
    background: "#090518",
    surface: "#1b1038",
    surfaceAlt: "#2e1b5b",
    textPrimary: "#ffffff",
    textSecondary: "#c4b5fd",
    textInverse: "#08020f",
    border: "#6d28d9",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  theme3: {
    useDefaultColors: false,
    primary: "#0ea5e9",
    secondary: "#111827",
    accent: "#f97316",
    background: "#020617",
    surface: "#0f172a",
    surfaceAlt: "#1e293b",
    textPrimary: "#f8fafc",
    textSecondary: "#bae6fd",
    textInverse: "#020617",
    border: "#38bdf8",
    success: "#10b981",
    warning: "#f97316",
    danger: "#dc2626",
  },
};

const ProjectThemeContext = createContext<ProjectThemeContextValue>({
  theme: DEFAULT_PROJECT_THEME,
  isCustomTheme: false,
  isLoading: false,
  broadcastSettings: DEFAULT_BROADCAST_DISPLAY_SETTINGS,
});

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

const normalizeHex = (value: string) => {
  const color = value.trim();
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
  }

  return color.toLowerCase();
};

const hexToRgb = (hex: string) => {
  const color = normalizeHex(hex).replace("#", "");
  const value = parseInt(color, 16);

  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
};

const sanitizeTheme = (payload: Partial<ProjectColorTheme> | null | undefined): ProjectColorTheme => {
  if (!payload || payload.useDefaultColors !== false) {
    return DEFAULT_PROJECT_THEME;
  }

  const nextTheme = { ...DEFAULT_PROJECT_THEME, useDefaultColors: false };
  const colorKeys: Array<keyof Omit<ProjectColorTheme, "useDefaultColors">> = [
    "primary",
    "secondary",
    "accent",
    "background",
    "surface",
    "surfaceAlt",
    "textPrimary",
    "textSecondary",
    "textInverse",
    "border",
    "success",
    "warning",
    "danger",
  ];

  colorKeys.forEach((key) => {
    const value = payload[key];
    if (isHexColor(value)) {
      nextTheme[key] = normalizeHex(value);
    }
  });

  return nextTheme;
};

const ProjectThemeGlobalStyle = createGlobalStyle<{ $theme: ProjectColorTheme; $custom: boolean }>`
  :root {
    --project-primary: ${({ $theme }) => $theme.primary};
    --project-secondary: ${({ $theme }) => $theme.secondary};
    --project-accent: ${({ $theme }) => $theme.accent};
    --project-tertiary: ${({ $theme }) => $theme.accent};
    --project-background: ${({ $theme }) => $theme.background};
    --project-surface: ${({ $theme }) => $theme.surface};
    --project-surface-alt: ${({ $theme }) => $theme.surfaceAlt};
    --project-text-primary: ${({ $theme }) => $theme.textPrimary};
    --project-text-secondary: ${({ $theme }) => $theme.textSecondary};
    --project-text-inverse: ${({ $theme }) => $theme.textInverse};
    --project-text-tertiary: ${({ $theme }) => $theme.textInverse};
    --project-border: ${({ $theme }) => $theme.border};
    --project-success: ${({ $theme }) => $theme.success};
    --project-warning: ${({ $theme }) => $theme.warning};
    --project-danger: ${({ $theme }) => $theme.danger};
    --project-primary-rgb: ${({ $theme }) => hexToRgb($theme.primary)};
    --project-secondary-rgb: ${({ $theme }) => hexToRgb($theme.secondary)};
    --project-accent-rgb: ${({ $theme }) => hexToRgb($theme.accent)};
    --project-danger-rgb: ${({ $theme }) => hexToRgb($theme.danger)};
  }

  body[data-show-country-flags="false"] img:is([alt*="Country" i], [alt*="Flag" i]) {
    display: none !important;
  }

  body[data-show-live-standings-points="false"] [data-live-standings-points="true"] {
    display: none !important;
  }

  ${({ $theme, $custom }) =>
    $custom
      ? `
    html,
    #root,
    body[data-broadcast-route="true"] {
      background: transparent !important;
    }

    body[data-broadcast-route="false"],
    body:not([data-broadcast-route]) {
      background: var(--project-background) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) {
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(main, section, article, table, thead, tbody, tr, td, th, div) {
      border-color: var(--project-border);
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(h1, h2, h3, h4, h5, h6, label, strong, td, th, button) {
      color: var(--project-text-primary);
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(p, small) {
      color: var(--project-text-secondary);
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(button, input, select, textarea) {
      border-color: var(--project-border) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(button:not(:disabled), a, input[type="checkbox"], input[type="radio"]) {
      accent-color: var(--project-primary);
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(input, select, textarea) {
      background-color: var(--project-surface) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(input:focus, select:focus, textarea:focus, button:focus-visible, a:focus-visible) {
      outline-color: var(--project-accent) !important;
      border-color: var(--project-accent) !important;
    }

    body[data-project-theme="custom"][data-broadcast-route="false"] [data-theme-surface="page"],
    body[data-project-theme="custom"]:not([data-broadcast-route]) [data-theme-surface="page"] {
      background: var(--project-background) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) [data-theme-surface="panel"],
    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) [data-theme-surface="card"] {
      background: var(--project-surface) !important;
      border-color: var(--project-border) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) [data-theme-accent="primary"] {
      color: var(--project-primary) !important;
      border-color: var(--project-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) [data-theme-accent="secondary"] {
      color: var(--project-secondary) !important;
      border-color: var(--project-secondary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) [data-theme-accent="danger"] {
      color: var(--project-danger) !important;
      border-color: var(--project-danger) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(button:not(:disabled), [role="button"]) {
      border-color: var(--project-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) button:not(:disabled):not([data-theme-variant="ghost"]) {
      background-color: var(--project-primary) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) a {
      color: var(--project-secondary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(.theme-primary, [data-theme-fill="primary"]) {
      background: var(--project-primary) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(.theme-secondary, [data-theme-fill="secondary"]) {
      background: var(--project-secondary) !important;
      color: var(--project-text-inverse) !important;
    }

    body[data-project-theme="custom"]:not([data-live-standings-route="true"]) :is(.theme-accent, [data-theme-fill="accent"]) {
      background: var(--project-accent) !important;
      color: var(--project-text-inverse) !important;
    }

    body[data-project-theme="custom"][data-broadcast-route="true"],
    body[data-project-theme="custom"][data-broadcast-route="true"] #root {
      background: transparent !important;
    }

    body[data-project-theme="custom"][data-broadcast-route="true"] :is(main, section, article) {
      background-color: transparent;
    }
  `
      : ""}
`;

export const ProjectThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ProjectColorTheme>(DEFAULT_PROJECT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastSettings, setBroadcastSettings] = useState<BroadcastDisplaySettings>(getBroadcastDisplaySettings);

  useEffect(() => {
    let isMounted = true;

    http
      .get(GET_PROJECT_COLOR_THEME)
      .then((response) => {
        if (isMounted) {
          setTheme(sanitizeTheme(response.data));
        }
      })
      .catch(() => {
        if (isMounted) {
          setTheme(DEFAULT_PROJECT_THEME);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleThemeUpdate = (event: Event) => {
      const nextTheme = (event as CustomEvent<Partial<ProjectColorTheme>>).detail;
      setTheme(sanitizeTheme(nextTheme));
    };

    window.addEventListener("project-theme-updated", handleThemeUpdate);

    return () => {
      window.removeEventListener("project-theme-updated", handleThemeUpdate);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isCustomTheme: theme.useDefaultColors === false,
      isLoading,
      broadcastSettings,
    }),
    [theme, isLoading, broadcastSettings]
  );

  useEffect(() => {
    document.body.dataset.projectTheme = value.isCustomTheme && broadcastSettings.broadcastThemeEnabled ? "custom" : "default";

    return () => {
      delete document.body.dataset.projectTheme;
    };
  }, [value.isCustomTheme, broadcastSettings.broadcastThemeEnabled]);

  useEffect(() => {
    const applySettings = () => {
      const settings = getBroadcastDisplaySettings();
      setBroadcastSettings(settings);
      document.body.dataset.broadcastThemeEnabled = String(settings.broadcastThemeEnabled);
      document.body.dataset.broadcastThemePreset = settings.selectedBroadcastStyle || "theme1";
      document.body.dataset.championRushEnabled = String(settings.championRushEnabled);
      document.body.dataset.showCountryFlags = String(settings.showCountryFlags);
      document.body.dataset.showLiveStandingsPoints = String(settings.showLiveStandingsPoints);
      document.body.dataset.showRosterTeamLogos = String(settings.showRosterTeamLogos);
      document.body.dataset.rosterPageSwitch = String(settings.rosterPageSwitch);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === BROADCAST_DISPLAY_SETTINGS_KEY) applySettings();
    };

    applySettings();
    const selectedTournamentSlug = getSelectedTournamentSlug();
    http
      .get(BROADCAST_DISPLAY_SETTINGS(selectedTournamentSlug) || GET_BROADCAST_DISPLAY_SETTINGS)
      .then((response) => {
        const nextSettings = mergeBroadcastDisplaySettings(
          getBroadcastDisplaySettings(),
          response.data?.settings || response.data,
        );
        setBroadcastDisplaySettings(nextSettings);
        applySettings();
      })
      .catch(() => undefined);
    window.addEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, applySettings);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, applySettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <ProjectThemeContext.Provider value={value}>
      <ProjectThemeGlobalStyle $theme={theme} $custom={value.isCustomTheme && broadcastSettings.broadcastThemeEnabled} />
      {children}
    </ProjectThemeContext.Provider>
  );
};

export const useProjectTheme = () => useContext(ProjectThemeContext);

export const PROJECT_THEME_API_RESPONSE_EXAMPLE: ProjectColorTheme = {
  useDefaultColors: false,
  primary: "#ef4444",
  secondary: "#38bdf8",
  accent: "#bfff00",
  background: "#0b0f19",
  surface: "#111827",
  surfaceAlt: "#1f293d",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textInverse: "#050505",
  border: "#334155",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};
