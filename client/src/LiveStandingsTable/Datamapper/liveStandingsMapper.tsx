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

const pick = (source: any, keys: string[], fallback: any = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

const toNumber = (value: any, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeTeamKey = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getTeamIdentityKeys = (team: any) =>
  [
    pick(team, [
      "permanentTeamId",
      "permanent_team_id",
      "teamId",
      "team_id",
      "teamID",
      "teamid",
      "id",
      "_id",
    ]),
    pick(team, ["teamTag", "team_tag", "shortTag", "short_tag", "tag"]),
    pick(team, ["teamName", "team_name", "name"]),
  ]
    .map(normalizeTeamKey)
    .filter(Boolean);

const getPrimaryTeamId = (team: any, fallback: string | number) =>
  pick(
    team,
    [
      "permanentTeamId",
      "permanent_team_id",
      "teamId",
      "team_id",
      "teamID",
      "teamid",
      "id",
      "_id",
    ],
    fallback,
  );

const getHistoricalPoints = (team: any) =>
  toNumber(
    pick(
      team,
      [
        "historicalPoints",
        "historical_points",
        "totalPoints",
        "total_points",
        "totalScore",
        "total_score",
        "totalKills",
        "total_kills",
        "overallScore",
        "overall_score",
        "points",
      ],
      0,
    ),
  );

const getLiveKills = (team: any) =>
  toNumber(
    pick(
      team,
      [
        "liveKills",
        "live_kills",
        "currentKills",
        "current_kills",
        "totalKills",
        "total_kills",
        "kills",
        "killing_score",
        "kill_count",
      ],
      0,
    ),
  );

const getLivePlacementPoints = (team: any) =>
  toNumber(
    pick(
      team,
      [
        "livePlacementPoints",
        "live_placement_points",
        "currentPlacementPoints",
        "current_placement_points",
        "placementPoints",
        "placement_points",
        "rankingScore",
        "ranking_score",
        "survival_score",
      ],
      0,
    ),
  );

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
  console.log({ liveTeams, historicalTeams });
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
    const identityKeys = getTeamIdentityKeys(historicalTeam);
    const liveTeam = identityKeys
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
      teamTag: String(
        pick(
          historicalTeam,
          ["teamTag", "team_tag", "shortTag", "short_tag", "tag"],
          mappedLiveTeam?.teamTag || "",
        ),
      ),
      name: String(
        pick(
          historicalTeam,
          ["teamName", "team_name", "name"],
          mappedLiveTeam?.name || "UNKNOWN",
        ),
      ),
      logoUrl: String(
        pick(
          historicalTeam,
          ["teamLogo", "team_logo", "logo", "logoUrl"],
          mappedLiveTeam?.logoUrl || "",
        ),
      ),
      countryUrl: String(
        pick(
          historicalTeam,
          ["countryLogo", "country_logo", "flag", "countryUrl"],
          mappedLiveTeam?.countryUrl || "",
        ),
      ),
      kills: liveKills,
      liveKills,
      placementPoints: livePlacementPoints,
      livePlacementPoints,
      historicalKills: toNumber(
        pick(historicalTeam, ["kills", "kill_score", "kill"], 0),
      ),
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
    const rawPlayers = team?.players || team?.player_stats || [];
    const permanentTeamId = pick(
      team,
      ["permanentTeamId", "permanent_team_id", "teamId", "team_id"],
      team?.team_name || teamIndex,
    );
    const roomTeamId = pick(team, ["roomTeamId", "room_team_id"], null);
    const backendRank = toNumber(team?.rank, 0);
    const isOverallRow =
      team?.totalPoints !== undefined ||
      team?.historicalPoints !== undefined ||
      team?.livePoints !== undefined ||
      team?.isPlaying !== undefined;

    const normalizedRawPlayers = rawPlayers.map((p: any) => ({
      ...p,
      playerPic: p.playerPic,
    }));

    const sortedRawPlayers = [...normalizedRawPlayers].sort((a, b) =>
      String(
        pick(a, ["account_id", "player_uid", "playerUid", "id"]),
      ).localeCompare(
        String(pick(b, ["account_id", "player_uid", "playerUid", "id"])),
      ),
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
        (pl) =>
          String(pl.id) ===
          String(pick(p, ["account_id", "player_uid", "playerUid", "id"])),
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
        id: pick(p, ["account_id", "player_uid", "playerUid", "id"]),
        name: pick(
          p,
          ["nickname", "player_name", "playerName", "name"],
          "Unknown",
        ),
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
    const isPlaying = Boolean(team?.isPlaying ?? rawPlayers.length > 0);
    const kills = toNumber(
      pick(
        team,
        [
          "totalKills",
          "total_kills",
          "kills",
          "liveKills",
          "killing_score",
          "kill_count",
        ],
        0,
      ),
    );

    return {
      id: permanentTeamId,
      permanentTeamId,
      roomTeamId,
      teamTag: pick(team, ["teamTag", "team_tag", "tag"], ""),
      name: pick(team, ["teamName", "team_name", "name"], "UNKNOWN"),
      logoUrl: pick(team, ["teamLogo", "team_logo", "logo", "logoUrl"], ""),
      countryUrl: pick(
        team,
        ["countryLogo", "country_logo", "flag", "countryUrl"],
        "",
      ),
      kills,
      liveKills: toNumber(team?.liveKills, 0),
      historicalKills: toNumber(team?.historicalKills, 0),
      livePoints: toNumber(team?.livePoints, 0),
      historicalPoints: toNumber(team?.historicalPoints, 0),
      totalPoints: toNumber(team?.totalPoints, kills),
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
      rankingScore: toNumber(
        team?.rankingScore ?? team?.ranking_score ?? team?.totalPoints,
        0,
      ),
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
