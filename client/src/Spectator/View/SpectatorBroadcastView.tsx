import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { GAME_DETAILS_UPDATED_EVENT, getActiveGameDetails } from "../../GameDetails/gameDetailsState";
import { getSpectatorGroupsApi } from "../Repository/remote";
import { getSpectatorSocket } from "../socket";

type SpectatorFeedRow = {
  spectatorId: string;
  playerId: string;
  playerName: string;
  cameraLink: string;
  teamName?: string;
};

type CameraSocketPayload = {
  matchId: string;
  spectators: SpectatorFeedRow[];
};

const SpectatorBroadcastView: React.FC = () => {
  const { spectId = "" } = useParams();
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

  const filteredRow = React.useMemo(
    () =>
      (feed?.spectators || []).find(
        (row) => String(row.spectatorId || "").trim() === String(spectId || "").trim(),
      ) || null,
    [feed, spectId],
  );

  const buildCameraEmbedUrl = React.useCallback((link: string) => {
    if (!link) return "";

    try {
      const parsed = new URL(link);
      const isVdoNinja = /(^|\.)vdo\.ninja$/i.test(parsed.hostname);

      if (!isVdoNinja) {
        return link;
      }

      // Best-effort viewer cleanup so VDO.Ninja behaves closer to a camera-only embed.
      parsed.searchParams.set("cleanoutput", "1");
      parsed.searchParams.set("transparent", "1");
      parsed.searchParams.set("cover", "1");
      parsed.searchParams.set("autoplay", "1");
      parsed.searchParams.set("muted", "1");
      parsed.searchParams.set("nocursor", "1");
      parsed.searchParams.set("noheader", "1");

      return parsed.toString();
    } catch {
      return link;
    }
  }, []);

  const cameraLink = filteredRow?.cameraLink || "";
  const embedCameraLink = buildCameraEmbedUrl(cameraLink);
  const isVdoNinjaLink = /(^https?:\/\/)?(www\.)?vdo\.ninja/i.test(cameraLink);
  const [embedReloadKey, setEmbedReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!isVdoNinjaLink || !embedCameraLink) return;

    const timerId = window.setTimeout(() => {
      setEmbedReloadKey((current) => current + 1);
    }, 2000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [embedCameraLink, isVdoNinjaLink]);

  return (
    <Canvas>
      {cameraLink ? (
        <VideoFrame>
          {isVdoNinjaLink ? (
            <EmbedFrame
              key={`${embedCameraLink}-${embedReloadKey}`}
              src={embedCameraLink}
              allow="autoplay; fullscreen; camera; microphone; display-capture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              title={filteredRow?.playerName || "Player camera"}
            />
          ) : (
            <Video key={cameraLink} src={cameraLink} autoPlay muted playsInline controls />
          )}
        </VideoFrame>
      ) : (
        <Placeholder>Waiting for player table camera link and live spectator mapping.</Placeholder>
      )}

      <InfoDock>
        <InfoGrid>
          <InfoBox>
            <InfoLabel>Name</InfoLabel>
            <InfoValue>{filteredRow?.playerName || "-"}</InfoValue>
          </InfoBox>
          <InfoBox>
            <InfoLabel>UID</InfoLabel>
            <InfoValue>{filteredRow?.playerId || "-"}</InfoValue>
          </InfoBox>
          <InfoBox>
            <InfoLabel>Team</InfoLabel>
            <InfoValue>{filteredRow?.teamName || "-"}</InfoValue>
          </InfoBox>
        </InfoGrid>
      </InfoDock>
    </Canvas>
  );
};

export default SpectatorBroadcastView;

const Canvas = styled.main`
  position: relative;
  min-height: 100vh;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 18px;
  padding: 32px 24px;
  box-sizing: border-box;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 20%, rgba(255, 75, 75, 0.16), transparent 28%),
    #02070d;
  color: #ffffff;
`;

const VideoFrame = styled.div`
  width: min(50vw, 960px);
  height: min(56.25vh, 540px);
  display: grid;
  place-items: center;
  background: #000000;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(142, 241, 255, 0.12);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);

  @media (max-width: 1100px) {
    width: min(72vw, 960px);
    height: min(56vw, 540px);
  }

  @media (max-width: 720px) {
    width: calc(100vw - 32px);
    height: min(58vw, 420px);
  }
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000000;
  pointer-events: none;
`;

const EmbedFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
  background: #000000;
  pointer-events: none;
`;

const InfoDock = styled.div`
  width: min(50vw, 960px);
  padding: 0;

  @media (max-width: 1100px) {
    width: min(72vw, 960px);
  }

  @media (max-width: 720px) {
    width: calc(100vw - 32px);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const InfoBox = styled.div`
  min-height: 78px;
  padding: 14px 16px;
  border-radius: 0;
  border: 1px solid rgba(142, 241, 255, 0.14);
  background: rgba(4, 12, 21, 0.88);
  display: grid;
  align-content: center;
  gap: 6px;
`;

const InfoLabel = styled.span`
  color: #8ea2b9;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const InfoValue = styled.span`
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

const Placeholder = styled.div`
  display: grid;
  place-items: center;
  width: min(50vw, 960px);
  height: min(56.25vh, 540px);
  color: #8ea2b9;
  font-size: 1.1rem;
  text-align: center;
  border-radius: 24px;
  border: 1px solid rgba(142, 241, 255, 0.12);
  background: rgba(0, 0, 0, 0.4);

  @media (max-width: 1100px) {
    width: min(72vw, 960px);
    height: min(56vw, 540px);
  }

  @media (max-width: 720px) {
    width: calc(100vw - 32px);
    height: min(58vw, 420px);
  }
`;
