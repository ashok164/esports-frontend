import { CHAMPION_RUSH_TARGET_POINTS } from "../../Routes/ApiRoutes/apiRoutes";

export type ChampionRushTeam = {
  id: string;
  name: string;
  logoUrl: string;
  points: number;
};

// Consume the overall API rows supplied by the existing live standings flow.
export const selectChampionRushTeams = (rows: any[]): ChampionRushTeam[] => {
  const teams = new Map<string, ChampionRushTeam>();
  rows.forEach((row) => {
    const points = Number(row?.total_score ?? row?.totalScore ?? row?.overall_score ?? row?.overallScore ?? row?.total_points ?? row?.totalPoints ?? 0);
    if (!Number.isFinite(points) || points < CHAMPION_RUSH_TARGET_POINTS) return;
    const name = String(row?.team_name ?? row?.teamName ?? row?.name ?? row?.short_tag ?? row?.teamTag ?? "TEAM");
    const id = String(row?.permanent_team_id ?? row?.permanentTeamId ?? row?.team_id ?? row?.teamId ?? row?.id ?? name);
    teams.set(id, {
      id,
      name,
      logoUrl: String(row?.team_logo ?? row?.teamLogo ?? row?.logoUrl ?? ""),
      points,
    });
  });
  return Array.from(teams.values()).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
};
