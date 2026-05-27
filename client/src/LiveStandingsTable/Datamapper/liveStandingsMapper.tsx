/* ================= DATA INTERFACES ================= */

export interface Player {
  id: string | number;
  name: string;
  hp: number;
  maxHp: number;
  hpPercent: number;
  isAlive: boolean;
  isKnocked: boolean;
  status: "alive" | "knocked" | "dead";
  hasRecalled: boolean; // <-- Added persistent death tracker
  deadTime: number;
  playerPic?: string;
}

export interface Team {
  id: string | number;
  name: string;
  teamTag: string;
  logoUrl: string;
  countryUrl: string;
  kills: number;
  players: Player[];
  playersAlive: number;
  totalPlayers: number;
  isEliminated: boolean;
  hpPercent: number;
  rank: number;
  rankingScore: number;
}

/* ================= MAPPING FUNCTION ================= */

export const mapTeamData = (
  data: any[],
  previousTeamsState?: Team[],
): Team[] => {
  console.log(data,'originaldata')
  const mapped = (data || []).map((team, teamIndex) => {
    const rawPlayers = team?.players || team?.player_stats || [];

    const normalizedRawPlayers = rawPlayers.map((p: any) => ({
      ...p,
      playerPic: p.playerPic,
    }));


    const sortedRawPlayers = [...normalizedRawPlayers].sort((a, b) =>
      String(a.account_id || "").localeCompare(String(b.account_id || "")),
    );

    const prevTeam = previousTeamsState?.find(
      (t) => t.id === (team?.team_id || team?.team_name || teamIndex),
    );

    const mappedPlayers: Player[] = sortedRawPlayers.map((p: any) => {
      const hp = p.hp_info?.current_hp ?? 0;
      const maxHp = p.hp_info?.total_hp ?? 200;
      const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;

      const isAliveBase = hp > 0;
      let isKnocked = p.player_state !== 0 && p.hp_info?.current_hp > 0;
      let status: "alive" | "knocked" | "dead" = "dead";

      const prevPlayer = prevTeam?.players?.find(
        (pl) => String(pl.id) === String(p.account_id),
      );

      // 1. DETERMINE CURRENT STATUS & KNOCK PHASES
      if (isAliveBase) {
        status = "alive";
      } else {
        if (prevPlayer) {
          if (prevPlayer.status === "knocked" && p.player_state !== 1) {
            isKnocked = true;
            status = "knocked";
          } else if (prevPlayer.hp > 0 && hp === 0 && p.player_state === 0) {
            isKnocked = true;
            status = "knocked";
          } else {
            status = "dead";
          }
        } else {
          if (p.player_state === 0) {
            isKnocked = true;
            status = "knocked";
          } else {
            status = "dead";
          }
        }
      }

      // 2. PERSISTENT DEATH TRACKER (hasRecalled)
      let hasRecalled = false;

      // If they were already confirmed dead in history, it stays true forever
      if (prevPlayer && prevPlayer.hasRecalled) {
        hasRecalled = true;
      }
      // If they are strictly dead right now (HP is 0 and they are not just knocked)
      else if (
        status === "alive" &&
        p.player_state === 0 &&
        p.be_killed_time > 0
      ) {
        hasRecalled = true;
      }

      return {
        id: p.account_id,
        name: p.nickname || "Unknown",
        hp,
        maxHp,
        hpPercent: Math.max(0, Math.min(100, hpPercent)),
        isAlive: isAliveBase || isKnocked,
        isKnocked,
        status,
        hasRecalled, // <-- Retained in state payload
        deadTime: p?.be_killed_time,
        playerPic:
          p.playerPic ||
          p.player_pic ||
          p.avatar ||
          p.photoUrl ||
          p.avatarUrl ||
          p.player_image ||
          undefined,
      };
    });

    const totalSquadHp = mappedPlayers.reduce((sum, p) => sum + p.hp, 0);
    const totalMaxHp = mappedPlayers.reduce((sum, p) => sum + p.maxHp, 0);
    const squadHpPercent =
      totalMaxHp > 0 ? (totalSquadHp / totalMaxHp) * 100 : 0;

    const aliveCount = mappedPlayers.filter(
      (p) => p.status === "alive" || p.status === "knocked",
    ).length;

    return {
      id: team?.team_id || team?.team_name || teamIndex,
      teamTag: team?.teamTag || team?.team_tag || team?.tag || "",
      name: team?.team_name || "UNKNOWN",
      logoUrl: team?.logo || team?.team_logo || team?.logoUrl || "",
      countryUrl: team?.flag || team?.country_logo || team?.countryUrl || "",
      kills: team?.killing_score || 0,
      players: mappedPlayers,
      playersAlive: aliveCount,
      totalPlayers: mappedPlayers.length,
      isEliminated: team?.is_eliminated || aliveCount === 0,
      hpPercent: Math.round(squadHpPercent),
      rank: 0,
      rankingScore: team?.ranking_score,
    };
  });

  const sorted = mapped.sort((a, b) => b.kills - a.kills);

  return sorted.map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
};
