import React from "react";
import TeamBannerManager from "./TeamBannerManager";

const FullTeamBannerView: React.FC = () => (
  <TeamBannerManager
    kind="full"
    title="Full Team Banner"
    description="Upload, edit, and delete full team banner images."
  />
);

export default FullTeamBannerView;
