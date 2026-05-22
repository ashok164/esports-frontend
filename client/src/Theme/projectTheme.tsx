import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createGlobalStyle } from "styled-components";
import http from "../AxiosFile/axios";
import { GET_PROJECT_COLOR_THEME } from "../Routes/ApiRoutes/apiRoutes";

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
  border: string;
  success: string;
  warning: string;
  danger: string;
};

type ProjectThemeContextValue = {
  theme: ProjectColorTheme;
  isCustomTheme: boolean;
  isLoading: boolean;
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
  border: "#334155",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const ProjectThemeContext = createContext<ProjectThemeContextValue>({
  theme: DEFAULT_PROJECT_THEME,
  isCustomTheme: false,
  isLoading: false,
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
  ${({ $theme, $custom }) =>
    $custom
      ? `
    :root {
      --project-primary: ${$theme.primary};
      --project-secondary: ${$theme.secondary};
      --project-accent: ${$theme.accent};
      --project-background: ${$theme.background};
      --project-surface: ${$theme.surface};
      --project-surface-alt: ${$theme.surfaceAlt};
      --project-text-primary: ${$theme.textPrimary};
      --project-text-secondary: ${$theme.textSecondary};
      --project-border: ${$theme.border};
      --project-success: ${$theme.success};
      --project-warning: ${$theme.warning};
      --project-danger: ${$theme.danger};
      --project-primary-rgb: ${hexToRgb($theme.primary)};
      --project-secondary-rgb: ${hexToRgb($theme.secondary)};
      --project-accent-rgb: ${hexToRgb($theme.accent)};
      --project-danger-rgb: ${hexToRgb($theme.danger)};
    }

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

    body[data-project-theme="custom"] {
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"] :is(main, section, article, table, thead, tbody, tr, td, th, div) {
      border-color: var(--project-border);
    }

    body[data-project-theme="custom"] :is(h1, h2, h3, h4, h5, h6, p, span, label, strong, small, td, th, button, a) {
      color: inherit;
    }

    body[data-project-theme="custom"] :is(button, input, select, textarea) {
      border-color: var(--project-border) !important;
    }

    body[data-project-theme="custom"] :is(button:not(:disabled), a, input[type="checkbox"], input[type="radio"]) {
      accent-color: var(--project-primary);
    }

    body[data-project-theme="custom"] :is(input, select, textarea) {
      background-color: var(--project-surface) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"] :is(input:focus, select:focus, textarea:focus, button:focus-visible, a:focus-visible) {
      outline-color: var(--project-accent) !important;
      border-color: var(--project-accent) !important;
    }

    body[data-project-theme="custom"][data-broadcast-route="false"] [data-theme-surface="page"],
    body[data-project-theme="custom"]:not([data-broadcast-route]) [data-theme-surface="page"] {
      background: var(--project-background) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"] [data-theme-surface="panel"],
    body[data-project-theme="custom"] [data-theme-surface="card"] {
      background: var(--project-surface) !important;
      border-color: var(--project-border) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"] [data-theme-accent="primary"] {
      color: var(--project-primary) !important;
      border-color: var(--project-primary) !important;
    }

    body[data-project-theme="custom"] [data-theme-accent="secondary"] {
      color: var(--project-secondary) !important;
      border-color: var(--project-secondary) !important;
    }

    body[data-project-theme="custom"] [data-theme-accent="danger"] {
      color: var(--project-danger) !important;
      border-color: var(--project-danger) !important;
    }

    body[data-project-theme="custom"] :is(button:not(:disabled), [role="button"]) {
      border-color: var(--project-primary) !important;
    }

    body[data-project-theme="custom"] button:not(:disabled):not([data-theme-variant="ghost"]) {
      background-color: var(--project-primary) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"] a {
      color: var(--project-secondary) !important;
    }

    body[data-project-theme="custom"] :is(.theme-primary, [data-theme-fill="primary"]) {
      background: var(--project-primary) !important;
      color: var(--project-text-primary) !important;
    }

    body[data-project-theme="custom"] :is(.theme-secondary, [data-theme-fill="secondary"]) {
      background: var(--project-secondary) !important;
      color: var(--project-background) !important;
    }

    body[data-project-theme="custom"] :is(.theme-accent, [data-theme-fill="accent"]) {
      background: var(--project-accent) !important;
      color: var(--project-background) !important;
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
    }),
    [theme, isLoading]
  );

  useEffect(() => {
    document.body.dataset.projectTheme = value.isCustomTheme ? "custom" : "default";

    return () => {
      delete document.body.dataset.projectTheme;
    };
  }, [value.isCustomTheme]);

  return (
    <ProjectThemeContext.Provider value={value}>
      <ProjectThemeGlobalStyle $theme={theme} $custom={value.isCustomTheme} />
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
  border: "#334155",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};
