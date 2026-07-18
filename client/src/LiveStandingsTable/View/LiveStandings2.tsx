import React, { useEffect, useMemo, useState } from "react";
import styled, { css, keyframes } from "styled-components";
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

const PANEL_WIDTH = 296;
const RANK_WIDTH = 46;
const FLAG_WIDTH = 30;
const STATUS_WIDTH = 84;
const FIN_WIDTH = 36;
const PTS_WIDTH = 50;
const STATUS_BAR_WIDTH = 6;
const STATUS_BAR_GAP = 3;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 38;
const ELIMINATION_ROW_HEIGHT = 64;
const MIN_COMPACT_ROW_HEIGHT = 26;
const FOOTER_HEIGHT = 30;
const ELIMINATION_SWAP_DELAY_MS = 700;
const ELIMINATION_BANNER_MS = 1800;
const HEADER_BG = "var(--live2-color-3)";
const PANEL_BG = "transparent";
const ROW_BG = "var(--live2-color-2)";
const RANK_BG = "var(--live2-color-2)";

type LayoutProps = { $showFlags: boolean; $showPoints: boolean };

const lowHealthPulse = keyframes`
  0%, 100% {
    background: #ff3c14;
    box-shadow: 0 0 3px rgba(255, 60, 20, 0.55);
    opacity: 0.75;
  }
  50% {
    background: #ff1600;
    box-shadow: 0 0 9px rgba(255, 22, 0, 0.9);
    opacity: 1;
  }
`;

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
  0% { opacity: 0; transform: translateY(-18px) scale(1.015); }
  68% { opacity: 1; transform: translateY(2px) scale(1); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const tableFallOut = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-16px) scale(0.985); }
`;

const panelChromeIn = keyframes`
  0% { border-color: transparent; }
  100% { border-color: var(--live2-color-4); }
`;

const panelChromeOut = keyframes`
  0% { border-color: var(--live2-color-4); }
  100% { border-color: transparent; }
`;

const gridTemplate = ({ $showFlags, $showPoints }: LayoutProps) =>
  [
    `${RANK_WIDTH}px`,
    $showFlags ? `${FLAG_WIDTH}px` : "",
    "112px",
    `${STATUS_WIDTH}px`,
    `${FIN_WIDTH}px`,
    $showPoints ? `${PTS_WIDTH}px` : "",
  ]
    .filter(Boolean)
    .join(" ");

const panelWidth = ({ $showFlags, $showPoints }: LayoutProps) =>
  RANK_WIDTH + 112 + STATUS_WIDTH + FIN_WIDTH + ($showFlags ? FLAG_WIDTH : 0) + ($showPoints ? PTS_WIDTH : 0);

const Panel = styled.div<LayoutProps & { $phase?: TableAnimationPhase; $rowCount: number }>`
  position: fixed;
  top: 50%;
  right: 26px;
  transform: translateY(-50%);
  width: ${panelWidth}px;
  color: #ffffff;
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", "Oswald", "Arial Narrow", sans-serif;
  text-transform: uppercase;
  overflow: hidden;
  background: ${PANEL_BG};
  border: 1px solid transparent;
  box-shadow: none;
  animation: ${({ $phase }) => ($phase === "exiting" ? panelChromeOut : panelChromeIn)}
    220ms linear
    ${({ $phase, $rowCount }) => ($phase === "exiting" ? 40 : 80 + $rowCount * 75)}ms
    both;

  /* The compact reference design expands to Style 1's broadcast footprint at 2K. */
  @media (min-width: 2560px) {
    right: 26px;
    transform: translateY(-50%) scale(1.96);
    transform-origin: right center;
  }
`;

const Header = styled.div<LayoutProps & { $phase?: TableAnimationPhase; $rowCount?: number }>`
  display: grid;
  grid-template-columns: ${gridTemplate};
  align-items: center;
  height: ${HEADER_HEIGHT}px;
  background: ${HEADER_BG};
  border-bottom: 1px solid #000000;
  color: var(--live2-text-color-3);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  opacity: ${({ $phase }) => ($phase === "exiting" ? 1 : 0)};
  animation: ${({ $phase }) => ($phase === "exiting" ? tableFallOut : tableFallIn)}
    420ms cubic-bezier(0.2, 0.8, 0.2, 1)
    ${({ $phase, $rowCount = 0 }) => ($phase === "exiting" ? 160 + $rowCount * 55 : 80)}ms
    both;
`;

const HeaderCell = styled.div<{ $rank?: boolean; $center?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $center }) => ($center ? "center" : "flex-start")};
  height: 100%;
  padding: 0;

  ${({ $rank }) =>
    $rank &&
    css`
      justify-content: center;
      background: transparent;
      border: 0;
    `}
`;

const TableBody = styled.div`
  background: ${PANEL_BG};
`;

const Row = styled.div<{ $highlighted: boolean; $eliminated: boolean; $height: number } & LayoutProps>`
  display: grid;
  grid-template-columns: ${gridTemplate};
  align-items: center;
  height: ${({ $height }) => $height}px;
  border-bottom: 1px solid #000000;
  background: var(--live2-color-1-70);
  transition: height 240ms ease, opacity 220ms ease;
`;

const RowShell = styled.div<{ $height: number; $index: number; $rowCount: number; $phase?: TableAnimationPhase }>`
  position: relative;
  height: ${({ $height }) => $height}px;
  overflow: hidden;
  transition: height 240ms ease;
  opacity: ${({ $phase }) => ($phase === "exiting" ? 1 : 0)};
  animation: ${({ $phase }) => ($phase === "exiting" ? tableFallOut : tableFallIn)}
    420ms cubic-bezier(0.2, 0.8, 0.2, 1)
    ${({ $phase, $index, $rowCount }) =>
      $phase === "exiting" ? 150 + ($rowCount - $index - 1) * 55 : 180 + $index * 75}ms
    both;
`;

const RankCell = styled.div<{ $highlighted: boolean; $eliminated: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--live2-color-2);
  color: var(--live2-text-color-2);
  font-family: "Roboto Condensed", "Arial Narrow", sans-serif;
  font-size: 21px;
  font-style: italic;
  font-weight: 700;
  border-right: 1px solid #000000;
`;

const TeamCell = styled.div<{ $highlighted: boolean; $eliminated: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  min-width: 0;
  padding: 0 0 0 8px;
  background: var(--live2-color-2);
  color: var(--live2-text-color-2);
  border-right: 1px solid #000000;
`;

const FlagCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--live2-color-2);
`;

const Flag = styled.img`
  width: 18px;
  height: 13px;
  object-fit: cover;
`;

const LogoWrap = styled.div<{ $eliminated: boolean }>`
  width: 18px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  opacity: 0.8;
`;

const Logo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const TeamName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-shadow: none;
`;

const StatusCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: ${STATUS_BAR_GAP}px;
  background: transparent;
`;

const StatusBar = styled.i`
  display: block;
  width: ${STATUS_BAR_WIDTH}px;
  height: 20px;
  background: rgba(0, 0, 0, 0.34);
  overflow: hidden;
  position: relative;
`;

const StatusFill = styled.span<{ $hp: number; $state: "alive" | "knocked" | "recalled" | "dead" }>`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: ${({ $state, $hp }) => ($state === "dead" ? "0%" : `${$hp}%`)};
  background: ${({ $state, $hp }) => {
    if ($state === "dead") return "transparent";
    if ($state === "recalled") return "#2575fc";
    if ($state === "knocked" || $hp <= 25) return "#ff3c14";
    return "#24fe5b";
  }};
  transition: height 160ms ease, background-color 160ms ease;

  ${({ $state, $hp }) =>
    $state === "alive" &&
    $hp > 0 &&
    $hp <= 25 &&
    css`
      animation: ${lowHealthPulse} 700ms ease-in-out infinite;
    `}
`;

const NumberCell = styled.div<{ $highlighted: boolean; $eliminated: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: transparent;
  color: var(--live2-text-color-1);
  font-size: 20px;
  font-weight: 700;
`;

const FlashOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 60, 20, 0.94) 25%,
    #ff8a70 50%,
    rgba(255, 60, 20, 0.94) 75%,
    transparent
  );
  mix-blend-mode: screen;
  z-index: 6;
  animation: ${redWipeEffect} 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const RosterOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(90deg, #1f0205 0%, #0a0102 60%, #000000 100%);
  box-shadow: inset 0 0 18px rgba(255, 60, 20, 0.38);
  z-index: 4;
`;

const PortraitFrame = styled.div`
  position: relative;
  overflow: hidden;
  background: #020503;
  border: 1px solid rgba(255, 60, 20, 0.65);
  border-radius: 3px;
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
  color: #ff3c14;
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
  padding: 4px 14px 5px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 60, 20, 0.98) 16%,
    #ff8a70 50%,
    rgba(255, 60, 20, 0.98) 84%,
    transparent 100%
  );
  color: #ffffff;
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", "Oswald", "Arial Narrow", sans-serif;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.75), 0 0 10px rgba(255, 255, 255, 0.32);
  animation: ${eliminatedTextSwap} 1.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: ${FOOTER_HEIGHT}px;
  background: var(--live2-color-4);
  border: 0;
  font-size: 11px;
  font-weight: 800;
  color: var(--live2-text-color-4);
  letter-spacing: 0.5px;
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
`;

const numberOf = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTeamId = (team: Team) => String(team.id);

const withOpacity = (color: string, opacity: number) => {
  const normalized = color.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return color;

  const value = Number.parseInt(normalized, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
};

const pointsOf = (team: Team) => {
  if (team.totalPoints !== undefined && team.totalPoints !== null) {
    return numberOf(team.totalPoints);
  }

  return numberOf(team.rankingScore ?? team.placementPoints) + numberOf(team.kills);
};

const tagOf = (team: Team) => team.teamTag || team.shortName || team.tag || team.name;

const hideBrokenLogo = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.style.display = "none";
};

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

const isEliminated = (team: Team) =>
  Boolean(team.isEliminated || team.is_eliminated) ||
  (team.isPlaying !== false && numberOf(team.playersAlive) <= 0);

const getRowHeightMap = (teams: Team[], flashingIds: Set<string>) => {
  const activeCount = teams.filter((team) => flashingIds.has(getTeamId(team))).length;
  const totalHeight = teams.length * ROW_HEIGHT;

  if (teams.length === 0 || activeCount === 0) {
    return new Map(teams.map((team) => [getTeamId(team), ROW_HEIGHT]));
  }

  let eliminationHeight = ELIMINATION_ROW_HEIGHT;
  const compactCount = teams.length - activeCount;

  if (compactCount > 0) {
    const maxEliminationHeight =
      (totalHeight - compactCount * MIN_COMPACT_ROW_HEIGHT) / activeCount;
    eliminationHeight = Math.min(eliminationHeight, maxEliminationHeight);
  } else {
    eliminationHeight = totalHeight / activeCount;
  }

  const compactHeight =
    compactCount > 0
      ? (totalHeight - eliminationHeight * activeCount) / compactCount
      : eliminationHeight;

  return new Map(
    teams.map((team) => [
      getTeamId(team),
      flashingIds.has(getTeamId(team)) ? eliminationHeight : compactHeight,
    ]),
  );
};

const LiveStandings2Row: React.FC<{
  team: Team;
  rank: number;
  rowHeight: number;
  index: number;
  rowCount: number;
  animationPhase?: TableAnimationPhase;
  showFlags: boolean;
  showPoints: boolean;
}> = ({ team, rank, rowHeight, index, rowCount, animationPhase = "entering", showFlags, showPoints }) => {
  const eliminated = isEliminated(team);
  const players = Array.from({ length: 4 }, (_, playerIndex) => team.players?.[playerIndex]);
  const [phase, setPhase] = useState<"idle" | "flash_wipe">("idle");
  const [showElimText, setShowElimText] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(eliminated);

  useEffect(() => {
    if (eliminated && !hasTriggered) {
      setHasTriggered(true);
      setPhase("flash_wipe");
      const timer1 = window.setTimeout(() => setShowElimText(true), ELIMINATION_SWAP_DELAY_MS);
      const timer2 = window.setTimeout(() => {
        setPhase("idle");
        setShowElimText(false);
      }, ELIMINATION_BANNER_MS);
      return () => {
        window.clearTimeout(timer1);
        window.clearTimeout(timer2);
      };
    }

    if (!eliminated) {
      setPhase("idle");
      setShowElimText(false);
      setHasTriggered(false);
    }
  }, [eliminated, hasTriggered]);

  return (
    <RowShell $height={rowHeight} $index={index} $rowCount={rowCount} $phase={animationPhase}>
      {phase === "flash_wipe" && (
        <>
          <RosterOverlay>
            {players.map((player, playerIndex) => (
              <PortraitFrame key={playerIndex}>
                {player?.playerPic ? <Portrait src={player.playerPic} alt="" onError={hideBrokenLogo} /> : null}
                <Skull>☠</Skull>
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
        $highlighted={false}
        $eliminated={eliminated}
        $height={rowHeight}
        $showFlags={showFlags}
        $showPoints={showPoints}
        style={phase === "flash_wipe" ? { opacity: 0 } : undefined}
      >
        <RankCell $highlighted={false} $eliminated={eliminated}>{rank}</RankCell>

        {showFlags && (
          <FlagCell>
            {team.countryUrl ? <Flag src={team.countryUrl} alt="" onError={hideBrokenLogo} /> : null}
          </FlagCell>
        )}

        <TeamCell $highlighted={false} $eliminated={eliminated}>
          <LogoWrap $eliminated={eliminated}>
            {team.logoUrl ? <Logo src={team.logoUrl} alt="" onError={hideBrokenLogo} /> : null}
          </LogoWrap>
          <TeamName>{tagOf(team)}</TeamName>
        </TeamCell>

        <StatusCell>
          {players.map((player, playerIndex) => {
            const state = statusOf(player);
            return (
              <StatusBar key={playerIndex}>
                <StatusFill $hp={hpPercentOf(player)} $state={state} />
              </StatusBar>
            );
          })}
        </StatusCell>

        <NumberCell $highlighted={false} $eliminated={eliminated}>{numberOf(team.kills)}</NumberCell>
        {showPoints && (
          <NumberCell $highlighted={false} $eliminated={eliminated}>{pointsOf(team)}</NumberCell>
        )}
      </Row>
    </RowShell>
  );
};

const LiveStandings2: React.FC<{ teams?: Team[]; animationPhase?: TableAnimationPhase }> = ({
  teams = [],
  animationPhase = "entering",
}) => {
  const [displaySettings, setDisplaySettings] = useState(getBroadcastDisplaySettings);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(() => new Set());
  const previousEliminatedIdsRef = React.useRef<Set<string>>(new Set());
  const hasEliminationBaselineRef = React.useRef(false);
  const flashingTimersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

  const showFlags = displaySettings.showCountryFlags;
  const showPoints = displaySettings.showLiveStandingsPoints;
  const overlayColors = {
    "--live2-color-1": displaySettings.liveStandings2Color1,
    "--live2-color-1-70": withOpacity(displaySettings.liveStandings2Color1, 0.7),
    "--live2-color-2": displaySettings.liveStandings2Color2,
    "--live2-color-3": displaySettings.liveStandings2Color3,
    "--live2-color-4": displaySettings.liveStandings2Color4,
    "--live2-text-color-1": displaySettings.liveStandings2TextColor1,
    "--live2-text-color-2": displaySettings.liveStandings2TextColor2,
    "--live2-text-color-3": displaySettings.liveStandings2TextColor3,
    "--live2-text-color-4": displaySettings.liveStandings2TextColor4,
  } as React.CSSProperties;
  const rankedTeams = useMemo(
    () =>
      [...teams].sort((left, right) => {
        const pointDiff = pointsOf(right) - pointsOf(left);
        if (pointDiff !== 0) return pointDiff;
        return numberOf(right.kills) - numberOf(left.kills);
      }),
    [teams],
  );

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

  const rowHeights = useMemo(() => getRowHeightMap(rankedTeams, flashingIds), [rankedTeams, flashingIds]);

  return (
    <>
    <LiveStandingsFont />
    <Panel
      $showFlags={showFlags}
      $showPoints={showPoints}
      $phase={animationPhase}
      $rowCount={rankedTeams.length}
      style={overlayColors}
    >
        <Header
          $showFlags={showFlags}
          $showPoints={showPoints}
          $phase={animationPhase}
          $rowCount={rankedTeams.length}
        >
        <HeaderCell $rank>#</HeaderCell>
        {showFlags && <HeaderCell $center />}
        <HeaderCell>Teams</HeaderCell>
        <HeaderCell $center>Status</HeaderCell>
        <HeaderCell $center>ELIM</HeaderCell>
        {showPoints && <HeaderCell $center>Pts</HeaderCell>}
      </Header>

      <TableBody>
        {rankedTeams.map((team, index) => {
          const rank = index + 1;
          return (
            <LiveStandings2Row
              key={team.id}
              team={team}
              rank={rank}
              index={index}
              rowCount={rankedTeams.length}
              animationPhase={animationPhase}
              rowHeight={rowHeights.get(getTeamId(team)) ?? ROW_HEIGHT}
              showFlags={showFlags}
              showPoints={showPoints}
            />
          );
        })}
      </TableBody>

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
          <LegendSwatch $color="#4b5d60" />
          Eliminated
        </LegendItem>
        </AnimatedFooter>
    </Panel>
    </>
  );
};

export default LiveStandings2;
