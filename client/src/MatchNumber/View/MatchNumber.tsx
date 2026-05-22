import React from "react";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import MatchOverlay from "./Component/MatchNumberDesign";

const MatchNumber = () => {
  const { matchNumber, dayName, modeName } = useLiveStandingsController();
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
