import React from "react";
import BroadcastImageMappingPage from "./BroadcastImageMappingPage";

const TeamEliminationImageSettingsView: React.FC = () => (
  <BroadcastImageMappingPage
    mode="team-elimination"
    title="Team Elimination Image"
    description="Upload one image per team id or team name. The Team Elimination overlay checks the eliminated team and shows the matching uploaded image automatically."
    enabledKey="teamEliminationImageEnabled"
  />
);

export default TeamEliminationImageSettingsView;
