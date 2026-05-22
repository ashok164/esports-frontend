import React from "react";
import useLiveStandingsController from "../Controller/useLiveStandingsController";
import StandingsTable from "./LiveStandings2";


const LiveStandingsView: React.FC = () => {
  const { standings, loading } = useLiveStandingsController();

  if (loading) return null;

  return <StandingsTable teams={standings} />;
};

export default LiveStandingsView;
