import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LiveStandingsView from "../../LiveStandingsTable/View";
import TeamEliminatedView from "../../TeamEliminated/View";
import { RealtimeProvider } from "../../GlobalWebsocket/realtimeProvider";
import LastTeamNotification from "../../LastFourTeams/View/LastTeamNotification";
import MatchNumber from "../../MatchNumber/View";
import CircleAnalysis from "../../CircleAnalysis/View";
import TeamRecordTable from "../../TeamRecordTable/View";
import ViewTeamLogo from "../../TeamLogo/View";
import PlayerUploadView from "../../PlayerUpload/View";
import PlayerUploadProfile from "../../PlayerUpload/View/PlayerUploadProfile";
import RouteNavigator from "../RouteNavigator";
import { ProjectThemeProvider } from "../../Theme";
import BroadcastThemeView from "../../BroadcastTheme/View";
import LoginView, { RegisterView } from "../../Auth/View";
import { clearAuthSession, isAuthenticated, saveAuthUser } from "../../Auth/Repository/authStorage";
import { getCurrentUser } from "../../Auth/Repository/remote";

const broadcastRoutePaths = [
  "/live-standings",
  "/team-eliminated",
  "/last-four-teams",
  "/match-number",
  "/circle-analysis",
];

const ThemeRouteScope: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  React.useEffect(() => {
    const isBroadcastRoute = broadcastRoutePaths.includes(location.pathname);
    document.body.dataset.broadcastRoute = String(isBroadcastRoute);

    return () => {
      delete document.body.dataset.broadcastRoute;
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
          <RealtimeProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<RegisterView />} />
              <Route path="/routes" element={<ProtectedRoute><RouteNavigator /></ProtectedRoute>} />
              <Route path="/broadcast-theme" element={<ProtectedRoute><BroadcastThemeView /></ProtectedRoute>} />
              <Route path="/live-standings" element={<LiveStandingsView />} />
              <Route path="/team-eliminated" element={<TeamEliminatedView />} />
              <Route path="/last-four-teams" element={<LastTeamNotification />} />
              <Route path="/match-number" element={<MatchNumber />} />
              <Route path="/circle-analysis" element={<CircleAnalysis />} />
              <Route path="/team-record" element={<ProtectedRoute><TeamRecordTable /></ProtectedRoute>} />
              <Route path="/team-logo" element={<ProtectedRoute><ViewTeamLogo /></ProtectedRoute>} />
              <Route path="/player-upload" element={<ProtectedRoute><PlayerUploadView /></ProtectedRoute>} />
              <Route path="/player-profile" element={<ProtectedRoute><PlayerUploadProfile /></ProtectedRoute>} />
            </Routes>
          </RealtimeProvider>
        </ThemeRouteScope>
      </ProjectThemeProvider>
    </Router>
  );
};

export default App;
