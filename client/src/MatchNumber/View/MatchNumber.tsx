import React from "react";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";
import MatchOverlay from "./Component/MatchNumberDesign";

const MatchNumber = () => {
  const { matchNumber, dayName, modeName } = useLiveStandingsController();
  const { isLoading: isThemeLoading } = useProjectTheme();

  if (isThemeLoading) return null;

  return (
    <>
      <MatchOverlay
        gameNumber={matchNumber}
        dayName={dayName}
        modeName={modeName}
      />
    </>
  );
};

export default MatchNumber;
