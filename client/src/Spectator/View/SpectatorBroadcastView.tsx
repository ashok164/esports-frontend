import React from "react";
import styled from "styled-components";
import { GAME_DETAILS_UPDATED_EVENT, getActiveGameDetails } from "../../GameDetails/gameDetailsState";
import { getSpectatorGroupsApi } from "../Repository/remote";
import { getSpectatorSocket } from "../socket";

type SpectatorFeedRow = {
  spectatorId: string;
  observerId: string;
  observerName: string;
  observerTeamName?: string;
};

type CameraSocketPayload = {
  matchId: string;
  spectators: SpectatorFeedRow[];
};

const SpectatorBroadcastView: React.FC = () => {
  const [feed, setFeed] = React.useState<CameraSocketPayload | null>(null);
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
    let isMounted = true;

    getSpectatorGroupsApi()
      .then((response) => {
        if (!isMounted) return;
        const firstGroup = Array.isArray(response?.groups) ? response.groups[0] : null;
        setTournamentId(String(firstGroup?.tournamentId || ""));
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setStatus(error?.response?.data?.message || error?.message || "Failed to load spectator groups.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
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
      setFeed(payload);
      setStatus(`Loaded ${payload.spectators.length} spectator row${payload.spectators.length === 1 ? "" : "s"} for match ${payload.matchId}.`);
    };

    const handleError = (payload: { message?: string }) => {
      setStatus(payload?.message || "Camera websocket error.");
    };

    socket.on("camera:joined", handleJoined);
    socket.on("camera_update", handleUpdate);
    socket.on("camera:error", handleError);

    socket.emit("camera:join", {
      matchId: activeMatchId.trim(),
      tournamentId: tournamentId.trim(),
    });

    return () => {
      socket.off("camera:joined", handleJoined);
      socket.off("camera_update", handleUpdate);
      socket.off("camera:error", handleError);
    };
  }, [activeMatchId, tournamentId]);

  return (
    <Canvas>
      <Overlay>
        <Tag>Camera Websocket</Tag>
        <Headline>Spectator Feed By Match</Headline>
        <Meta>
          <span>Match ID: {feed?.matchId || activeMatchId || "-"}</span>
          <span>Spectator Count: {feed?.spectators?.length ?? 0}</span>
          <span>{status}</span>
        </Meta>
      </Overlay>

      <FeedGrid>
        {(feed?.spectators || []).map((row, index) => (
          <FeedCard key={`${row.spectatorId}-${row.observerId}-${index}`}>
            <FieldLabel>Spectator ID</FieldLabel>
            <FieldValue>{row.spectatorId || "-"}</FieldValue>

            <FieldLabel>Observer ID</FieldLabel>
            <FieldValue>{row.observerId || "-"}</FieldValue>

            <FieldLabel>Observer Name</FieldLabel>
            <FieldValue>{row.observerName || "-"}</FieldValue>

            <FieldLabel>Observer Team</FieldLabel>
            <FieldValue>{row.observerTeamName || "-"}</FieldValue>
          </FeedCard>
        ))}

        {(!feed?.spectators || feed.spectators.length === 0) ? (
          <EmptyState>No spectator rows received yet for this match.</EmptyState>
        ) : null}
      </FeedGrid>
    </Canvas>
  );
};

export default SpectatorBroadcastView;

const Canvas = styled.main`
  position: relative;
  min-height: 100vh;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 32px;
  padding: 140px 24px 48px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 20%, rgba(255, 75, 75, 0.16), transparent 28%),
    #02070d;
  color: #ffffff;
`;

const Overlay = styled.div`
  position: fixed;
  top: 24px;
  left: 24px;
  right: 24px;
  z-index: 2;
  display: grid;
  gap: 8px;
  max-width: 920px;
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

const FeedGrid = styled.section`
  width: min(1280px, 100%);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
`;

const FeedCard = styled.article`
  border-radius: 18px;
  padding: 20px;
  background: rgba(4, 12, 21, 0.82);
  border: 1px solid rgba(142, 241, 255, 0.14);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24);
  display: grid;
  gap: 8px;
`;

const FieldLabel = styled.div`
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8ea2b9;
`;

const FieldValue = styled.div`
  font-size: 1rem;
  color: #ffffff;
  word-break: break-word;
  margin-bottom: 6px;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  border-radius: 18px;
  padding: 28px;
  text-align: center;
  color: #8ea2b9;
  background: rgba(4, 12, 21, 0.82);
  border: 1px solid rgba(142, 241, 255, 0.14);
`;
