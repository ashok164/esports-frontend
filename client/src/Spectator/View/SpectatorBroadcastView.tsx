import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { connectRealtime, getRealtimeData, subscribeRealtime } from "../../GlobalWebsocket/store";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
} from "../../GameDetails/gameDetailsState";
import { getPlayerUploadsApi } from "../../PlayerUpload/Repository/remote";

type CameraUpdatePayload = {
  spectatorId: string;
  matchId: string;
  playerId: string;
  name: string;
  camera: string;
  observerName?: string;
  teamName?: string;
  teamTag?: string;
  hp?: number;
  isAlive?: boolean;
};

type SavedPlayerProfile = {
  uid: string;
  playerName: string;
  playerPic: string;
  cameraLink: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  countryLogo: string;
};

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "") ?? "";

const normalizeImageUrl = (path: string) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return path;
};

const normalizeSavedPlayers = (rows: any[]) => {
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
        playerPic: normalizeImageUrl(
          String(
            player?.playerPic ||
            player?.player_pic ||
            player?.playerPhoto ||
            player?.player_photo ||
            player?.photo ||
            player?.image ||
            "",
          ),
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

const collectLiveRows = (result: any) => {
  const overallRankingEnabled = Boolean(
    result?.data?.settings?.overallRankingEnabled ??
    result?.data?.settings?.overall_ranking_enabled ??
    result?.settings?.overallRankingEnabled ??
    result?.settings?.overall_ranking_enabled,
  );

  const source =
    (overallRankingEnabled
      ? result?.data?.liveOverall ?? result?.liveOverall
      : result?.data?.liveMatchStandings ?? result?.liveMatchStandings) ??
    result?.data?.liveStandings2 ??
    result?.liveStandings2 ??
    result?.data?.standings ??
    result?.data?.team_stats ??
    result?.standings ??
    result?.team_stats ??
    (Array.isArray(result) ? result : null);

  return Array.isArray(source) ? source : [];
};

const flattenLivePlayers = (result: any) =>
  collectLiveRows(result).flatMap((team: any) => {
    const players = Array.isArray(team?.player_stats)
      ? team.player_stats
      : Array.isArray(team?.players)
        ? team.players
        : [];

    return players.map((player: any) => ({
      uid: String(
        firstValue(player?.account_id, player?.player_uid, player?.playerUid, player?.id),
      ).trim(),
      name: String(
        firstValue(player?.nickname, player?.player_name, player?.playerName, player?.name, "Unknown"),
      ),
      cameraLink: String(
        firstValue(player?.camera_link, player?.cameraLink, player?.camera, player?.link, ""),
      ),
      hp: Number(firstValue(player?.hp_info?.current_hp, player?.hpInfo?.currentHp, 0)),
      isAlive: Number(firstValue(player?.hp_info?.current_hp, player?.hpInfo?.currentHp, 0)) > 0,
      teamName: String(firstValue(team?.team_name, team?.teamName, team?.name, "")),
      teamTag: String(firstValue(team?.short_tag, team?.teamTag, team?.tag, "")),
    }));
  });

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

const SpectatorBroadcastView: React.FC = () => {
  const { spectId = "" } = useParams();
  const [camera, setCamera] = React.useState<CameraUpdatePayload | null>(null);
  const [savedPlayers, setSavedPlayers] = React.useState<Map<string, SavedPlayerProfile>>(new Map());
  const [activeMatchId, setActiveMatchId] = React.useState(() => getActiveGameDetails().matchIds);
  const [status, setStatus] = React.useState("Loading spectator mapping...");

  React.useEffect(() => {
    let isMounted = true;

    getPlayerUploadsApi()
      .then((response) => {
        if (!isMounted) return;
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.playerUploads)
            ? response.playerUploads
            : Array.isArray(response)
              ? response
              : [];
        setSavedPlayers(normalizeSavedPlayers(rows));
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setStatus(error?.response?.data?.message || error?.message || "Failed to load player details.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const syncMatchId = () => {
      setActiveMatchId(getActiveGameDetails().matchIds);
    };

    syncMatchId();
    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, syncMatchId);
    window.addEventListener("storage", syncMatchId);

    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, syncMatchId);
      window.removeEventListener("storage", syncMatchId);
    };
  }, []);

  React.useEffect(() => {
    if (!spectId.trim()) {
      setStatus("Missing spectator ID in route.");
      return;
    }

    if (!activeMatchId.trim()) {
      setCamera(null);
      setStatus("No enabled websocket match ID found in game details.");
      return;
    }

    connectRealtime(activeMatchId);

    const syncCamera = (payload: any) => {
      const spectatorRows = collectSpectatorRows(payload);
      const livePlayers = flattenLivePlayers(payload);
      const spectatorRow = spectatorRows.find((row) => row.spectatorId === spectId.trim());
      const observerId = spectatorRow?.observerId || spectId.trim();
      const livePlayer = livePlayers.find((player) => player.uid === observerId);
      const savedPlayer = savedPlayers.get(observerId) || savedPlayers.get(spectId.trim());

      if (!spectatorRow && !livePlayer && !savedPlayer) {
        setCamera(null);
        setStatus(`No live spectator mapping found for ${spectId} on match ${activeMatchId}.`);
        return;
      }

      const nextCamera = {
        spectatorId: spectId,
        matchId: String(payload?.data?.matchId ?? payload?.matchId ?? activeMatchId),
        playerId: observerId,
        name:
          livePlayer?.name ||
          savedPlayer?.playerName ||
          spectatorRow?.observerName ||
          `Player ${observerId || spectId}`,
        camera: savedPlayer?.cameraLink || livePlayer?.cameraLink || "",
        observerName: spectatorRow?.observerName || livePlayer?.name || savedPlayer?.playerName || "",
        teamName:
          livePlayer?.teamName ||
          spectatorRow?.observerTeamName ||
          savedPlayer?.teamName ||
          "",
        teamTag: livePlayer?.teamTag || "",
        hp: livePlayer?.hp,
        isAlive: livePlayer?.isAlive,
      };

      setCamera(nextCamera);
      setStatus(
        spectatorRow
          ? `Spectator ${spectId} mapped from websocket on match ${nextCamera.matchId}.`
          : livePlayer
            ? `Live player ${observerId} found on match ${nextCamera.matchId}.`
            : "Saved player table matched, waiting for spectator mapping from websocket.",
      );
    };

    const currentData = getRealtimeData();
    if (currentData) {
      syncCamera(currentData);
    } else {
      const savedPlayer = savedPlayers.get(spectId.trim());
      if (savedPlayer) {
        setCamera({
          spectatorId: spectId,
          matchId: activeMatchId,
          playerId: spectId,
          name: savedPlayer.playerName || `Player ${spectId}`,
          camera: savedPlayer.cameraLink || "",
          teamName: savedPlayer.teamName || "",
        });
        setStatus("Saved spectator profile loaded. Waiting for realtime websocket payload.");
      } else {
        setStatus(`Listening for spectator ${spectId} on match ${activeMatchId}.`);
      }
    }

    const unsubscribe = subscribeRealtime(syncCamera);

    return () => {
      unsubscribe();
    };
  }, [activeMatchId, savedPlayers, spectId]);

  return (
    <Canvas>
      <Overlay>
        <Tag>Spectator {spectId}</Tag>
        <Headline>{camera?.name || "Awaiting live observer target"}</Headline>
        <Meta>
          <span>Enabled match: {activeMatchId || "-"}</span>
          <span>Spectator ID: {camera?.spectatorId || spectId || "-"}</span>
          <span>Observer UID: {camera?.playerId || "-"}</span>
          {camera?.teamName ? <span>Team: {camera.teamName}</span> : null}
          {typeof camera?.hp === "number" ? <span>HP: {camera.hp}</span> : null}
          {typeof camera?.isAlive === "boolean" ? (
            <span>{camera.isAlive ? "Alive" : "Eliminated"}</span>
          ) : null}
          <span>{status}</span>
        </Meta>
      </Overlay>

      {camera?.camera ? (
        <VideoFrame>
          <Video key={camera.camera} src={camera.camera} autoPlay muted playsInline controls />
        </VideoFrame>
      ) : (
        <Placeholder>No camera link is available for this spectator/player yet.</Placeholder>
      )}
    </Canvas>
  );
};

export default SpectatorBroadcastView;

const Canvas = styled.main`
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 20%, rgba(255, 75, 75, 0.16), transparent 28%),
    #02070d;
  color: #ffffff;
`;

const VideoFrame = styled.div`
  width: 90vw;
  height: 90vh;
  display: grid;
  place-items: center;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.86);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.4);
`;

const Overlay = styled.div`
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 2;
  display: grid;
  gap: 8px;
  max-width: 620px;
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(2, 10, 18, 0.72);
  backdrop-filter: blur(14px);
`;

const Tag = styled.span`
  color: #8ef1ff;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Headline = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 4.2rem);
  line-height: 0.94;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #d1dfef;
  font-size: 0.95rem;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000000;
`;

const Placeholder = styled.div`
  display: grid;
  place-items: center;
  width: 90vw;
  height: 90vh;
  color: #8ea2b9;
  font-size: 1.1rem;
`;
