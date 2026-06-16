import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import {
  getSpectatorSnapshotApi,
  resolveSpectatorApi,
  SpectatorSnapshot,
} from "../Repository/remote";
import { getSpectatorSocket } from "../socket";

type CameraUpdatePayload = {
  spectatorId: string;
  matchId: string;
  playerId: string;
  name: string;
  camera: string;
};

const SpectatorBroadcastView: React.FC = () => {
  const { spectId = "" } = useParams();
  const [camera, setCamera] = React.useState<CameraUpdatePayload | null>(null);
  const [snapshot, setSnapshot] = React.useState<SpectatorSnapshot | null>(null);
  const [status, setStatus] = React.useState("Waiting for spectator room join...");

  React.useEffect(() => {
    if (!spectId || !snapshot?.tournamentId) return;

    let isMounted = true;

    getSpectatorSnapshotApi(spectId)
      .then((snapshot) => {
        if (!isMounted) return;
        setSnapshot(snapshot);
        if (snapshot.latest) {
          setCamera(snapshot.latest);
          setStatus("Loaded latest backend snapshot.");
        } else {
          setStatus("Resolving spectator from Garena data...");
          resolveSpectatorApi(spectId)
            .then((resolved) => {
              if (!isMounted || !resolved?.success) return;
              setCamera(resolved);
              setStatus("Resolved spectator from Garena and DB.");
            })
            .catch(() => {
              if (!isMounted) return;
              setStatus("Spectator route is ready. Waiting for the next camera update.");
            });
        }
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setStatus(error?.response?.data?.message || error?.message || "Unable to load spectator snapshot.");
      });

    return () => {
      isMounted = false;
    };
  }, [spectId]);

  React.useEffect(() => {
    if (!spectId) return;

    const socket = getSpectatorSocket();
    const handleJoined = () => {
      setStatus("Connected to spectator room. Listening for live camera updates.");
    };
    const handleUpdate = (payload: CameraUpdatePayload) => {
      setCamera(payload);
      setStatus(`Live on ${payload.name}`);
    };

    socket.emit("spectator:join", {
      spectId,
      tournamentId: snapshot.tournamentId,
    });
    socket.on("spectator:joined", handleJoined);
    socket.on("camera_update", handleUpdate);

    return () => {
      socket.off("spectator:joined", handleJoined);
      socket.off("camera_update", handleUpdate);
    };
  }, [spectId, snapshot?.tournamentId]);

  return (
    <Canvas>
      <Overlay>
        <Tag>Spectator {spectId}</Tag>
        <Headline>{camera?.name || "Awaiting live observer target"}</Headline>
        <Meta>
          <span>Match: {camera?.matchId || "-"}</span>
          <span>Player: {camera?.playerId || "-"}</span>
          <span>{status}</span>
        </Meta>
      </Overlay>

      {camera?.camera ? (
        <VideoFrame>
          <Video key={camera.camera} src={camera.camera} autoPlay muted playsInline controls />
        </VideoFrame>
      ) : (
        <Placeholder>No camera stream has been assigned yet.</Placeholder>
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
  max-width: 520px;
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
