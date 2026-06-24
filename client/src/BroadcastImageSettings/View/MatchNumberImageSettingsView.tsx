import React from "react";
import BroadcastImageMappingPage from "./BroadcastImageMappingPage";

const MatchNumberImageSettingsView: React.FC = () => (
  <BroadcastImageMappingPage
    mode="match-number"
    title="Match Number Image"
    description="Upload one image per game number. The Match Number overlay checks the active game number and shows the matching uploaded image automatically."
    enabledKey="matchNumberImageEnabled"
  />
);

export default MatchNumberImageSettingsView;
