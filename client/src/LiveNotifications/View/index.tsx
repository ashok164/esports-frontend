import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styled, { keyframes } from "styled-components";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";
import LiveStandingsFont, {
  GFF_LATIN_EXTRA_BOLD_FONT_FAMILY,
  LIVE_STANDINGS_FONT_FAMILY,
} from "../../LiveStandingsTable/View/LiveStandingsFont";

type PlayerMilestoneKind = "first-blood" | "kills" | "damage";

type PlayerMilestone = {
  id: string;
  playerId: string;
  playerName: string;
  playerPic?: string;
  teamName: string;
  teamTag: string;
  kind: PlayerMilestoneKind;
  title: string;
  value: number;
  unit: string;
  priority: number;
};

const KILL_THRESHOLDS = [3, 4, 8, 10];
const DAMAGE_THRESHOLDS = [1000, 2000, 3000];
const DISPLAY_MS = 4200;
const TEST_MILESTONES: PlayerMilestone[] = [
  {
    id: "test:first-blood",
    playerId: "test-player",
    playerName: "PLAYER NAME",
    teamName: "TEST TEAM",
    teamTag: "TST",
    kind: "first-blood",
    title: "FIRST BLOOD",
    value: 1,
    unit: "ELIM",
    priority: 1000,
  },
  {
    id: "test:kills",
    playerId: "test-player",
    playerName: "PLAYER NAME",
    teamName: "TEST TEAM",
    teamTag: "TST",
    kind: "kills",
    title: "ELIMS LEADER",
    value: 8,
    unit: "ELIMS",
    priority: 808,
  },
  {
    id: "test:damage",
    playerId: "test-player",
    playerName: "PLAYER NAME",
    teamName: "TEST TEAM",
    teamTag: "TST",
    kind: "damage",
    title: "DAMAGE LEADER",
    value: 2000,
    unit: "DAMAGE",
    priority: 900,
  },
];

const numberOf = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const cleanName = (value: unknown, fallback: string) => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const collectMilestones = (standings: any[]): PlayerMilestone[] => {
  const players = standings.flatMap((team) =>
    (team.players || []).map((player: any) => ({
      player,
      team,
      kills: numberOf(player?.kills),
      damage: numberOf(player?.damage),
    })),
  );

  const firstBloodCandidate = players
    .filter((entry) => entry.kills > 0)
    .sort((left, right) => {
      const timeDiff = numberOf(left.player?.survivalTime ?? left.player?.deadTime) - numberOf(right.player?.survivalTime ?? right.player?.deadTime);
      if (timeDiff !== 0) return timeDiff;
      return right.kills - left.kills;
    })[0];

  const milestones: PlayerMilestone[] = [];

  const pushMilestone = (
    entry: { player: any; team: any; kills: number; damage: number },
    kind: PlayerMilestoneKind,
    threshold: number,
    title: string,
    unit: string,
    priority: number,
  ) => {
    const playerId = cleanName(entry.player?.id, cleanName(entry.player?.name, "unknown-player"));
    milestones.push({
      id: `${kind}:${playerId}:${threshold}`,
      playerId,
      playerName: cleanName(entry.player?.name, "PLAYER NAME"),
      playerPic: entry.player?.playerPic,
      teamName: cleanName(entry.team?.name, "TEAM"),
      teamTag: cleanName(entry.team?.teamTag, cleanName(entry.team?.name, "TEAM")),
      kind,
      title,
      value: threshold,
      unit,
      priority,
    });
  };

  if (firstBloodCandidate) {
    pushMilestone(firstBloodCandidate, "first-blood", 1, "FIRST BLOOD", "ELIM", 1000);
  }

  players.forEach((entry) => {
    KILL_THRESHOLDS.forEach((threshold) => {
      if (entry.kills >= threshold) {
        pushMilestone(entry, "kills", threshold, "ELIMS LEADER", "ELIMS", 800 + threshold);
      }
    });

    DAMAGE_THRESHOLDS.forEach((threshold) => {
      if (entry.damage >= threshold) {
        pushMilestone(entry, "damage", threshold, "DAMAGE LEADER", "DAMAGE", 700 + threshold / 10);
      }
    });
  });

  return milestones.sort((left, right) => right.priority - left.priority);
};

const LiveNotificationView: React.FC = () => {
  const testMode = new URLSearchParams(window.location.search).has("test");
  const { standings, loading } = useLiveStandingsController({
    forceLiveMatchStandings: true,
  });
  const { broadcastSettings } = useProjectTheme();
  const shownIdsRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<PlayerMilestone[]>([]);
  const [activeMilestone, setActiveMilestone] = useState<PlayerMilestone | null>(null);

  const nextMilestones = useMemo(
    () => (testMode ? TEST_MILESTONES : loading ? [] : collectMilestones(standings || [])),
    [loading, standings, testMode],
  );

  useEffect(() => {
    if (!testMode) return;

    queueRef.current = TEST_MILESTONES.slice(1);
    shownIdsRef.current = new Set(TEST_MILESTONES.map((milestone) => milestone.id));
    setActiveMilestone(TEST_MILESTONES[0]);

    const timer = window.setInterval(() => {
      setActiveMilestone((current) => {
        const currentIndex = TEST_MILESTONES.findIndex((milestone) => milestone.id === current?.id);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % TEST_MILESTONES.length : 0;
        return TEST_MILESTONES[nextIndex];
      });
    }, DISPLAY_MS);

    return () => window.clearInterval(timer);
  }, [testMode]);

  useEffect(() => {
    if (testMode) return;
    const unseen = nextMilestones.filter((milestone) => !shownIdsRef.current.has(milestone.id));
    if (unseen.length === 0) return;

    unseen.forEach((milestone) => shownIdsRef.current.add(milestone.id));
    queueRef.current = [...queueRef.current, ...unseen];

    if (!activeMilestone) {
      setActiveMilestone(queueRef.current.shift() || null);
    }
  }, [activeMilestone, nextMilestones, testMode]);

  useEffect(() => {
    if (testMode) return;
    if (!activeMilestone) return;

    const timer = window.setTimeout(() => {
      setActiveMilestone(queueRef.current.shift() || null);
    }, DISPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [activeMilestone, testMode]);

  return (
    <>
      <LiveStandingsFont />
      <Stage>
        <AnimatePresence mode="wait">
          {activeMilestone && (
            <NotificationCard
              key={activeMilestone.id}
              style={{
                "--notification-color-1": broadcastSettings.liveStandings2Color1,
                "--notification-color-2": broadcastSettings.liveStandings2Color2,
                "--notification-color-4": broadcastSettings.liveStandings2Color4,
                "--notification-text-1": broadcastSettings.liveStandings2TextColor1,
                "--notification-text-2": broadcastSettings.liveStandings2TextColor2,
                "--notification-text-4": broadcastSettings.liveStandings2TextColor4,
              } as React.CSSProperties}
              initial={{ opacity: 0, x: -120, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 140, scale: 0.95 }}
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              <PhotoPanel>
                {activeMilestone.playerPic ? (
                  <PlayerImage src={activeMilestone.playerPic} alt="" />
                ) : (
                  <TargetIcon aria-hidden="true">
                    <TargetRing />
                    <TargetLine $axis="x" />
                    <TargetLine $axis="y" />
                    <TargetDot />
                  </TargetIcon>
                )}
              </PhotoPanel>
              <HeaderTab>{activeMilestone.title}</HeaderTab>
              <StatPanel $kind={activeMilestone.kind}>
                <Value>{activeMilestone.value}</Value>
                <Unit>{activeMilestone.unit}</Unit>
              </StatPanel>
              <NamePlate>
                <NameText>{activeMilestone.playerName}</NameText>
                <TeamText>{activeMilestone.teamTag}</TeamText>
              </NamePlate>
            </NotificationCard>
          )}
        </AnimatePresence>
      </Stage>
    </>
  );
};

export default LiveNotificationView;

const scan = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  22% { opacity: 1; }
  100% { transform: translateX(140%); opacity: 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 10px var(--notification-color-1, #ef4444); }
  50% { transform: scale(1.18); box-shadow: 0 0 22px var(--notification-color-1, #ef4444); }
`;

const Stage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  pointer-events: none;
  background: transparent;
`;

const NotificationCard = styled(motion.div)`
  position: absolute;
  left: 154px;
  top: 96px;
  width: 530px;
  height: 190px;
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", Arial, sans-serif;
  text-transform: uppercase;
  color: var(--notification-text-1, #ffffff);
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.7));

  @media (max-width: 1280px) {
    left: 78px;
    top: 62px;
    transform-origin: left top;
  }
`;

const PhotoPanel = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 230px;
  height: 145px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    linear-gradient(135deg, transparent 0 18px, color-mix(in srgb, var(--notification-color-2, #ffffff) 92%, white) 19px),
    linear-gradient(135deg, var(--notification-color-2, #ffffff), color-mix(in srgb, var(--notification-color-2, #ffffff) 76%, black));
  clip-path: polygon(18px 0, 100% 0, 100% 100%, 0 100%, 0 18px);
  border-top: 2px solid color-mix(in srgb, var(--notification-color-2, #ffffff) 72%, white);
  border-right: 3px solid color-mix(in srgb, var(--notification-color-2, #ffffff) 70%, black);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset -10px 0 18px rgba(0, 0, 0, 0.12);
`;

const PlayerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
`;

const HeaderTab = styled.div`
  position: absolute;
  left: 230px;
  top: 0;
  width: 300px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--notification-color-2, #ffffff) 90%, white), color-mix(in srgb, var(--notification-color-2, #ffffff) 76%, black));
  color: var(--notification-text-2, #0b151e);
  border-bottom: 3px solid color-mix(in srgb, var(--notification-color-2, #ffffff) 72%, black);
  border-left: 0;
  border-radius: 0 12px 0 0;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
  text-align: center;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  z-index: 1;
`;

const StatPanel = styled.div<{ $kind: PlayerMilestoneKind }>`
  position: absolute;
  left: 230px;
  top: 45px;
  width: 300px;
  height: 145px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.18), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--notification-color-1, #ef4444) 36%, black), var(--notification-color-1, #ef4444) 48%, color-mix(in srgb, var(--notification-color-1, #ef4444) 82%, white));
  border-top: 3px solid color-mix(in srgb, var(--notification-color-1, #ef4444) 78%, white);
  border-right: 2px solid color-mix(in srgb, var(--notification-color-1, #ef4444) 70%, black);
  border-bottom: 2px solid color-mix(in srgb, var(--notification-color-1, #ef4444) 70%, black);
  border-radius: 0 0 12px 0;
  box-shadow:
    inset 0 10px 20px rgba(0, 0, 0, 0.55),
    0 0 16px color-mix(in srgb, var(--notification-color-1, #ef4444) 58%, transparent);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
    animation: ${scan} 1300ms ease-out both;
  }
`;

const Value = styled.div`
  position: relative;
  z-index: 1;
  margin-top: 8px;
  color: var(--notification-text-1, #ffffff);
  font-family: "${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}", "${LIVE_STANDINGS_FONT_FAMILY}", Arial, sans-serif;
  font-size: 96px;
  font-weight: 800;
  line-height: 0.8;
  letter-spacing: 0;
  text-shadow:
    0 3px 0 rgba(0, 0, 0, 0.6),
    0 0 18px rgba(255, 255, 255, 0.18);
  font-variant-numeric: tabular-nums;
`;

const Unit = styled.div`
  position: relative;
  z-index: 1;
  margin-top: 4px;
  color: var(--notification-text-1, #ffffff);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 2.5px;
  opacity: 0.82;
`;

const NamePlate = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  top: auto;
  width: 260px;
  height: 45px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 36px 0 20px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--notification-color-4, #090909) 72%, black), var(--notification-color-4, #090909) 60%, color-mix(in srgb, var(--notification-color-4, #090909) 78%, var(--notification-color-1, #ef4444)));
  clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%);
  border-top: 2px solid color-mix(in srgb, var(--notification-color-4, #090909) 72%, white);
  border-radius: 0;
  box-shadow: 0 7px 10px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14);
  z-index: 2;
`;

const NameText = styled.div`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--notification-text-4, #ffffff);
  font-size: 23px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.8);
`;

const TeamText = styled.div`
  flex: 0 0 auto;
  max-width: 82px;
  overflow: hidden;
  color: var(--notification-text-4, #ffffff);
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TargetIcon = styled.div`
  position: relative;
  width: 86px;
  height: 86px;
`;

const TargetRing = styled.div`
  position: absolute;
  inset: 18px;
  border: 5px solid var(--notification-text-2, #22282d);
  border-radius: 50%;
  box-shadow: inset 0 0 0 12px rgba(255, 255, 255, 0.75), 0 2px 6px rgba(0, 0, 0, 0.45);
`;

const TargetLine = styled.div<{ $axis: "x" | "y" }>`
  position: absolute;
  left: ${({ $axis }) => ($axis === "x" ? "0" : "50%")};
  top: ${({ $axis }) => ($axis === "x" ? "50%" : "0")};
  width: ${({ $axis }) => ($axis === "x" ? "100%" : "5px")};
  height: ${({ $axis }) => ($axis === "x" ? "5px" : "100%")};
  transform: translate(${({ $axis }) => ($axis === "x" ? "0, -50%" : "-50%, 0")});
  border-radius: 999px;
  background: var(--notification-text-2, #22282d);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.48);
`;

const TargetDot = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: var(--notification-color-1, #ef4444);
  animation: ${pulse} 1150ms ease-in-out infinite;
`;
