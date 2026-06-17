import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import {
  connectCameraSocket,
  getCameraSocketSnapshot,
  normalizeSavedPlayers,
  SavedPlayerProfile,
  subscribeCameraSocket,
  type CameraSocketPayload,
} from "../cameraSocket";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
} from "../../GameDetails/gameDetailsState";
import { getPlayerUploadsApi } from "../../PlayerUpload/Repository/remote";

const SpectatorBroadcastView: React.FC = () => {
  const { spectId = "" } = useParams();
  const [camera, setCamera] = React.useState<CameraSocketPayload | null>(null);
  const [savedPlayers, setSavedPlayers] = React.useState<Map<string, SavedPlayerProfile>>(new Map());
  const [activeMatchId, setActiveMatchId] = React.useState(() => getActiveGameDetails().matchIds);
  const [status, setStatus] = React.useState("Loading camera websocket...");

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

    connectCameraSocket(activeMatchId);

    const snapshot = getCameraSocketSnapshot(spectId, activeMatchId, savedPlayers);
    if (snapshot) {
      setCamera(snapshot);
      setStatus(`Camera websocket mapped spectator ${spectId} on match ${snapshot.matchId}.`);
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
        setStatus("Saved player camera found. Waiting for camera websocket spectator mapping.");
      } else {
        setCamera(null);
        setStatus(`Listening on camera websocket for spectator ${spectId}.`);
      }
    }

    const unsubscribe = subscribeCameraSocket(
      spectId,
      activeMatchId,
      savedPlayers,
      (payload) => {
        if (!payload) {
          setCamera(null);
          setStatus(`No spectator mapping found yet for ${spectId} on match ${activeMatchId}.`);
          return;
        }

        setCamera(payload);
        setStatus(`Camera websocket mapped spectator ${payload.spectatorId} on match ${payload.matchId}.`);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [activeMatchId, savedPlayers, spectId]);

  return (
    <Canvas>
      <Overlay>
        <Tag>Camera Websocket</Tag>
        <Headline>{camera?.name || "Awaiting mapped spectator target"}</Headline>
        <Meta>
          <span>Enabled match: {activeMatchId || "-"}</span>
          <span>Spectator ID: {camera?.spectatorId || spectId || "-"}</span>
          <span>Observer UID: {camera?.playerId || "-"}</span>
          {camera?.teamName ? <span>Team: {camera.teamName}</span> : null}
          <span>{status}</span>
        </Meta>
      </Overlay>

      {camera?.camera ? (
        <VideoFrame>
          <Video key={camera.camera} src={camera.camera} autoPlay muted playsInline controls />
        </VideoFrame>
      ) : (
        <Placeholder>No mapped camera link is available yet.</Placeholder>
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
