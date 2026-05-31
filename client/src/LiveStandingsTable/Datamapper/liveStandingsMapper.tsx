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
  permanentTeamId?: string | number;
  roomTeamId?: string | number | null;
  name: string;
  teamTag: string;
  logoUrl: string;
  countryUrl: string;
  kills: number;
  liveKills?: number;
  placementPoints?: number;
  livePlacementPoints?: number;
  historicalKills?: number;
  livePoints?: number;
  historicalPoints?: number;
  totalPoints?: number;
  isPlaying?: boolean;
  players: Player[];
  playersAlive: number;
  totalPlayers: number;
  isEliminated: boolean;
  hpPercent: number;
  rank: number;
  rankingScore: number;
  isOverallRow?: boolean;
}

/* ================= MAPPING FUNCTION ================= */

const toNumber = (value: any, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeTeamKey = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null) ?? "";

const getTeamIdentityKeys = (team: any) =>
  [
    firstValue(team?.team_id, team?.permanent_team_id, team?.teamId, team?.permanentTeamId),
    firstValue(team?.short_tag, team?.team_tag, team?.teamTag, team?.tag),
    firstValue(team?.team_name, team?.teamName, team?.name),
  ]
    .map(normalizeTeamKey)
    .filter(Boolean);

const getPrimaryTeamId = (team: any, fallback: string | number) =>
  firstValue(team?.team_id, team?.permanent_team_id, team?.teamId, team?.permanentTeamId, fallback);

const getHistoricalPoints = (team: any) =>
  toNumber(firstValue(team?.historical_points, team?.historicalPoints, team?.total_points, team?.totalPoints, team?.points, 0));

const getLiveKills = (team: any) =>
  toNumber(firstValue(team?.live_kills, team?.liveKills, team?.killing_score, team?.kill_count, team?.kills, 0));

const getLivePlacementPoints = (team: any) =>
  toNumber(firstValue(team?.live_placement_points, team?.livePlacementPoints, team?.ranking_score, 0));

const getIdentitySignature = (team: Team) =>
  [
    team.id,
    team.name,
    team.teamTag,
    team.logoUrl,
    team.countryUrl,
    team.kills,
    team.liveKills,
    team.placementPoints,
    team.livePlacementPoints,
    team.livePoints,
    team.historicalPoints,
    team.totalPoints,
    team.isPlaying,
    team.playersAlive,
    team.totalPlayers,
    team.isEliminated,
    team.hpPercent,
    team.rank,
    team.rankingScore,
  ].join("|");

const withStableObjects = (nextTeams: Team[], previousTeamsState?: Team[]) =>
  nextTeams.map((team) => {
    const previousTeam = previousTeamsState?.find(
      (item) => String(item.id) === String(team.id),
    );
    return previousTeam &&
      getIdentitySignature(previousTeam) === getIdentitySignature(team)
      ? previousTeam
      : team;
  });

export const mergeHistoricalWithLiveStandings = (
  historicalTeams: any[],
  liveTeams: any[],
  previousTeamsState?: Team[],
): Team[] => {
  const previousById = new Map(
    (previousTeamsState || []).map((team) => [String(team.id), team]),
  );
  const liveByKey = new Map<string, any>();

  (liveTeams || []).forEach((team) => {
    getTeamIdentityKeys(team).forEach((key) => {
      if (!liveByKey.has(key)) liveByKey.set(key, team);
    });
  });

  const baseRows = historicalTeams.length > 0 ? historicalTeams : liveTeams;

  const merged = (baseRows || []).map((historicalTeam, index) => {
    const liveTeam = getTeamIdentityKeys(historicalTeam)
      .map((key) => liveByKey.get(key))
      .find(Boolean);
    const teamId = getPrimaryTeamId(historicalTeam, index + 1);
    const previousTeam = previousById.get(String(teamId));
    const liveKills = liveTeam ? getLiveKills(liveTeam) : 0;
    const livePlacementPoints = liveTeam ? getLivePlacementPoints(liveTeam) : 0;
    const livePoints = liveKills + livePlacementPoints;
    const historicalPoints = getHistoricalPoints(historicalTeam);
    const totalPoints = historicalPoints + livePoints;
    const mappedLiveTeam = liveTeam
      ? mapTeamData([liveTeam], previousTeamsState)[0]
      : null;

    return {
      id: teamId,
      permanentTeamId: teamId,
      roomTeamId: mappedLiveTeam?.roomTeamId ?? null,
      teamTag: String(firstValue(historicalTeam?.short_tag, historicalTeam?.teamTag, mappedLiveTeam?.teamTag, "")),
      name: String(firstValue(historicalTeam?.team_name, historicalTeam?.teamName, mappedLiveTeam?.name, "UNKNOWN")),
      logoUrl: String(firstValue(historicalTeam?.team_logo, historicalTeam?.teamLogo, mappedLiveTeam?.logoUrl, "")),
      countryUrl: String(firstValue(historicalTeam?.country_logo, historicalTeam?.countryLogo, mappedLiveTeam?.countryUrl, "")),
      kills: liveKills,
      liveKills,
      placementPoints: livePlacementPoints,
      livePlacementPoints,
      historicalKills: toNumber(firstValue(historicalTeam?.historical_kills, historicalTeam?.historicalKills, historicalTeam?.kill_score, historicalTeam?.kills, 0)),
      livePoints,
      historicalPoints,
      totalPoints,
      isPlaying: Boolean(liveTeam),
      players: mappedLiveTeam?.players || previousTeam?.players || [],
      playersAlive:
        mappedLiveTeam?.playersAlive ?? previousTeam?.playersAlive ?? 0,
      totalPlayers:
        mappedLiveTeam?.totalPlayers ?? previousTeam?.totalPlayers ?? 0,
      isEliminated: Boolean(liveTeam && mappedLiveTeam?.isEliminated),
      hpPercent: mappedLiveTeam?.hpPercent ?? previousTeam?.hpPercent ?? 0,
      rank: 0,
      rankingScore: totalPoints,
      isOverallRow: true,
    };
  });

  const sorted = merged
    .sort((a, b) => {
      const pointsDiff = toNumber(b.totalPoints) - toNumber(a.totalPoints);
      if (pointsDiff !== 0) return pointsDiff;

      const liveDiff = toNumber(b.livePoints) - toNumber(a.livePoints);
      if (liveDiff !== 0) return liveDiff;

      const killsDiff = toNumber(b.kills) - toNumber(a.kills);
      if (killsDiff !== 0) return killsDiff;

      return String(a.name).localeCompare(String(b.name), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

  return withStableObjects(sorted, previousTeamsState);
};

export const mapTeamData = (
  data: any[],
  previousTeamsState?: Team[],
): Team[] => {
  const mapped = (data || []).map((team, teamIndex) => {
    const rawPlayers = team?.player_stats || team?.players || [];
    const permanentTeamId = firstValue(team?.team_id, team?.permanent_team_id, team?.teamId, team?.permanentTeamId, team?.team_name, teamIndex);
    const roomTeamId = firstValue(team?.room_team_id, team?.roomTeamId, null);
    const backendRank = toNumber(team?.rank, 0);
    const isOverallRow =
      team?.total_points !== undefined ||
      team?.totalPoints !== undefined ||
      team?.historical_points !== undefined ||
      team?.historicalPoints !== undefined ||
      team?.live_points !== undefined ||
      team?.livePoints !== undefined ||
      team?.is_playing !== undefined ||
      team?.isPlaying !== undefined;

    const sortedRawPlayers = [...rawPlayers].sort((a, b) =>
      String(a?.account_id ?? "").localeCompare(String(b?.account_id ?? "")),
    );

    const prevTeam = previousTeamsState?.find(
      (t) => String(t.id) === String(permanentTeamId),
    );

    const mappedPlayers: Player[] = sortedRawPlayers.map((p: any) => {
      const hp = p.hp_info?.current_hp ?? 0;
      const maxHp = p.hp_info?.total_hp ?? 200;
      const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;

      const isAliveBase = hp > 0;
      let isKnocked = p.player_state !== 0 && p.hp_info?.current_hp > 0;
      let status: "alive" | "knocked" | "dead" = "dead";

      const prevPlayer = prevTeam?.players?.find(
        (pl) => String(pl.id) === String(p?.account_id),
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
        id: p?.account_id,
        name: p?.nickname || "Unknown",
        hp,
        maxHp,
        hpPercent: Math.max(0, Math.min(100, hpPercent)),
        isAlive: isAliveBase || isKnocked,
        isKnocked,
        status,
        hasRecalled, // <-- Retained in state payload
        deadTime: p?.be_killed_time,
        playerPic: p?.player_image || undefined,
      };
    });

    const totalSquadHp = mappedPlayers.reduce((sum, p) => sum + p.hp, 0);
    const totalMaxHp = mappedPlayers.reduce((sum, p) => sum + p.maxHp, 0);
    const squadHpPercent =
      totalMaxHp > 0 ? (totalSquadHp / totalMaxHp) * 100 : 0;

    const aliveCount = mappedPlayers.filter(
      (p) => p.status === "alive" || p.status === "knocked",
    ).length;
    const isPlaying = Boolean(
      firstValue(team?.is_playing, team?.isPlaying, rawPlayers.length > 0),
    );
    const kills = toNumber(team?.killing_score ?? team?.kill_count, 0);

    return {
      id: permanentTeamId,
      permanentTeamId,
      roomTeamId,
      teamTag: firstValue(team?.short_tag, team?.team_tag, team?.teamTag, ""),
      name: firstValue(team?.team_name, team?.teamName, "UNKNOWN"),
      logoUrl: firstValue(team?.team_logo, team?.teamLogo, ""),
      countryUrl: firstValue(team?.country_logo, team?.countryLogo, ""),
      kills,
      liveKills: toNumber(
        firstValue(team?.live_kills, team?.liveKills, team?.killing_score, 0),
      ),
      historicalKills: toNumber(
        firstValue(team?.historical_kills, team?.historicalKills, 0),
      ),
      livePoints: toNumber(firstValue(team?.live_points, team?.livePoints, 0)),
      historicalPoints: toNumber(
        firstValue(team?.historical_points, team?.historicalPoints, 0),
      ),
      totalPoints: toNumber(firstValue(team?.total_points, team?.totalPoints, kills)),
      isPlaying,
      players: mappedPlayers,
      playersAlive: aliveCount,
      totalPlayers: mappedPlayers.length,
      isEliminated: Boolean(
        team?.is_eliminated ||
        (isPlaying && mappedPlayers.length > 0 && aliveCount === 0),
      ),
      hpPercent: Math.round(squadHpPercent),
      rank: backendRank,
      rankingScore: toNumber(team?.ranking_score ?? team?.total_points, 0),
      isOverallRow,
    };
  });

  const hasBackendRanks = mapped.some((team) => team.rank > 0);
  const sorted = hasBackendRanks
    ? mapped.sort((a, b) => a.rank - b.rank)
    : mapped.sort((a, b) => b.kills - a.kills);

  return sorted.map((team, index) => ({
    ...team,
    rank: team.rank > 0 ? team.rank : index + 1,
  }));
};
