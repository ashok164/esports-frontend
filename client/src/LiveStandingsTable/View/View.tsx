import React, { useEffect, useMemo, useState } from "react";
import useLiveStandingsController from "../Controller/useLiveStandingsController";
import StandingsTable from "./LiveStandings2";

const SINGLE_ELIMINATION_TEST_PARAM = "testSingleElimination";

const isDeadTeam = (team: any) =>
  Boolean(team?.isEliminated) || Number(team?.playersAlive ?? 0) <= 0;

const forceTeamAlive = (team: any) => ({
  ...team,
  isEliminated: false,
  playersAlive: Math.max(1, Number(team?.playersAlive ?? 0)),
  players: (team.players || []).map((player: any, index: number) =>
    index === 0
      ? {
          ...player,
          hp: Math.max(1, Number(player?.hp ?? 100)),
          hpPercent: Math.max(1, Number(player?.hpPercent ?? 100)),
          isAlive: true,
          isKnocked: false,
          status: "alive",
          hasRecalled: false,
        }
      : player,
  ),
});

const forceTeamEliminated = (team: any) => ({
  ...team,
  isEliminated: true,
  playersAlive: 0,
  players: (team.players || []).map((player: any) => ({
    ...player,
    hp: 0,
    hpPercent: 0,
    isAlive: false,
    isKnocked: false,
    status: "dead",
    hasRecalled: true,
  })),
});

const LiveStandingsView: React.FC = () => {
  const { standings, championBannerUrl, championRushTeamKeys, loading } = useLiveStandingsController();
  const [testTeamId, setTestTeamId] = useState<string | number | null>(null);
  const [testEliminated, setTestEliminated] = useState(false);
  const isSingleEliminationTest =
    new URLSearchParams(window.location.search).has(
      SINGLE_ELIMINATION_TEST_PARAM,
    );

  useEffect(() => {
    if (!isSingleEliminationTest || standings.length === 0 || testTeamId) {
      return;
    }

    const selectedTeam =
      standings.find((team) => !isDeadTeam(team)) ?? standings[0];

    setTestTeamId(selectedTeam.id);
    setTestEliminated(false);

    const timer = setTimeout(() => {
      setTestEliminated(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, [isSingleEliminationTest, standings, testTeamId]);

  const displayStandings = useMemo(() => {
    if (!isSingleEliminationTest || testTeamId === null) {
      return standings;
    }

    return standings.map((team) => {
      if (String(team.id) !== String(testTeamId)) {
        return team;
      }

      return testEliminated
        ? forceTeamEliminated(team)
        : forceTeamAlive(team);
    });
  }, [isSingleEliminationTest, standings, testEliminated, testTeamId]);

  if (loading) return null;

  return (
    <StandingsTable
      teams={displayStandings}
      championBannerUrl={championBannerUrl}
      championRushTeamKeys={championRushTeamKeys}
    />
  );
};

export default LiveStandingsView;
