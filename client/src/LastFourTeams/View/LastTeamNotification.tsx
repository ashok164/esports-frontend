import React, { useEffect, useMemo, useState } from "react";
import EndgameTopFourHUD from "./Components/LastFourTeam1";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";

const LastTeamNotification = () => {
  const { standings, loading } = useLiveStandingsController({
    forceLiveMatchStandings: true,
  });
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [isFinalPhaseLocked, setIsFinalPhaseLocked] = useState(false);

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

  useEffect(() => {
    if (aliveTeamsCount === 4) {
      setIsFinalPhaseLocked(true);
      return;
    }

    if (aliveTeamsCount === 0 || aliveTeamsCount > 4) {
      setIsFinalPhaseLocked(false);
    }
  }, [aliveTeamsCount]);

  if (loading || isThemeLoading || !isFinalPhaseLocked) return null;
  return (
    <>
      <EndgameTopFourHUD teams={standings} />
    </>
  );
};

export default LastTeamNotification;
