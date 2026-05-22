import React, { createContext, useContext, useEffect, useState } from "react";

import {
  connectRealtime,
  subscribeRealtime,
} from "./store"

const RealtimeContext = createContext<any>(null);

export const RealtimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [realtimeData, setRealtimeData] = useState(null);

  useEffect(() => {
    // CONNECT ONLY ONCE
    connectRealtime('12345'); // match id

    const unsubscribe = subscribeRealtime((data) => {
      setRealtimeData(data);
    });

    return () => {
      unsubscribe();
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