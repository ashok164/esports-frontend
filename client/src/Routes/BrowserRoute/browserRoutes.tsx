import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

const App: React.FC = () => {
  return (
    <Router>
      <RealtimeProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/routes" replace />} />
          <Route path="/routes" element={<RouteNavigator />} />
          <Route path="/live-standings" element={<LiveStandingsView />} />
          <Route path="/team-eliminated" element={<TeamEliminatedView />} />
          <Route path="/last-four-teams" element={<LastTeamNotification />} />
          <Route path="/match-number" element={<MatchNumber />} />
          <Route path="/circle-analysis" element={<CircleAnalysis />} />
          <Route path="/team-record" element={<TeamRecordTable />} />
          <Route path="/team-logo" element={<ViewTeamLogo />} />
          <Route path="/player-upload" element={<PlayerUploadView />} />
          <Route path="/player-profile" element={<PlayerUploadProfile />} />
        </Routes>
      </RealtimeProvider>
    </Router>
  );
};

export default App;
