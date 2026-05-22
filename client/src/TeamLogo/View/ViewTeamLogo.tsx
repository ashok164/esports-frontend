import React from "react";
import { useSearchParams } from "react-router-dom";
import useTeamLogoView from "../Controller/useTeamLogoView";
import TeamLogoDesign from "./teamLogoDesign";

const ViewTeamLogo = () => {
  const [searchParams] = useSearchParams();
  const { teamLogoData } = useTeamLogoView();
  const selectedTeamId = searchParams.get("team");

  return (
    <>
      <TeamLogoDesign teams={teamLogoData} selectedTeamId={selectedTeamId} />
    </>
  );
};

export default ViewTeamLogo;
