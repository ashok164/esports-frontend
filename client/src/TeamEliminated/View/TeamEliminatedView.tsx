import { useEffect, useRef, useState } from "react";
import TeamNotificationCard from "../../Components/EliminatedComponent/Eliminated";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";

const TeamEliminatedView = () => {
  const { standings, loading } = useLiveStandingsController();
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [activeEliminatedTeam, setActiveEliminatedTeam] = useState(null);

  const shownEliminations = useRef(new Set());
  const previousEliminatedIds = useRef(new Set());
  const hasBaseline = useRef(false);
  const activeEliminationTime = useRef(0);
  const timeoutRef = useRef(null);

  const getTeamId = (team) => String(team?.id ?? team?.name ?? "");

  const getEliminationTime = (team) => {
    if (!team?.players || !Array.isArray(team.players)) return 0;

    return Math.max(
      0,
      ...team.players.map((player) => Number(player?.deadTime) || 0),
    );
  };

  const getPlacement = (score, isTwelfth) => {
    if (score === 0) return isTwelfth ? 12 : 11;

    const scoreToPlacementMap = {
      1: 10,
      2: 9,
      3: 8,
      4: 7,
      5: 6,
      6: 5,
      7: 4,
      8: 3,
      9: 2,
      12: 1,
    };

    return scoreToPlacementMap[score] || null;
  };

  const getLatestEliminatedTeam = (teams) =>
    [...teams].sort((a, b) => getEliminationTime(b) - getEliminationTime(a))[0];

  const showEliminatedTeam = (targetTeam, allStandings) => {
    if (!targetTeam) return;

    const targetTeamId = getTeamId(targetTeam);
    const targetEliminationTime = getEliminationTime(targetTeam);

    if (
      activeEliminationTime.current &&
      targetEliminationTime < activeEliminationTime.current
    ) {
      shownEliminations.current.add(targetTeamId);
      return;
    }

    let isTwelfth = false;
    if (Number(targetTeam.rankingScore) === 0) {
      const zeroScoreEliminations = allStandings
        .filter((t) => Number(t?.rankingScore) === 0 && t?.isEliminated)
        .sort((a, b) => getEliminationTime(a) - getEliminationTime(b));

      isTwelfth = getTeamId(zeroScoreEliminations[0]) === targetTeamId;
    }

    const accuratePlacement = getPlacement(
      Number(targetTeam.rankingScore) || 0,
      isTwelfth,
    );
    const enrichedTeam = {
      ...targetTeam,
      calculatedPlacement: accuratePlacement,
      placementText: accuratePlacement
        ? `${accuratePlacement}th Place`
        : "Eliminated",
    };

    shownEliminations.current.add(targetTeamId);
    activeEliminationTime.current = targetEliminationTime;
    setActiveEliminatedTeam(enrichedTeam);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setActiveEliminatedTeam(null);
      activeEliminationTime.current = 0;
    }, 5000);
  };

  useEffect(() => {
    if (
      loading ||
      isThemeLoading ||
      !Array.isArray(standings) ||
      standings.length === 0
    ) {
      return;
    }

    const currentEliminatedIds = new Set(
      standings.filter((team) => team?.isEliminated).map(getTeamId),
    );

    if (!hasBaseline.current) {
      previousEliminatedIds.current = currentEliminatedIds;
      hasBaseline.current = true;
      showEliminatedTeam(
        getLatestEliminatedTeam(standings.filter((team) => team?.isEliminated)),
        standings,
      );
      return;
    }

    const newEliminations = standings.filter((team) => {
      const teamId = getTeamId(team);

      return (
        team?.isEliminated &&
        teamId &&
        !previousEliminatedIds.current.has(teamId) &&
        !shownEliminations.current.has(teamId)
      );
    });

    previousEliminatedIds.current = currentEliminatedIds;

    if (newEliminations.length === 0) return;

    showEliminatedTeam(getLatestEliminatedTeam(newEliminations), standings);
  }, [standings, loading, isThemeLoading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (isThemeLoading || !activeEliminatedTeam) return null;

  return (
    <>
      <TeamNotificationCard team={activeEliminatedTeam} />
    </>
  );
};

export default TeamEliminatedView;
