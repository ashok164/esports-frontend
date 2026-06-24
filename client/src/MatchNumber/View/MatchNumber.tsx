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
import MatchNumberDesign2 from "./Component/MatchNumberDesign2";
import MatchNumberDesign3 from "./Component/MatchNumberDesign3";
import MatchNumberImageOverlay from "./Component/MatchNumberImageOverlay";

const MatchNumber = () => {
  useSyncGameDetails();
  const [activeDetails, setActiveDetails] = React.useState(getActiveGameDetails);
  const [activeLogoUrl, setActiveLogoUrl] = React.useState("");
  const { isLoading: isThemeLoading, broadcastSettings } = useProjectTheme();

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

  const overlayProps = {
    gameNumber: activeDetails.gameNumber,
    dayName: activeDetails.roundName,
    modeName: activeDetails.phase,
    logoUrl: activeLogoUrl,
  };

  const matchingMatchNumberImage = broadcastSettings.matchNumberImageEntries.find(
    (entry) => String(entry.gameNumber).trim() === String(activeDetails.gameNumber).trim(),
  );

  if (broadcastSettings.matchNumberImageEnabled) {
    const imageUrl =
      matchingMatchNumberImage?.imageUrl || broadcastSettings.matchNumberImageUrl;

    if (imageUrl) {
      return <MatchNumberImageOverlay imageUrl={imageUrl} />;
    }
  }

  if (broadcastSettings.selectedBroadcastStyle === "theme3") {
    return (
      <MatchNumberDesign3
        {...overlayProps}
        color1={broadcastSettings.liveStandings2Color1}
        color2={broadcastSettings.liveStandings2Color2}
        color5={broadcastSettings.liveStandings2Color5}
        textColor3={broadcastSettings.liveStandings2TextColor3}
        textColor4={broadcastSettings.liveStandings2TextColor4}
      />
    );
  }

  return broadcastSettings.selectedBroadcastStyle === "theme2" ? (
    <MatchNumberDesign2
      {...overlayProps}
      color1={broadcastSettings.liveStandings2Color1}
      color2={broadcastSettings.liveStandings2Color2}
      color4={broadcastSettings.liveStandings2Color4}
      color5={broadcastSettings.liveStandings2Color5}
    />
  ) : (
    <MatchOverlay {...overlayProps} />
  );
};

export default MatchNumber;
