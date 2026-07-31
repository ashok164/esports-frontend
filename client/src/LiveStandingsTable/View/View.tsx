import React, { useEffect, useMemo, useState } from "react";
import useLiveStandingsController from "../Controller/useLiveStandingsController";
import StyleOneStandingsTable from "./LiveStandings1";
import StyleTwoStandingsTable from "./LiveStandings2";
import StyleThreeStandingsTable from "./LiveStandings3";
import { useProjectTheme } from "../../Theme";
import { AnimatePresence } from "framer-motion";

const SINGLE_ELIMINATION_TEST_PARAM = "testSingleElimination";
const TABLE_SEQUENCE_EXIT_MS = 1200;
type TableAnimationPhase = "entering" | "exiting";

const isDeadTeam = (team: any) =>
  Boolean(team?.isEliminated || team?.is_eliminated) ||
  Number(team?.playersAlive ?? 0) <= 0;

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
  const { standings: liveMatchStandings } = useLiveStandingsController({
    forceLiveMatchStandings: true,
  });
  const { broadcastSettings } = useProjectTheme();
  const [testTeamId, setTestTeamId] = useState<string | number | null>(null);
  const [testEliminated, setTestEliminated] = useState(false);
  const [shouldRenderStandings, setShouldRenderStandings] = useState(false);
  const [tableAnimationPhase, setTableAnimationPhase] = useState<TableAnimationPhase>("entering");
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

  const aliveTeamsCount = useMemo(() => {
    const phaseRows = liveMatchStandings.length > 0 ? liveMatchStandings : displayStandings;
    return phaseRows.filter((team) => !isDeadTeam(team)).length;
  }, [displayStandings, liveMatchStandings]);
  const isLastFourPhase = aliveTeamsCount === 4;

  const shouldShowStandings =
    !loading &&
    broadcastSettings.showResultStandings &&
    !isLastFourPhase;

  useEffect(() => {
    if (shouldShowStandings) {
      setShouldRenderStandings(true);
      setTableAnimationPhase("entering");
      return;
    }

    if (!shouldRenderStandings) return;

    setTableAnimationPhase("exiting");
    const timer = window.setTimeout(() => {
      setShouldRenderStandings(false);
    }, TABLE_SEQUENCE_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [shouldShowStandings, shouldRenderStandings]);

  const selectedStyle = broadcastSettings.selectedBroadcastStyle;

  const standingsTable =
    selectedStyle === "theme2" ? (
      <StyleTwoStandingsTable teams={displayStandings} animationPhase={tableAnimationPhase} />
    ) : selectedStyle === "theme3" ? (
      <StyleThreeStandingsTable teams={displayStandings} animationPhase={tableAnimationPhase} />
    ) : (
      <StyleOneStandingsTable
        teams={displayStandings}
        championBannerUrl={championBannerUrl}
        championRushTeamKeys={championRushTeamKeys}
        animationPhase={tableAnimationPhase}
      />
    );

  return (
    <AnimatePresence mode="wait">
      {shouldRenderStandings && (
        <div
          key={selectedStyle}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            transformOrigin: "right center",
          }}
        >
          {standingsTable}
        </div>
      )}
    </AnimatePresence>
  );
};

export default LiveStandingsView;
