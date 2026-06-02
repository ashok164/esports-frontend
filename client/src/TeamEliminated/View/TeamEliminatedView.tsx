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

  const getEliminationOrder = (teams) =>
    [...teams]
      .filter((team) => team?.isEliminated)
      .sort((a, b) => {
        const timeDiff = getEliminationTime(a) - getEliminationTime(b);
        if (timeDiff !== 0) return timeDiff;

        const scoreDiff =
          (Number(a?.rankingScore) || 0) - (Number(b?.rankingScore) || 0);
        if (scoreDiff !== 0) return scoreDiff;

        return String(getTeamId(a)).localeCompare(String(getTeamId(b)));
      });

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

    const eliminationOrder = getEliminationOrder(allStandings);
    const eliminationIndex = eliminationOrder.findIndex(
      (team) => getTeamId(team) === targetTeamId,
    );
    const eliminatedNumber =
      eliminationIndex >= 0 ? eliminationIndex + 1 : eliminationOrder.length;

    const enrichedTeam = {
      ...targetTeam,
      originalRank: targetTeam.rank,
      rank: eliminatedNumber,
      eliminatedNumber,
      placementText: `Team Eliminated #${String(eliminatedNumber).padStart(
        2,
        "0",
      )}`,
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
