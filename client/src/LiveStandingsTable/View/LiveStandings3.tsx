import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import styled, { css, keyframes } from "styled-components";
import { useProjectTheme } from "../../Theme";
import {
  BROADCAST_DISPLAY_SETTINGS_KEY,
  BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT,
  getBroadcastDisplaySettings,
} from "../../Theme/projectTheme";
import LiveStandingsFont, { LIVE_STANDINGS_FONT_FAMILY } from "./LiveStandingsFont";

type Player = {
  hp?: number;
  hpPercent?: number;
  isKnocked?: boolean;
  status?: "alive" | "knocked" | "recalled" | "dead";
  hasRecalled?: boolean;
  playerPic?: string;
};

type Team = {
  id: string | number;
  name: string;
  rank?: number;
  teamTag?: string;
  shortName?: string;
  tag?: string;
  logoUrl?: string;
  countryUrl?: string;
  kills?: number;
  totalPoints?: number;
  rankingScore?: number;
  placementPoints?: number;
  playersAlive?: number;
  isPlaying?: boolean;
  isEliminated?: boolean;
  is_eliminated?: boolean;
  players?: Player[];
};

type TableAnimationPhase = "entering" | "exiting";

const PANEL_WIDTH = 604;
const PANEL_WIDTH_NO_POINTS_NO_FLAGS = 486;
const PANEL_WIDTH_WITH_FLAGS_NO_POINTS = 522;
const PANEL_WIDTH_WITH_FLAGS = 604;
const ROW_HEIGHT = 68;
const ELIMINATION_ROW_HEIGHT = 102;
const MIN_COMPACT_ROW_HEIGHT = 44;
const ROW_GAP = 4;
const FOOTER_HEIGHT = 38;
const ELIMINATION_SWAP_DELAY_MS = 700;
const ELIMINATION_BANNER_MS = 1800;
const ELIMS_WIDTH = 82;
const POINTS_WIDTH = 82;
const HEALTH_WIDTH = 104;

const redWipeEffect = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  25% { opacity: 1; }
  75% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
`;

const eliminatedTextSwap = keyframes`
  0% { transform: translateX(-120%) skewX(-10deg); opacity: 0; }
  18% { opacity: 1; }
  48% { transform: translateX(0) skewX(-10deg); opacity: 1; }
  82% { opacity: 1; }
  100% { transform: translateX(120%) skewX(-10deg); opacity: 0; }
`;

const tableFallIn = keyframes`
  0% { opacity: 0; transform: translateY(-24px) scale(1.012); }
  68% { opacity: 1; transform: translateY(3px) scale(1); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const tableFallOut = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-18px) scale(0.985); }
`;

const numberOf = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pointsOf = (team: Team) => {
  if (team.totalPoints !== undefined && team.totalPoints !== null) {
    return numberOf(team.totalPoints);
  }

  return numberOf(team.rankingScore ?? team.placementPoints) + numberOf(team.kills);
};

const tagOf = (team: Team) => team.teamTag || team.shortName || team.tag || team.name;

const getTeamId = (team: Team) => String(team.id);

const hpPercentOf = (player?: Player) => {
  if (!player) return 0;
  return Math.max(0, Math.min(100, numberOf(player.hpPercent ?? player.hp ?? 100)));
};

const statusOf = (player?: Player): "alive" | "knocked" | "recalled" | "dead" => {
  if (!player || hpPercentOf(player) <= 0) {
    return "dead";
  }

  if (player.hasRecalled || player.status === "recalled") {
    return "recalled";
  }

  if (player.status === "dead") {
    return "dead";
  }

  if (player.status === "knocked" || player.isKnocked) {
    return "knocked";
  }

  return "alive";
};

const hideBrokenLogo = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.style.display = "none";
};

const isEliminated = (team: Team) =>
  Boolean(team.isEliminated || team.is_eliminated) ||
  (team.isPlaying !== false && numberOf(team.playersAlive) <= 0);

const getRowHeightMap = (teams: Team[], flashingIds: Set<string>) => {
  const activeCount = teams.filter((team) => flashingIds.has(getTeamId(team))).length;
  const totalHeight = teams.length * ROW_HEIGHT + Math.max(0, teams.length - 1) * ROW_GAP;

  if (teams.length === 0 || activeCount === 0) {
    return new Map(teams.map((team) => [getTeamId(team), ROW_HEIGHT]));
  }

  let eliminationHeight = ELIMINATION_ROW_HEIGHT;
  const compactCount = teams.length - activeCount;

  if (compactCount > 0) {
    const maxEliminationHeight =
      (totalHeight - Math.max(0, teams.length - 1) * ROW_GAP - compactCount * MIN_COMPACT_ROW_HEIGHT) / activeCount;
    eliminationHeight = Math.min(eliminationHeight, maxEliminationHeight);
  } else {
    eliminationHeight = (totalHeight - Math.max(0, teams.length - 1) * ROW_GAP) / activeCount;
  }

  const compactHeight =
    compactCount > 0
      ? (totalHeight - Math.max(0, teams.length - 1) * ROW_GAP - eliminationHeight * activeCount) / compactCount
      : eliminationHeight;

  return new Map(
    teams.map((team) => [
      getTeamId(team),
      flashingIds.has(getTeamId(team)) ? eliminationHeight : compactHeight,
    ]),
  );
};

const LiveStandings3: React.FC<{ teams?: Team[]; animationPhase?: TableAnimationPhase }> = ({
  teams = [],
  animationPhase = "entering",
}) => {
  const { theme } = useProjectTheme();
  const [displaySettings, setDisplaySettings] = useState(getBroadcastDisplaySettings);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(() => new Set());
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const previousEliminatedIdsRef = useRef<Set<string>>(new Set());
  const hasEliminationBaselineRef = useRef(false);
  const flashingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const syncSettings = () => setDisplaySettings(getBroadcastDisplaySettings());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BROADCAST_DISPLAY_SETTINGS_KEY) syncSettings();
    };

    window.addEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const rankedTeams = useMemo(
    () =>
      [...teams].sort((left, right) => {
        const pointDiff = pointsOf(right) - pointsOf(left);
        if (pointDiff !== 0) return pointDiff;
        return numberOf(right.kills) - numberOf(left.kills);
      }),
    [teams],
  );

  const showFlags = displaySettings.showCountryFlags;
  const showPoints = displaySettings.showLiveStandingsPoints;
  const headerWidth = ELIMS_WIDTH + HEALTH_WIDTH + (showPoints ? POINTS_WIDTH : 0) + 28;
  const boardWidth = showPoints
    ? (showFlags ? PANEL_WIDTH_WITH_FLAGS : 568)
    : (showFlags ? PANEL_WIDTH_WITH_FLAGS_NO_POINTS : PANEL_WIDTH_NO_POINTS_NO_FLAGS);

  const styles = {
    "--live3-rank": displaySettings.liveStandings2Color1,
    "--live3-tag": displaySettings.liveStandings2Color5,
    "--live3-stats": displaySettings.liveStandings2Color2,
    "--live3-header": displaySettings.liveStandings2Color3,
    "--live3-footer": displaySettings.liveStandings2Color4,
    "--live3-text": displaySettings.liveStandings2TextColor2,
    "--live3-header-text": displaySettings.liveStandings2TextColor3,
    "--live3-footer-text": displaySettings.liveStandings2TextColor4,
    "--live3-health": theme.success,
    "--live3-dead": "rgba(0, 0, 0, 0.08)",
  } as React.CSSProperties;

  useEffect(() => {
    const currentEliminatedIds = new Set(
      rankedTeams.filter(isEliminated).map((team) => getTeamId(team)),
    );
    const visibleIds = new Set(rankedTeams.map((team) => getTeamId(team)));

    if (!hasEliminationBaselineRef.current) {
      previousEliminatedIdsRef.current = currentEliminatedIds;
      hasEliminationBaselineRef.current = true;
      return;
    }

    flashingTimersRef.current.forEach((timer, id) => {
      if (!currentEliminatedIds.has(id) || !visibleIds.has(id)) {
        clearTimeout(timer);
        flashingTimersRef.current.delete(id);
        setFlashingIds((previous) => {
          if (!previous.has(id)) return previous;
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }
    });

    currentEliminatedIds.forEach((id) => {
      if (previousEliminatedIdsRef.current.has(id) || flashingTimersRef.current.has(id)) return;

      setFlashingIds((previous) => {
        if (previous.has(id)) return previous;
        const next = new Set(previous);
        next.add(id);
        return next;
      });

      const timer = setTimeout(() => {
        flashingTimersRef.current.delete(id);
        setFlashingIds((previous) => {
          if (!previous.has(id)) return previous;
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }, ELIMINATION_BANNER_MS);

      flashingTimersRef.current.set(id, timer);
    });

    previousEliminatedIdsRef.current = currentEliminatedIds;
  }, [rankedTeams]);

  useEffect(() => {
    return () => {
      flashingTimersRef.current.forEach((timer) => clearTimeout(timer));
      flashingTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (animationPhase !== "entering" || hasPlayedIntro) return;

    const introMs = 720 + rankedTeams.length * 75;
    const timer = window.setTimeout(() => {
      setHasPlayedIntro(true);
    }, introMs);

    return () => window.clearTimeout(timer);
  }, [animationPhase, hasPlayedIntro, rankedTeams.length]);

  const rowHeights = useMemo(() => getRowHeightMap(rankedTeams, flashingIds), [rankedTeams, flashingIds]);

  return (
    <>
    <LiveStandingsFont />
    <Board $width={boardWidth} style={styles}>
      <BoardHeader $width={headerWidth} $phase={animationPhase} $rowCount={rankedTeams.length}>
        <HeaderLabel>Elims</HeaderLabel>
        {showPoints && <HeaderLabel>Points</HeaderLabel>}
        <HeaderHealth>Health</HeaderHealth>
      </BoardHeader>

      <Rows>
        {rankedTeams.map((team, index) => (
          <LiveStandings3Row
            key={team.id}
            team={team}
            rank={index + 1}
            index={index}
            rowCount={rankedTeams.length}
            animationPhase={animationPhase}
            enableIntroAnimation={!hasPlayedIntro}
            rowHeight={rowHeights.get(getTeamId(team)) ?? ROW_HEIGHT}
            showFlags={showFlags}
            showPoints={showPoints}
          />
        ))}
      </Rows>

      <AnimatedFooter $phase={animationPhase} $rowCount={rankedTeams.length}>
        <LegendItem>
          <LegendSwatch $color="#24fe5b" />
          Alive
        </LegendItem>
        <LegendItem>
          <LegendSwatch $color="#ff3c14" />
          Knocked
        </LegendItem>
        <LegendItem>
          <LegendSwatch $color="#9ca3af" />
          Eliminated
        </LegendItem>
      </AnimatedFooter>
    </Board>
    </>
  );
};

export default LiveStandings3;

const LiveStandings3Row: React.FC<{
  team: Team;
  rank: number;
  index: number;
  rowCount: number;
  animationPhase?: TableAnimationPhase;
  enableIntroAnimation: boolean;
  rowHeight: number;
  showFlags: boolean;
  showPoints: boolean;
}> = ({
  team,
  rank,
  index,
  rowCount,
  animationPhase = "entering",
  enableIntroAnimation,
  rowHeight,
  showFlags,
  showPoints,
}) => {
  const players = Array.from({ length: 4 }, (_, playerIndex) => team.players?.[playerIndex]);
  const eliminated = isEliminated(team);
  const previousEliminated = useRef(eliminated);
  const [phase, setPhase] = useState<"idle" | "flash_wipe">("idle");
  const [showElimText, setShowElimText] = useState(false);

  useEffect(() => {
    const justEliminated = eliminated && !previousEliminated.current;

    if (justEliminated) {
      setPhase("flash_wipe");
      const timer1 = window.setTimeout(() => setShowElimText(true), ELIMINATION_SWAP_DELAY_MS);
      const timer2 = window.setTimeout(() => {
        setPhase("idle");
        setShowElimText(false);
      }, ELIMINATION_BANNER_MS);

      previousEliminated.current = eliminated;

      return () => {
        window.clearTimeout(timer1);
        window.clearTimeout(timer2);
      };
    }

    if (!eliminated) {
      setPhase("idle");
      setShowElimText(false);
    }

    previousEliminated.current = eliminated;
  }, [eliminated]);

  return (
    <RowShell
      layout="position"
      layoutDependency={`${index}:${rowHeight}`}
      transition={{ layout: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }}
      $height={rowHeight}
      $index={index}
      $rowCount={rowCount}
      $phase={animationPhase}
      $animateIntro={enableIntroAnimation || animationPhase === "exiting"}
    >
      {phase === "flash_wipe" && (
        <>
          <RosterOverlay>
            {players.map((player, playerIndex) => (
              <PortraitFrame key={playerIndex}>
                {player?.playerPic ? <Portrait src={player.playerPic} alt="" onError={hideBrokenLogo} /> : null}
                <Skull>X</Skull>
              </PortraitFrame>
            ))}
          </RosterOverlay>
          <FlashOverlay />
          {showElimText && (
            <ElimBannerWrap>
              <ElimBanner>Eliminated</ElimBanner>
            </ElimBannerWrap>
          )}
        </>
      )}

      <Row
        $eliminated={eliminated}
        $height={rowHeight}
        style={phase === "flash_wipe" ? { opacity: 0 } : undefined}
      >
        <RankLogoArea>
          <Rank>{rank}</Rank>
          <Divider>|</Divider>
          <LogoBox $showFlags={showFlags} $hasLogo={Boolean(team.logoUrl)}>
            {showFlags && team.countryUrl ? <Flag src={team.countryUrl} alt="" onError={hideBrokenLogo} /> : null}
            {team.logoUrl ? <Logo src={team.logoUrl} alt={team.name} onError={hideBrokenLogo} /> : null}
          </LogoBox>
        </RankLogoArea>

        <TagBanner>
          <TagText>{tagOf(team)}</TagText>
        </TagBanner>

        <Stats $showPoints={showPoints}>
          <StatWrap $width={ELIMS_WIDTH}>
            <StatValue>{numberOf(team.kills)}</StatValue>
          </StatWrap>

          {showPoints && (
            <StatWrap $width={POINTS_WIDTH}>
              <StatValue>{pointsOf(team)}</StatValue>
            </StatWrap>
          )}

          <HealthPanel $width={HEALTH_WIDTH}>
            {players.map((player, playerIndex) => {
              const state = statusOf(player);
              return (
                <HealthBar key={playerIndex}>
                  <HealthFill $hp={hpPercentOf(player)} $state={state} />
                </HealthBar>
              );
            })}
          </HealthPanel>
        </Stats>
      </Row>
    </RowShell>
  );
};

const Board = styled.div<{ $width: number }>`
  position: fixed;
  top: 50%;
  right: 26px;
  transform: translateY(-50%) scale(0.51);
  transform-origin: right center;
  width: ${({ $width }) => $width}px;
  display: flex;
  flex-direction: column;
  text-transform: uppercase;
  z-index: 999;
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", Arial, sans-serif;

  @media (min-width: 2560px) {
    right: 26px;
    transform: translateY(-50%) scale(1);
    transform-origin: right center;
  }
`;

const BoardHeader = styled.div<{ $width: number; $phase?: TableAnimationPhase; $rowCount?: number }>`
  align-self: flex-end;
  display: flex;
  justify-content: flex-end;
  width: ${({ $width }) => $width}px;
  margin-bottom: 6px;
  padding: 12px 10px 10px 0;
  background: var(--live3-header);
  color: var(--live3-header-text);
  opacity: ${({ $phase }) => ($phase === "exiting" ? 1 : 0)};
  animation: ${({ $phase }) => ($phase === "exiting" ? tableFallOut : tableFallIn)}
    420ms cubic-bezier(0.2, 0.8, 0.2, 1)
    ${({ $phase, $rowCount = 0 }) => ($phase === "exiting" ? 160 + $rowCount * 55 : 80)}ms
    both;
  clip-path: polygon(26px 0, 100% 0, 100% 100%, 0% 100%);
`;

const HeaderLabel = styled.span`
  width: 76px;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.9px;
`;

const HeaderHealth = styled(HeaderLabel)`
  width: 96px;
  margin-right: 14px;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${ROW_GAP}px;
`;

const RowShell = styled(motion.div)<{
  $height: number;
  $index: number;
  $rowCount: number;
  $phase?: TableAnimationPhase;
  $animateIntro: boolean;
}>`
  position: relative;
  height: ${({ $height }) => $height}px;
  overflow: hidden;
  transition: height 240ms ease;
  will-change: transform, height;

  ${({ $phase, $animateIntro, $index, $rowCount }) =>
    $animateIntro
      ? css`
          opacity: ${$phase === "exiting" ? 1 : 0};
          animation: ${$phase === "exiting" ? tableFallOut : tableFallIn}
            420ms cubic-bezier(0.2, 0.8, 0.2, 1)
            ${$phase === "exiting" ? 150 + ($rowCount - $index - 1) * 55 : 180 + $index * 75}ms
            both;
        `
      : css`
          opacity: 1;
          animation: none;
        `}
`;

const Row = styled.div<{ $eliminated: boolean; $height: number }>`
  display: flex;
  align-items: center;
  height: ${({ $height }) => $height}px;
  overflow: hidden;
  background: var(--live3-stats);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  opacity: ${({ $eliminated }) => ($eliminated ? 0.72 : 1)};
  transition: height 240ms ease, opacity 220ms ease;
`;

const RankLogoArea = styled.div`
  display: flex;
  align-items: center;
  width: 182px;
  height: 100%;
  flex-shrink: 0;
  background: var(--live3-rank);
  z-index: 1;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const Rank = styled.div`
  width: 58px;
  color: #ffffff;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const Divider = styled.div`
  margin-right: 14px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 26px;
  font-weight: 400;
  user-select: none;
  line-height: 1;
`;

const LogoBox = styled.div<{ $showFlags: boolean; $hasLogo: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $showFlags, $hasLogo }) => {
    if ($showFlags && $hasLogo) return "74px";
    if ($showFlags || $hasLogo) return "42px";
    return "0px";
  }};
  height: 100%;
  margin-left: 0;
  margin-right: ${({ $showFlags, $hasLogo }) => ($showFlags || $hasLogo ? "10px" : "0")};
  flex: 0 0 ${({ $showFlags, $hasLogo }) => {
    if ($showFlags && $hasLogo) return "74px";
    if ($showFlags || $hasLogo) return "42px";
    return "0px";
  }};
  gap: ${({ $showFlags, $hasLogo }) => ($showFlags && $hasLogo ? "6px" : "0")};
  overflow: hidden;
`;

const Flag = styled.img`
  width: 18px;
  height: 12px;
  object-fit: cover;
  border-radius: 1px;
`;

const Logo = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
`;

const TagBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 138px;
  height: 100%;
  margin-left: -34px;
  padding-left: 12px;
  background: var(--live3-tag);
  clip-path: polygon(18px 0, 100% 0, calc(100% - 18px) 100%, 0% 100%);
  z-index: 3;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const TagText = styled.span`
  padding-right: 10px;
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.7px;
  text-align: center;
  line-height: 1;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const Stats = styled.div<{ $showPoints: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-grow: 1;
  height: 100%;
  margin-left: -14px;
  padding-left: 14px;
  gap: 0;
  z-index: 2;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const StatWrap = styled.div<{ $width: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: ${({ $width }) => $width}px;
  flex: 0 0 ${({ $width }) => $width}px;
`;

const StatValue = styled.span`
  display: inline-block;
  min-width: 2ch;
  color: var(--live3-text);
  font-family: "Orbitron", "Rajdhani", "Oswald", sans-serif;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const HealthPanel = styled.div<{ $width: number }>`
  display: grid;
  grid-template-columns: repeat(4, 10px);
  gap: 5px;
  width: ${({ $width }) => $width}px;
  height: 36px;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex: 0 0 ${({ $width }) => $width}px;
  contain: layout paint style;
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const HealthBar = styled.div`
  width: 10px;
  height: 100%;
  border-radius: 1px;
  background: var(--live3-dead);
  overflow: hidden;
  position: relative;
`;

const HealthFill = styled.span<{ $hp: number; $state: "alive" | "knocked" | "recalled" | "dead" }>`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: ${({ $state, $hp }) => {
    if ($state === "dead") return "transparent";
    if ($state === "recalled") return "#2575fc";
    if ($state === "knocked" || $hp <= 25) return "#ff3c14";
    return "var(--live3-health)";
  }};
  transition: transform 160ms ease, background-color 160ms ease;
  transform: scaleY(${({ $state, $hp }) => ($state === "dead" ? 0 : $hp / 100)});
  transform-origin: bottom center;
  will-change: transform;

  ${({ $state, $hp }) =>
    $state === "alive" &&
    $hp > 0 &&
    $hp <= 25 &&
    css`
      background: #ff3c14;
      box-shadow: 0 0 7px rgba(255, 60, 20, 0.75);
    `}
`;

const RosterOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(90deg, #1f0205 0%, #0a0102 60%, #000000 100%);
  box-shadow: inset 0 0 20px rgba(220, 38, 38, 0.4);
  z-index: 4;
`;

const FlashOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(220, 38, 38, 0.92) 25%,
    #fb7185 50%,
    rgba(220, 38, 38, 0.92) 75%,
    transparent
  );
  mix-blend-mode: screen;
  z-index: 6;
  animation: ${redWipeEffect} 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const PortraitFrame = styled.div`
  position: relative;
  overflow: hidden;
  background: #020503;
  border: 1px solid rgba(220, 38, 38, 0.7);
  border-radius: 4px;
`;

const Portrait = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(1) brightness(0.34) contrast(1.16);
`;

const Skull = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  font-size: 14px;
  font-weight: 700;
`;

const ElimBannerWrap = styled.div`
  position: absolute;
  inset: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
`;

const ElimBanner = styled.div`
  min-width: 92%;
  padding: 4px 16px 5px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(220, 38, 38, 0.98) 16%,
    #fb7185 50%,
    rgba(220, 38, 38, 0.98) 84%,
    transparent 100%
  );
  color: #ffffff;
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", "Anton", "Arial Black", sans-serif;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.75), 0 0 12px rgba(255, 255, 255, 0.35);
  animation: ${eliminatedTextSwap} 1.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  height: ${FOOTER_HEIGHT}px;
  margin-top: 8px;
  padding: 0 12px;
  background: var(--live3-footer);
  color: var(--live3-footer-text);
  font-family: "Oswald", "Arial Narrow", sans-serif;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.7px;
`;

const AnimatedFooter = styled(Footer)<{ $phase?: TableAnimationPhase; $rowCount: number }>`
  opacity: ${({ $phase }) => ($phase === "exiting" ? 1 : 0)};
  animation: ${({ $phase }) => ($phase === "exiting" ? tableFallOut : tableFallIn)}
    420ms cubic-bezier(0.2, 0.8, 0.2, 1)
    ${({ $phase, $rowCount }) => ($phase === "exiting" ? 40 : 240 + $rowCount * 75)}ms
    both;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const LegendSwatch = styled.i<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  background: ${({ $color }) => $color};
  border: 1px solid rgba(255, 255, 255, 0.16);
`;
