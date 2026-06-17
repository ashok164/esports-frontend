import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { getActiveGameDetails, GAME_DETAILS_UPDATED_EVENT } from "../../GameDetails/gameDetailsState";
import { getSpectatorSnapshotApi } from "../Repository/remote";
import { getSpectatorSocket } from "../socket";

type CameraSocketPayload = {
  spectatorId: string;
  matchId: string;
  playerId: string;
  name: string;
  camera: string;
  teamName?: string;
};

const SpectatorBroadcastView: React.FC = () => {
  const { spectId = "" } = useParams();
  const [camera, setCamera] = React.useState<CameraSocketPayload | null>(null);
  const [activeMatchId, setActiveMatchId] = React.useState(() => getActiveGameDetails().matchIds);
  const [tournamentId, setTournamentId] = React.useState<string>("");
  const [status, setStatus] = React.useState("Connecting to camera websocket...");

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

    let isMounted = true;

    getSpectatorSnapshotApi(spectId)
      .then((response) => {
        if (!isMounted) return;
        setTournamentId(String(response?.tournamentId || ""));
        if (response?.latest) {
          setCamera(response.latest);
          setStatus("Loaded latest backend camera snapshot.");
        }
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setStatus(error?.response?.data?.message || error?.message || "Failed to load spectator snapshot.");
      });

    return () => {
      isMounted = false;
    };
  }, [spectId]);

  React.useEffect(() => {
    if (!spectId.trim()) return;
    if (!activeMatchId.trim()) {
      setStatus("No enabled websocket match ID found in game details.");
      return;
    }
    if (!tournamentId.trim()) return;

    const socket = getSpectatorSocket();

    const handleJoined = (payload: { room?: string }) => {
      setStatus(`Camera websocket joined${payload?.room ? ` ${payload.room}` : ""}.`);
    };

    const handleUpdate = (payload: CameraSocketPayload) => {
      setCamera(payload);
      setStatus(`Camera feed mapped for spectator ${payload.spectatorId} on match ${payload.matchId}.`);
    };

    const handleError = (payload: { message?: string }) => {
      setStatus(payload?.message || "Camera websocket error.");
    };

    socket.on("camera:joined", handleJoined);
    socket.on("camera_update", handleUpdate);
    socket.on("camera:error", handleError);

    socket.emit("camera:join", {
      spectId: spectId.trim(),
      matchId: activeMatchId.trim(),
      tournamentId: tournamentId.trim(),
    });

    return () => {
      socket.off("camera:joined", handleJoined);
      socket.off("camera_update", handleUpdate);
      socket.off("camera:error", handleError);
    };
  }, [activeMatchId, spectId, tournamentId]);

  return (
    <Canvas>
      <Overlay>
        <Tag>Camera Websocket</Tag>
        <Headline>{camera?.name || "Awaiting spectator camera feed"}</Headline>
        <Meta>
          <span>Match ID: {activeMatchId || "-"}</span>
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
        <Placeholder>No spectator camera feed is available yet.</Placeholder>
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
