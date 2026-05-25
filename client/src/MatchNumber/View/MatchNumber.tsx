import React from "react";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
} from "../../GameDetails/gameDetailsState";
import { useProjectTheme } from "../../Theme";
import MatchOverlay from "./Component/MatchNumberDesign";

const MatchNumber = () => {
  const [activeDetails, setActiveDetails] = React.useState(getActiveGameDetails);
  const { isLoading: isThemeLoading } = useProjectTheme();

  React.useEffect(() => {
    const handleGameDetailsChange = () => {
      setActiveDetails(getActiveGameDetails());
    };

    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, handleGameDetailsChange);
    window.addEventListener("storage", handleGameDetailsChange);

    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, handleGameDetailsChange);
      window.removeEventListener("storage", handleGameDetailsChange);
    };
  }, []);

  if (isThemeLoading) return null;

  return (
    <>
      <MatchOverlay
        gameNumber={activeDetails.gameNumber}
        dayName={activeDetails.roundName}
        modeName={activeDetails.phase}
      />
    </>
  );
};

export default MatchNumber;
