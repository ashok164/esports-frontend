import React, { useMemo } from "react";
import EndgameTopFourHUD from "./Components/LastFourTeam1";
import StyleTwoTopFourHUD from "./Components/LastFourTeam2";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";

const LastTeamNotification = () => {
  const { standings, loading } = useLiveStandingsController({
    forceLiveMatchStandings: true,
  });
  const { isLoading: isThemeLoading, broadcastSettings } = useProjectTheme();

  const aliveTeamsCount = useMemo(
    () =>
      Array.isArray(standings)
        ? standings.filter(
            (team) =>
              Number(team?.playersAlive ?? 0) > 0 && !team?.isEliminated,
          ).length
        : 0,
    [standings],
  );

  const shouldShowFinalTeamsOverlay =
    aliveTeamsCount > 0 && aliveTeamsCount <= 4;

  if (loading || isThemeLoading || !shouldShowFinalTeamsOverlay) return null;
  return (
    <>
      {broadcastSettings.selectedBroadcastStyle === "theme2" ? (
        <StyleTwoTopFourHUD teams={standings} />
      ) : (
        <EndgameTopFourHUD teams={standings} />
      )}
    </>
  );
};

export default LastTeamNotification;
