import http from "../../AxiosFile/axios";
import { GET_BROADCAST_TEAM_ROSTER, GET_PLAYER_UPLOADS } from "../../Routes/ApiRoutes/apiRoutes";
import { getSelectedTournamentSlug } from "../../Tournaments/tournamentState";
import { getTodaysPlayingTeamsApi, TodaysPlayingTeam } from "../../TeamRecordTable/Repositary/remote";

export type RosterPlayer = {
  uid?: string | number;
  name: string;
  playerPic: string;
  countryLogo?: string;
};

export type RosterTeam = {
  id?: string | number;
  teamId: string | number;
  teamName: string;
  tag?: string;
  teamLogo: string;
  countryLogo: string;
  players: RosterPlayer[];
};

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? "";

const unwrapRows = (payload: any) => {
  const data = payload?.data ?? payload;
  return data?.data || data?.teams || data?.rosters || data?.teamRosters || data || [];
};

const normalizeKey = (value: any) => String(value ?? "").trim().toLowerCase();

const getPlayerName = (player: any, index: number) =>
  String(firstValue(player?.playerName, player?.player_name, player?.name, player?.nickName, `Player ${index + 1}`));

const getPlayerPic = (player: any) =>
  String(firstValue(player?.playerPic, player?.player_pic, player?.playerImage, player?.player_image, player?.photoUrl, player?.avatarUrl));

const mapTeamRoster = (team: any): RosterTeam => {
  const rawPlayers = Array.isArray(team?.players) ? team.players : [];
  const photoPlayers = Array.isArray(team?.playerPhotos)
    ? team.playerPhotos.map((photoUrl: string, index: number) => ({
        playerName: `Player ${index + 1}`,
        playerPic: photoUrl,
      }))
    : [];
  const playersSource = rawPlayers.length ? rawPlayers : photoPlayers;
  const teamLogo = String(firstValue(team?.teamLogo, team?.team_logo, team?.logo, team?.logoUrl));
  const countryLogo = String(firstValue(team?.countryLogo, team?.country_logo, team?.flag, team?.countryUrl));

  return {
    id: firstValue(team?.id, team?._id, team?.teamId, team?.team_id),
    teamId: firstValue(team?.teamId, team?.team_id, team?.permanentTeamId, team?.permanent_team_id, team?.id),
    teamName: String(firstValue(team?.teamName, team?.team_name, team?.name, "Unnamed Team")),
    tag: String(firstValue(team?.shortTag, team?.short_tag, team?.teamTag, team?.team_tag, team?.tag)),
    teamLogo,
    countryLogo,
    players: playersSource.map((player: any, index: number) => ({
      uid: firstValue(player?.uid, player?.playerUid, player?.player_uid, player?.id),
      name: getPlayerName(player, index),
      playerPic: getPlayerPic(player),
      countryLogo: String(firstValue(player?.countryLogo, player?.country_logo, countryLogo)),
    })),
  };
};

const mergeTeamIdentity = (rosters: RosterTeam[], playingTeams: TodaysPlayingTeam[]) => {
  const byId = new Map(playingTeams.map((team) => [normalizeKey(team.teamId), team]));
  const byName = new Map(playingTeams.map((team) => [normalizeKey(team.name), team]));

  return rosters.map((roster) => {
    const playingTeam = byId.get(normalizeKey(roster.teamId)) || byName.get(normalizeKey(roster.teamName));

    return {
      ...roster,
      teamName: roster.teamName || playingTeam?.name || "Unnamed Team",
      tag: roster.tag || playingTeam?.tag,
      teamLogo: roster.teamLogo || playingTeam?.teamLogo || "",
      countryLogo: roster.countryLogo || playingTeam?.countryLogo || "",
    };
  });
};

const filterPlayingTeams = (rosters: RosterTeam[], playingTeams: TodaysPlayingTeam[]) => {
  if (!playingTeams.length) return rosters;
  const playingIds = new Set(playingTeams.map((team) => normalizeKey(team.teamId)));
  const playingNames = new Set(playingTeams.map((team) => normalizeKey(team.name)));

  return rosters.filter((team) => playingIds.has(normalizeKey(team.teamId)) || playingNames.has(normalizeKey(team.teamName)));
};

export const getBroadcastTeamRosterApi = async (): Promise<RosterTeam[]> => {
  const tournamentSlug = getSelectedTournamentSlug();

  try {
    const response = await http.get(GET_BROADCAST_TEAM_ROSTER(tournamentSlug), {
      params: { onlyPlaying: true, _t: Date.now() },
      headers: { "Cache-Control": "no-cache" },
    });
    const rows = unwrapRows(response);
    return Array.isArray(rows) ? rows.map(mapTeamRoster) : [];
  } catch {
    const [playersResponse, playingTeams] = await Promise.all([
      http.get(GET_PLAYER_UPLOADS),
      getTodaysPlayingTeamsApi().catch(() => [] as TodaysPlayingTeam[]),
    ]);
    const rows = unwrapRows(playersResponse);
    const rosters = Array.isArray(rows) ? rows.map(mapTeamRoster) : [];

    return filterPlayingTeams(mergeTeamIdentity(rosters, playingTeams), playingTeams);
  }
};
