import { useEffect, useMemo, useRef, useState } from "react";
import { warmImageUrls } from "../../BroadcastImageCache/imageCache";
import TeamNotificationCard from "../../Components/EliminatedComponent/Eliminated";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";

const TeamEliminatedView = () => {
  const { standings, loading } = useLiveStandingsController({
    forceLiveMatchStandings: true,
  });
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [activeEliminatedTeam, setActiveEliminatedTeam] = useState(null);
  const [isFinalPhaseLocked, setIsFinalPhaseLocked] = useState(false);

  const shownEliminations = useRef(new Set());
  const previousEliminatedIds = useRef(new Set());
  const hasBaseline = useRef(false);
  const queuedEliminations = useRef([]);
  const isShowingElimination = useRef(false);
  const timeoutRef = useRef(null);

  const getTeamId = (team) => String(team?.id ?? team?.name ?? "");

  const getEliminationTime = (team) => {
    if (!team?.players || !Array.isArray(team.players)) return 0;

    return Math.max(
      0,
      ...team.players.map((player) => Number(player?.deadTime) || 0),
    );
  };

  const getTotalPlayerDeathTime = (team) => {
    if (!team?.players || !Array.isArray(team.players)) return 0;

    return team.players.reduce(
      (total, player) => total + (Number(player?.deadTime) || 0),
      0,
    );
  };

  const compareEliminationOrder = (a, b) => {
    const timeDiff = getEliminationTime(a) - getEliminationTime(b);
    if (timeDiff !== 0) return timeDiff;

    const scoreA = Number(a?.rankingScore) || 0;
    const scoreB = Number(b?.rankingScore) || 0;
    const scoreDiff = scoreA - scoreB;
    if (scoreDiff !== 0) return scoreDiff;

    const totalDeathTimeDiff =
      getTotalPlayerDeathTime(a) - getTotalPlayerDeathTime(b);
    if (totalDeathTimeDiff !== 0) return totalDeathTimeDiff;

    return String(getTeamId(a)).localeCompare(String(getTeamId(b)));
  };

  const getEliminationOrder = (teams) =>
    [...teams]
      .filter((team) => team?.isEliminated)
      .sort(compareEliminationOrder);

  const buildEliminatedTeam = (targetTeam, allStandings) => {
    const eliminationOrder = getEliminationOrder(allStandings);
    const eliminationIndex = eliminationOrder.findIndex(
      (team) => getTeamId(team) === getTeamId(targetTeam),
    );
    const totalTeams = Array.isArray(allStandings) ? allStandings.length : 0;
    const eliminatedNumber =
      eliminationIndex >= 0
        ? Math.max(1, totalTeams - eliminationIndex)
        : Math.max(1, totalTeams - eliminationOrder.length + 1);

    return {
      ...targetTeam,
      originalRank: targetTeam.rank,
      rank: eliminatedNumber,
      eliminatedNumber,
      placementText: `Team Eliminated #${String(eliminatedNumber).padStart(
        2,
        "0",
      )}`,
    };
  };

  const warmTeamAssets = (team) => {
    const urls = [];

    if (team?.logoUrl) urls.push(team.logoUrl);
    if (team?.countryFlag) urls.push(team.countryFlag);
    if (team?.countryUrl) urls.push(team.countryUrl);

    if (Array.isArray(team?.players)) {
      team.players.forEach((player) => {
        const src =
          player?.playerPic ||
          player?.avatarUrl ||
          player?.photoUrl ||
          player?.player_image ||
          player?.player_pic ||
          "";

        if (src) urls.push(src);
      });
    }

    warmImageUrls(urls).catch(() => undefined);
  };

  const showNextQueuedElimination = () => {
    if (isShowingElimination.current) return;

    const nextTeam = queuedEliminations.current.shift();
    if (!nextTeam) return;

    isShowingElimination.current = true;
    setActiveEliminatedTeam(nextTeam);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setActiveEliminatedTeam(null);
      isShowingElimination.current = false;
      showNextQueuedElimination();
    }, 5000);
  };

  const queueEliminatedTeams = (targetTeams, allStandings) => {
    const orderedTeams = [...targetTeams].sort(compareEliminationOrder);

    orderedTeams.forEach((team) => {
      const teamId = getTeamId(team);
      if (!teamId || shownEliminations.current.has(teamId)) return;

      shownEliminations.current.add(teamId);
      queuedEliminations.current.push(buildEliminatedTeam(team, allStandings));
    });

    showNextQueuedElimination();
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
      queueEliminatedTeams(
        standings.filter((team) => team?.isEliminated),
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

    queueEliminatedTeams(newEliminations, standings);
  }, [standings, loading, isThemeLoading]);

  useEffect(() => {
    if (!Array.isArray(standings) || standings.length === 0) return;

    standings.forEach((team) => {
      warmTeamAssets(team);
    });
  }, [standings]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      queuedEliminations.current = [];
      isShowingElimination.current = false;
    };
  }, []);

  const aliveTeamsCount = useMemo(
    () =>
      Array.isArray(standings)
        ? standings.filter(
            (team) =>
              Number(team?.playersAlive ?? 0) > 0 &&
              !team?.isEliminated,
          ).length
        : 0,
    [standings],
  );

  useEffect(() => {
    if (aliveTeamsCount === 4) {
      setIsFinalPhaseLocked(true);
      return;
    }

    if (aliveTeamsCount === 0 || aliveTeamsCount > 4) {
      setIsFinalPhaseLocked(false);
    }
  }, [aliveTeamsCount]);

  if (isThemeLoading || !activeEliminatedTeam || isFinalPhaseLocked) return null;

  return (
    <>
      <TeamNotificationCard team={activeEliminatedTeam} />
    </>
  );
};

export default TeamEliminatedView;
