import React from "react";
import EndgameTopFourHUD from "./Components/LastFourTeam1";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";

const LastTeamNotification = () => {
  const { standings, loading } = useLiveStandingsController();
  const { isLoading: isThemeLoading } = useProjectTheme();

  if (loading || isThemeLoading) return null;
  return (
    <>
      <EndgameTopFourHUD teams={standings} />
    </>
  );
};

export default LastTeamNotification;
