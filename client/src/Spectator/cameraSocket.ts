import { connectRealtime, getRealtimeData, subscribeRealtime } from "../GlobalWebsocket/store";

export type SavedPlayerProfile = {
  uid: string;
  playerName: string;
  playerPic: string;
  cameraLink: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  countryLogo: string;
};

export type CameraSocketPayload = {
  spectatorId: string;
  matchId: string;
  playerId: string;
  name: string;
  camera: string;
  teamName?: string;
};

type CameraSocketListener = (payload: CameraSocketPayload | null) => void;

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "") ?? "";

const collectSpectatorRows = (result: any) => {
  const source =
    result?.data?.match?.match_stats_extra?.spector_info ??
    result?.match?.match_stats_extra?.spector_info ??
    result?.data?.matchStatsExtra?.spectorInfo ??
    result?.matchStatsExtra?.spectorInfo ??
    [];

  return Array.isArray(source)
    ? source.map((row: any) => ({
        spectatorId: String(firstValue(row?.spector_id, row?.spectator_id, row?.spectId, "")).trim(),
        observerId: String(firstValue(row?.observer_id, row?.observerId, "")).trim(),
        observerName: String(firstValue(row?.observer_name, row?.observerName, "")),
        observerTeamName: String(firstValue(row?.observer_team_name, row?.observerTeamName, "")),
      }))
    : [];
};

export const normalizeSavedPlayers = (rows: any[]) => {
  const byUid = new Map<string, SavedPlayerProfile>();

  rows.forEach((record: any) => {
    const teamId = String(record?.teamId || record?.team_id || record?.team || "");
    const teamName = String(
      record?.teamName ||
      record?.team_name ||
      record?.name ||
      record?.team?.teamName ||
      record?.team?.team_name ||
      "",
    );
    const teamLogo = String(record?.teamLogo || record?.team_logo || "");
    const countryLogo = String(record?.countryLogo || record?.country_logo || "");
    const rawPlayers = Array.isArray(record?.players)
      ? record.players
      : Array.isArray(record?.playerDetails)
        ? record.playerDetails
        : Array.isArray(record?.player_details)
          ? record.player_details
          : [];

    rawPlayers.forEach((player: any) => {
      const uid = String(
        player?.uid ||
        player?.playerUid ||
        player?.player_uid ||
        player?.player_id ||
        player?.playerId ||
        "",
      ).trim();

      if (!uid) return;

      byUid.set(uid, {
        uid,
        playerName: String(
          player?.playerName ||
          player?.player_name ||
          player?.player ||
          player?.name ||
          player?.nickname ||
          "",
        ),
        playerPic: String(
          player?.playerPic ||
          player?.player_pic ||
          player?.playerPhoto ||
          player?.player_photo ||
          player?.photo ||
          player?.image ||
          "",
        ),
        cameraLink: String(
          player?.cameraLink ||
          player?.camera_link ||
          player?.camera ||
          player?.link ||
          "",
        ),
        teamId,
        teamName,
        teamLogo,
        countryLogo,
      });
    });
  });

  return byUid;
};

export const mapCameraSocketPayload = (
  result: any,
  spectatorId: string,
  activeMatchId: string,
  savedPlayers: Map<string, SavedPlayerProfile>,
): CameraSocketPayload | null => {
  const spectatorRows = collectSpectatorRows(result);
  const spectatorRow = spectatorRows.find((row) => row.spectatorId === spectatorId.trim());
  const observerId = spectatorRow?.observerId || spectatorId.trim();
  const savedPlayer = savedPlayers.get(observerId) || savedPlayers.get(spectatorId.trim());

  if (!spectatorRow && !savedPlayer) {
    return null;
  }

  return {
    spectatorId,
    matchId: String(result?.data?.matchId ?? result?.matchId ?? activeMatchId),
    playerId: observerId,
    name:
      savedPlayer?.playerName ||
      spectatorRow?.observerName ||
      `Player ${observerId || spectatorId}`,
    camera: savedPlayer?.cameraLink || "",
    teamName: spectatorRow?.observerTeamName || savedPlayer?.teamName || "",
  };
};

export const connectCameraSocket = (matchId: string) => {
  connectRealtime(matchId);
};

export const getCameraSocketSnapshot = (
  spectatorId: string,
  activeMatchId: string,
  savedPlayers: Map<string, SavedPlayerProfile>,
) => {
  const currentData = getRealtimeData();
  if (!currentData) return null;
  return mapCameraSocketPayload(currentData, spectatorId, activeMatchId, savedPlayers);
};

export const subscribeCameraSocket = (
  spectatorId: string,
  activeMatchId: string,
  savedPlayers: Map<string, SavedPlayerProfile>,
  callback: CameraSocketListener,
) =>
  subscribeRealtime((payload) => {
    callback(mapCameraSocketPayload(payload, spectatorId, activeMatchId, savedPlayers));
  });
