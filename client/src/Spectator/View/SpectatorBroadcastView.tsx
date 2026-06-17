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

      <LowerThird>
        <UpperMeta>
          <Tag>Camera Websocket</Tag>
          <StatusText>{status}</StatusText>
        </UpperMeta>
        <PlayerName>{filteredRow?.playerName || "Awaiting spectator feed"}</PlayerName>
        <PlayerMeta>
          <span>UID: {filteredRow?.playerId || "-"}</span>
          <span>Spectator: {spectId || "-"}</span>
          <span>Match: {feed?.matchId || activeMatchId || "-"}</span>
          <span>Team: {filteredRow?.teamName || "-"}</span>
        </PlayerMeta>
        <CameraLink
          href={cameraLink || "#"}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!cameraLink}
          onClick={(event) => {
            if (!cameraLink) {
              event.preventDefault();
            }
          }}
        >
          {cameraLink || "No camera link"}
        </CameraLink>
      </LowerThird>
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
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background: #000000;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000000;
`;

const EmbedFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
  background: #000000;
`;

const LowerThird = styled.div`
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 24px;
  z-index: 2;
  display: grid;
  gap: 10px;
  max-width: 720px;
  padding: 18px 22px;
  border-radius: 22px;
  background: rgba(2, 10, 18, 0.78);
  backdrop-filter: blur(14px);
`;

const UpperMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  color: #8ef1ff;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const StatusText = styled.span`
  color: #d1dfef;
  font-size: 0.84rem;
`;

const PlayerName = styled.h1`
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 3rem);
  line-height: 0.96;
`;

const PlayerMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #d1dfef;
  font-size: 0.92rem;
`;

const CameraLink = styled.a`
  color: #9cefff;
  font-size: 0.88rem;
  text-decoration: none;
  overflow-wrap: anywhere;

  &[aria-disabled="true"] {
    color: #70859d;
    cursor: default;
  }
`;

const Placeholder = styled.div`
  display: grid;
  place-items: center;
  width: 100vw;
  height: 100vh;
  color: #8ea2b9;
  font-size: 1.1rem;
`;
