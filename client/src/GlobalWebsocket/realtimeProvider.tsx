import React, { createContext, useContext, useEffect, useState } from "react";

import {
  connectRealtime,
  subscribeRealtime,
} from "./store"
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
  normalizeGameDetail,
  publishActiveGameDetails,
} from "../GameDetails/gameDetailsState";
import { getGameDetailsApi } from "../GameDetails/Repository/remote";

const RealtimeContext = createContext<any>(null);

export const RealtimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [realtimeData, setRealtimeData] = useState(null);
  const [matchIds, setMatchIds] = useState(() => getActiveGameDetails().matchIds);

  useEffect(() => {
    let isMounted = true;

    const refreshGameDetails = async () => {
      try {
        const response = await getGameDetailsApi();
        if (!isMounted || !Array.isArray(response)) return;

        publishActiveGameDetails(response.map(normalizeGameDetail));
      } catch {
        // Keep the last known snapshot while the API is temporarily unavailable.
      }
    };

    refreshGameDetails();
    const intervalId = window.setInterval(refreshGameDetails, 15000);
    window.addEventListener("focus", refreshGameDetails);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshGameDetails);
    };
  }, []);

  useEffect(() => {
    connectRealtime(matchIds);

    const unsubscribe = subscribeRealtime((data) => {
      setRealtimeData(data);
    });

    return () => {
      unsubscribe();
    };
  }, [matchIds]);

  useEffect(() => {
    const handleGameDetailsChange = () => {
      setMatchIds(getActiveGameDetails().matchIds);
    };

    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, handleGameDetailsChange);
    window.addEventListener("storage", handleGameDetailsChange);

    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, handleGameDetailsChange);
      window.removeEventListener("storage", handleGameDetailsChange);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={realtimeData}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  return useContext(RealtimeContext);
};
