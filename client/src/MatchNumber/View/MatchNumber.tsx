import React from "react";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
} from "../../GameDetails/gameDetailsState";
import useSyncGameDetails from "../../GameDetails/useSyncGameDetails";
import { useProjectTheme } from "../../Theme";
import {
  getTournamentLogosApi,
  getTournamentLogoUrl,
  isTournamentLogoActive,
} from "../../TournamentLogo/Repository/remote";
import MatchOverlay from "./Component/MatchNumberDesign";

const MatchNumber = () => {
  useSyncGameDetails();
  const [activeDetails, setActiveDetails] = React.useState(getActiveGameDetails);
  const [activeLogoUrl, setActiveLogoUrl] = React.useState("");
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

  React.useEffect(() => {
    let mounted = true;

    const loadTournamentLogo = async () => {
      try {
        const logos = await getTournamentLogosApi();
        const activeLogo = logos.find((logo) => isTournamentLogoActive(logo));
        if (mounted) {
          setActiveLogoUrl(getTournamentLogoUrl(activeLogo));
        }
      } catch {
        if (mounted) setActiveLogoUrl("");
      }
    };

    loadTournamentLogo();
    const interval = window.setInterval(loadTournamentLogo, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  if (isThemeLoading) return null;

  return (
    <>
      <MatchOverlay
        gameNumber={activeDetails.gameNumber}
        dayName={activeDetails.roundName}
        modeName={activeDetails.phase}
        logoUrl={activeLogoUrl}
      />
    </>
  );
};

export default MatchNumber;
