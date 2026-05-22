import React from "react";
import EndgameTopFourHUD from "./Components/LastFourTeam1";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";

const LastTeamNotification = () => {
  const { standings, loading } = useLiveStandingsController();

  if (loading) return null;
  return (
    <>
      <EndgameTopFourHUD teams={standings} />
    </>
  );
};

export default LastTeamNotification;
