import React, { createContext, useContext, useEffect, useState } from "react";

import {
  connectRealtime,
  subscribeRealtime,
} from "./store"
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
} from "../GameDetails/gameDetailsState";

const RealtimeContext = createContext<any>(null);

export const RealtimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [realtimeData, setRealtimeData] = useState(null);
  const [matchIds, setMatchIds] = useState(() => getActiveGameDetails().matchIds);

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
