import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate, useParams } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import {
  getBroadcastDisplaySettings,
  ProjectThemeProvider,
} from "../../Theme";
import {
  BROADCAST_DISPLAY_SETTINGS_KEY,
  BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT,
} from "../../Theme/projectTheme";
import { clearAuthSession, isAuthenticated, saveAuthUser } from "../../Auth/Repository/authStorage";
import { getCurrentUser } from "../../Auth/Repository/remote";
import {
  getSelectedTournamentName,
  getTournamentPath,
  normalizeTournamentSlug,
  setSelectedTournamentSlug,
  TOURNAMENT_ROUTE_PREFIX,
} from "../../Tournaments/tournamentState";
import { appRouteDefinitions, broadcastRoutePaths } from "./routeDefinitions";

const getRoutePathWithoutTournament = (pathname: string) => {
  const match = pathname.match(/^\/tournaments\/[^/]+(\/.*)?$/);
  return match ? match[1] || "/routes" : pathname;
};

const getRouteTournamentSlug = (pathname: string) => {
  const match = pathname.match(/^\/tournaments\/([^/]+)/);
  return match ? normalizeTournamentSlug(match[1]) : undefined;
};

const getRouteLabel = (pathname: string) => {
  const scopedPathname = getRoutePathWithoutTournament(pathname);
  const route = appRouteDefinitions.find((definition) => definition.path === scopedPathname);
  if (scopedPathname === "/tournaments") return "Tournaments";
  if (scopedPathname === "/routes") return "Routes";
  return route?.path
    .replace(/^\//, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ") || "Tournament";
};

const withTournamentRoute = (path: string) =>
  path === "/tournaments" ? "/tournaments/:tournamentSlug" : `/tournaments/:tournamentSlug${path}`;

const ThemeRouteScope: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  React.useEffect(() => {
    const scopedPathname = getRoutePathWithoutTournament(location.pathname);
    const isBroadcastRoute = broadcastRoutePaths.includes(scopedPathname);
    const isLiveStandingsRoute = scopedPathname === "/live-standings";

    document.body.dataset.broadcastRoute = String(isBroadcastRoute);
    document.body.dataset.liveStandingsRoute = String(isLiveStandingsRoute);

    return () => {
      delete document.body.dataset.broadcastRoute;
      delete document.body.dataset.liveStandingsRoute;
    };
  }, [location.pathname]);

  return <>{children}</>;
};

const TournamentSlugScope: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const params = useParams();

  React.useEffect(() => {
    if (params.tournamentSlug) {
      setSelectedTournamentSlug(params.tournamentSlug);
    }
  }, [params.tournamentSlug]);

  return children;
};

const AdminPageShell: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const scopedPathname = getRoutePathWithoutTournament(location.pathname);
  const scopedTournamentSlug = getRouteTournamentSlug(location.pathname);
  const tournamentName = getSelectedTournamentName() || scopedTournamentSlug || "";
  const routeLabel = getRouteLabel(location.pathname);
  const showRoutesLink = scopedPathname !== "/routes";

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <AdminShell>
      <AdminTopBar>
        <AdminLeft>
          {showRoutesLink ? (
            <AdminHomeLink to={getTournamentPath("/routes", scopedTournamentSlug)} title="Back to route navigator">
              <AdminHomeMark aria-hidden="true">R</AdminHomeMark>
              <span>Routes</span>
            </AdminHomeLink>
          ) : (
            <AdminTopLabel>Tournament Control</AdminTopLabel>
          )}
          <Breadcrumbs aria-label="Breadcrumb">
            <BreadcrumbLink to="/tournaments">Tournaments</BreadcrumbLink>
            {tournamentName && (
              <>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbLink to={getTournamentPath("/routes", scopedTournamentSlug)}>
                  {tournamentName}
                </BreadcrumbLink>
              </>
            )}
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbCurrent>{routeLabel}</BreadcrumbCurrent>
          </Breadcrumbs>
        </AdminLeft>
        <AdminLogoutButton type="button" onClick={handleLogout}>
          Logout
        </AdminLogoutButton>
      </AdminTopBar>
      {children}
    </AdminShell>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactElement; withShell?: boolean }> = ({ children, withShell = true }) => {
  const [isChecking, setIsChecking] = React.useState(isAuthenticated());
  const [isAllowed, setIsAllowed] = React.useState(isAuthenticated());

  React.useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated()) {
      setIsChecking(false);
      setIsAllowed(false);
      return;
    }

    getCurrentUser()
      .then((response) => {
        const user = response.user || response.data?.user;
        if (user) {
          saveAuthUser(user);
        }

        if (isMounted) {
          setIsAllowed(true);
        }
      })
      .catch(() => {
        clearAuthSession();
        if (isMounted) {
          setIsAllowed(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return null;
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return withShell ? <AdminPageShell>{children}</AdminPageShell> : children;
};

const App: React.FC = () => {
  React.useEffect(() => {
    const applyDisplaySettings = () => {
      const settings = getBroadcastDisplaySettings();
      document.body.dataset.showCountryFlags = String(settings.showCountryFlags);
      document.body.dataset.showLiveStandingsPoints = String(settings.showLiveStandingsPoints);
      document.body.dataset.showRosterTeamLogos = String(settings.showRosterTeamLogos);
      document.body.dataset.rosterPageSwitch = String(settings.rosterPageSwitch);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BROADCAST_DISPLAY_SETTINGS_KEY) applyDisplaySettings();
    };

    applyDisplaySettings();
    window.addEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, applyDisplaySettings);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, applyDisplaySettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <Router>
      <GlobalDisplayStyles />
      <Routes>
        {appRouteDefinitions.flatMap((route) => {
          const routeVariants =
            route.path === "/" || route.path === "/login" || route.path === "/register"
              ? [route]
              : [route, { ...route, path: withTournamentRoute(route.path) }];

          return routeVariants.map((routeVariant) => {
            const isTournamentScoped = routeVariant.path.startsWith(
              `${TOURNAMENT_ROUTE_PREFIX}/:tournamentSlug`,
            );
            const usesBroadcastTheme = routeVariant.isBroadcast === true;
            const innerElement = isTournamentScoped ? (
              <TournamentSlugScope>{routeVariant.element}</TournamentSlugScope>
            ) : (
              routeVariant.element
            );
            const routeElement = routeVariant.isProtected ? (
              <ProtectedRoute withShell={route.path !== "/routes"}>{innerElement}</ProtectedRoute>
            ) : (
              innerElement
            );

            return (
              <Route
                key={routeVariant.path}
                path={routeVariant.path}
                element={
                  usesBroadcastTheme ? (
                    <ProjectThemeProvider>
                      <ThemeRouteScope>{routeElement}</ThemeRouteScope>
                    </ProjectThemeProvider>
                  ) : (
                    routeElement
                  )
                }
              />
            );
          });
        })}
      </Routes>
    </Router>
  );
};

export default App;

const GlobalDisplayStyles = createGlobalStyle`
  body[data-show-country-flags="false"] img:is([alt*="Country" i], [alt*="Flag" i]) {
    display: none !important;
  }

  body[data-show-live-standings-points="false"] [data-live-standings-points="true"] {
    display: none !important;
  }
`;

const AdminShell = styled.div`
  min-height: 100vh;
  background: var(--project-background, #0b0f19);
  color: var(--project-text-primary, #ffffff);
`;

const AdminTopBar = styled.nav`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 58px;
  padding: 10px clamp(14px, 3vw, 28px);
  border-bottom: 1px solid rgba(var(--project-primary-rgb, 239, 68, 68), 0.28);
  background:
    linear-gradient(90deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.16), transparent 36%),
    rgba(8, 12, 22, 0.92);
  backdrop-filter: blur(14px);
`;

const AdminLeft = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 820px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }
`;

const AdminHomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  padding: 0 14px 0 10px;
  border: 1px solid rgba(var(--project-secondary-rgb, 56, 189, 248), 0.34);
  border-radius: 8px;
  color: var(--project-text-primary, #ffffff);
  font-size: 0.9rem;
  font-weight: 900;
  text-decoration: none;
  background: var(--project-surface, #111827);

  &:hover {
    border-color: var(--project-secondary, #38bdf8);
    background: rgba(var(--project-secondary-rgb, 56, 189, 248), 0.14);
  }
`;

const AdminHomeMark = styled.span`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--project-secondary, #38bdf8);
  color: var(--project-text-inverse, #0b0f19);
  font-size: 0.82rem;
`;

const AdminTopLabel = styled.div`
  color: var(--project-accent, #bfff00);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const Breadcrumbs = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.84rem;
  font-weight: 800;
`;

const BreadcrumbLink = styled(Link)`
  max-width: 220px;
  overflow: hidden;
  color: var(--project-text-secondary, #94a3b8);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: var(--project-secondary, #38bdf8);
  }
`;

const BreadcrumbSeparator = styled.span`
  color: rgba(148, 163, 184, 0.55);
`;

const BreadcrumbCurrent = styled.span`
  max-width: 240px;
  overflow: hidden;
  color: var(--project-text-primary, #ffffff);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AdminLogoutButton = styled.button`
  min-height: 38px;
  padding: 0 15px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.46);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.14);
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 900;

  &:hover {
    background: var(--project-danger, #ef4444);
  }
`;
