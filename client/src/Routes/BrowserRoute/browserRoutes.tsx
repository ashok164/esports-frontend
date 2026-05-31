import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ProjectThemeProvider } from "../../Theme";
import { clearAuthSession, isAuthenticated, saveAuthUser } from "../../Auth/Repository/authStorage";
import { getCurrentUser } from "../../Auth/Repository/remote";
import { appRouteDefinitions, broadcastRoutePaths } from "./routeDefinitions";

const ThemeRouteScope: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  React.useEffect(() => {
    const isBroadcastRoute = broadcastRoutePaths.includes(location.pathname);
    const isLiveStandingsRoute = location.pathname === "/live-standings";

    document.body.dataset.broadcastRoute = String(isBroadcastRoute);
    document.body.dataset.liveStandingsRoute = String(isLiveStandingsRoute);

    return () => {
      delete document.body.dataset.broadcastRoute;
      delete document.body.dataset.liveStandingsRoute;
    };
  }, [location.pathname]);

  return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
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

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <ProjectThemeProvider>
        <ThemeRouteScope>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {appRouteDefinitions.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  route.isProtected ? (
                    <ProtectedRoute>{route.element}</ProtectedRoute>
                  ) : (
                    route.element
                  )
                }
              />
            ))}
          </Routes>
        </ThemeRouteScope>
      </ProjectThemeProvider>
    </Router>
  );
};

export default App;
