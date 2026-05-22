import { useEffect, useRef, useState } from "react";
import TeamNotificationCard from "../../Components/EliminatedComponent/Eliminated";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";

const TeamEliminatedView = () => {
  const { standings, loading } = useLiveStandingsController();
  const [activeEliminatedTeam, setActiveEliminatedTeam] = useState(null);

  const shownEliminations = useRef(new Set());
  const timeoutRef = useRef(null);

  const getTotalDeadTime = (team) => {
    if (!team?.players || !Array.isArray(team.players)) return 0;
    return team.players.reduce(
      (sum, player) => sum + (Number(player?.deadTime) || 0),
      0,
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

  useEffect(() => {
    if (loading || !Array.isArray(standings) || standings.length === 0) return;

    const newEliminations = standings.filter(
      (team) => team?.isEliminated && !shownEliminations.current.has(team.id),
    );

    if (newEliminations.length === 0) return;

    const sortedEliminations = [...newEliminations].sort((a, b) => {
      const scoreA = Number(a.rankingScore) || 0;
      const scoreB = Number(b.rankingScore) || 0;

      if (scoreA !== scoreB) {
      }

      return getTotalDeadTime(a) - getTotalDeadTime(b);
    });

    const targetTeam = sortedEliminations[0];

    let isTwelfth = false;
    if (targetTeam.rankingScore === 0) {
      const allZeroScoreTeams = standings.filter(
        (t) => t?.rankingScore === 0 && t?.isEliminated,
      );

      if (allZeroScoreTeams.length > 1) {
        const otherTeam = allZeroScoreTeams.find((t) => t.id !== targetTeam.id);
        if (
          otherTeam &&
          getTotalDeadTime(targetTeam) <= getTotalDeadTime(otherTeam)
        ) {
          isTwelfth = true;
        }
      } else {
        isTwelfth = true;
      }
    }

    const accuratePlacement = getPlacement(targetTeam.rankingScore, isTwelfth);
    const enrichedTeam = {
      ...targetTeam,
      calculatedPlacement: accuratePlacement,
      placementText: accuratePlacement
        ? `${accuratePlacement}th Place`
        : "Eliminated",
    };

    shownEliminations.current.add(targetTeam.id);
    setActiveEliminatedTeam(enrichedTeam);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setActiveEliminatedTeam(null);
    }, 5000);
  }, [standings, loading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!activeEliminatedTeam) return null;

  return (
    <>
      <TeamNotificationCard team={activeEliminatedTeam} />
    </>
  );
};

export default TeamEliminatedView;
