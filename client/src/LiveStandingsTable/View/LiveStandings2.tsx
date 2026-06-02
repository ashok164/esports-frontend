import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
import styled, { css, keyframes } from "styled-components";
import { AnimatePresence, motion } from "framer-motion";

const ELIMINATION_BANNER_MS = 2000;
const ELIMINATION_SWAP_DELAY_MS = 1000;

type PlayerStatus = "alive" | "knocked" | "recalled" | "dead";

interface Player {
  hp?: number;
  hpPercent?: number;
  isKnocked?: boolean;
  status?: PlayerStatus;
  hasRecalled?: boolean;
  playerPic?: string;
  name?: string;
}

interface Team {
  id: string | number;
  rank?: number;
  name: string;
  teamTag?: string;
  shortName?: string;
  tag?: string;
  logoUrl?: string;
  countryUrl?: string;
  kills: number;
  playersAlive: number;
  placementPoints?: number;
  rankingScore?: number;
  totalPoints?: number;
  isEliminated?: boolean;
  isPlaying?: boolean;
  players?: Player[];
}

interface StandingsTableProps {
  teams?: Team[];
  maxRows?: number;
}

/* ================= THEME & DESIGN SYSTEM ================= */
const Theme = {
  green: "#62df63",
  greenDeep: "#2fbf4a",
  aliveYellow: "#ffd35a",
  aliveBlue: "#2575fc",
  ink: "#0e120f",
  panel: "#060f0a",
  panel2: "#0a1910",
  rowA: "rgba(255,255,255,0.02)",
  rowB: "rgba(0,0,0,0.18)",
  border: "rgba(98,223,99,0.14)",
  pipeLine: "rgba(98,223,99,0.35)",
  muted: "#3d4741",
  danger: "#e52e45",
  dangerDeep: "#1a0305",
  dangerGlow: "rgba(229, 46, 69, 0.6)",
  headerText: "#b3ffd7",
  white: "#ffffff",
};

/* ================= ANIMATION CORE ================= */
const paperShake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-0.5deg); }
  50% { transform: rotate(0.4deg); }
  75% { transform: rotate(-0.3deg); }
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

/* ================= LAYOUT CONSTANTS ================= */
const BASE_ROW_HEIGHT = 64;

const GRID_LAYOUT = css`
  display: grid;
  grid-template-columns:
    62px 58px 58px minmax(120px, 1fr)
    96px 18px 66px 18px 66px;
  align-items: center;
`;

/* ================= CONTAINER COMPONENTS ================= */
const Board = styled.div`
  position: fixed;
  top: 50%;
  right: 26px;
  transform: translateY(-50%);
  width: 580px;
  font-family: "Orbitron", "Oswald", "Inter", sans-serif;
  filter: drop-shadow(0 20px 35px rgba(0, 0, 0, 0.85))
    drop-shadow(0 6px 10px rgba(0, 0, 0, 0.5));
  pointer-events: auto;
  user-select: none;
  z-index: 999;
`;

const Frame = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, ${Theme.panel}, ${Theme.panel2});
  border: 1px solid ${Theme.border};
  border-radius: 8px;
  overflow: hidden;
`;

/* ================= HUD TABLE HEADER ================= */
const HeaderRow = styled.div`
  ${GRID_LAYOUT}
  height: 44px;
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(204, 255, 209, 0.96),
    rgba(112, 255, 143, 0.94),
    rgba(190, 255, 202, 0.96)
  );
  border-bottom: 2px solid rgba(0, 0, 0, 0.28);
  color: ${Theme.ink};
  font-weight: 900;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  flex-shrink: 0;
  clip-path: polygon(
    0 0,
    98% 0,
    100% 18%,
    98% 34%,
    100% 50%,
    98% 66%,
    100% 100%,
    0 100%
  );
`;

const HeaderCell = styled.div<{ $center?: boolean }>`
  text-align: ${(p) => (p.$center ? "center" : "left")};
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$center ? "center" : "flex-start")};
  padding: 0 2px;
`;

const RowsContainer = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
`;

const RowSlot = styled.div`
  position: relative;
  height: ${BASE_ROW_HEIGHT}px;
`;

interface LiveRowProps {
  $dead: boolean;
  $odd: boolean;
  $top: boolean;
  $height: number;
  $phase: "alive" | "flash_wipe" | "settled_normal";
}

const LiveRow = styled(motion.div)<LiveRowProps>`
  ${GRID_LAYOUT}
  position: absolute;
  width: 100%;
  height: ${(p) => p.$height}px;
  overflow: hidden;
  border-bottom: 1px solid rgba(98, 223, 99, 0.06);
  background: ${(p) => (p.$odd ? Theme.rowA : Theme.rowB)};

  transition: opacity 0.8s ease;
  ${(p) =>
    p.$phase === "settled_normal" &&
    p.$dead &&
    css`
      opacity: 0.45;
      filter: grayscale(0.8);
    `}

  ${(p) =>
    p.$top &&
    !p.$dead &&
    css`
      background:
        linear-gradient(90deg, rgba(98, 223, 99, 0.07), transparent 45%),
        ${p.$odd ? Theme.rowA : Theme.rowB};
    `}
`;

/* ================= CINEMATIC LAYER WIPE (SLIDES ABOVE ENTIRE ROW) ================= */
const CinematicWipeOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    ${Theme.danger} 25%,
    #ff7388 50%,
    ${Theme.danger} 75%,
    transparent
  );
  mix-blend-mode: screen;
  z-index: 20;
  pointer-events: none;
  animation: ${redWipeEffect} 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

/* Master absolute overlay container for large portraits spanning across the entire row data cells */
const FullRowRosterOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 62px; /* Starts right after the Rank badge container */
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 5px 12px;
  background: linear-gradient(90deg, #1f0205 0%, #0a0102 60%, #000000 100%);
  box-shadow: inset 0 0 20px rgba(229, 46, 69, 0.4);
  z-index: 10;
`;

const GrandPlayerFrame = styled(motion.div)`
  position: relative;
  height: 100%;
  background: #020503;
  border: 1.5px solid ${Theme.danger};
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(229, 46, 69, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayerPortrait = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(1) brightness(0.34) contrast(1.16);
  will-change: auto;
`;

const SkullIndicator = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: ${Theme.danger};
  font-weight: 900;
  z-index: 3;
  text-shadow:
    0 0 6px #000000,
    0 0 2px #000000;
`;

const EliminatedTextOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;

  &::before {
    content: "ELIMINATED";
    min-width: 92%;
    padding: 4px 18px 6px;
    color: ${Theme.white};
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(229, 46, 69, 0.98) 16%,
      #ff7388 50%,
      rgba(229, 46, 69, 0.98) 84%,
      transparent 100%
    );
    border-top: 1px solid rgba(255, 255, 255, 0.35);
    border-bottom: 1px solid rgba(0, 0, 0, 0.65);
    font-size: 25px;
    font-weight: 900;
    letter-spacing: 7px;
    text-align: center;
    text-shadow:
      0 2px 0 rgba(0, 0, 0, 0.75),
      0 0 12px rgba(255, 255, 255, 0.35);
    animation: ${eliminatedTextSwap} 1.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
`;

/* Wrapper to easily control overall transparency of base stats content layout */
const BaseContentGroup = styled.div<{ $hidden: boolean }>`
  display: contents;
  opacity: ${(p) => (p.$hidden ? 0 : 1)};
  visibility: ${(p) => (p.$hidden ? "hidden" : "visible")};
`;

/* ================= GRID DATA CELLS ================= */
const PipeDivider = styled.div`
  font-family: system-ui, sans-serif;
  font-weight: 500;
  font-size: 28px;
  color: rgba(98, 223, 99, 0.65);
  text-align: center;
  line-height: 1;
  transform: scaleY(1.35);
`;

const RankCell = styled.div<{ $rank: number; $dead: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 900;
  z-index: 25;

  background: ${(p) =>
    p.$dead
      ? "linear-gradient(135deg, #a6323f, #4d0b13)"
      : p.$rank === 1
        ? "linear-gradient(135deg, #ffd35a, #b87917)"
        : "linear-gradient(135deg, #ccffd1, #70ff8f, #beffca)"};

  color: ${(p) => (p.$dead ? Theme.white : Theme.ink)};
  clip-path: polygon(
    0 0,
    90% 0,
    100% 10%,
    92% 24%,
    100% 36%,
    91% 50%,
    100% 64%,
    92% 78%,
    100% 100%,
    0 100%
  );
  border-right: 1px solid rgba(0, 0, 0, 0.25);
  animation: ${paperShake} 4.2s infinite ease-in-out;
  will-change: transform;
`;

const CellWrap = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
`;

const CountryBox = styled.div`
  width: 38px;
  height: 25px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(98, 223, 99, 0.12);
  border-radius: 2px;
  overflow: hidden;
`;

const LogoBox = styled.div`
  width: 39px;
  height: 31px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(98, 223, 99, 0.12);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: auto;
`;

const Logo = styled.img`
  width: 150%;
  height: 150%;
  object-fit: contain;
  will-change: auto;
`;

const TeamName = styled.div<{ $dead?: boolean }>`
  font-size: 20px;
  font-weight: 800;
  text-transform: uppercase;
  color: ${(p) => (p.$dead ? Theme.muted : "#c6ffcf")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
  text-align: center;
  width: 100%;
`;

const Num = styled.div`
  text-align: center;
  font-size: 25px;
  font-weight: 800;
  color: #a6ffbe;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ================= MINI COMPACT HUD INTERFACES ================= */
const AliveWrap = styled(motion.div)`
  display: flex;
  gap: 3px;
  justify-content: center;
  height: 100%;
  align-items: center;
  width: 96px;
`;

const Bar = styled.div`
  width: 8px;
  height: 32px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(98, 223, 99, 0.1);
  overflow: hidden;
  position: relative;
  will-change: auto;
`;

const Fill = styled.div<{ $hp: number; $status: PlayerStatus | "empty" }>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${(p) => (p.$status === "empty" ? "0%" : `${p.$hp}%`)};
  transition: height 0.15s ease;
  will-change: height;

  background: ${(p) => {
    if (p.$status === "alive") return Theme.aliveYellow;
    if (p.$status === "knocked") return Theme.danger;
    if (p.$status === "recalled") return Theme.aliveBlue;
    return "transparent";
  }};
`;

/* ================= FOOTER COMPONENT ================= */
const Footer = styled.div`
  height: 40px;
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(204, 255, 209, 0.96),
    rgba(112, 255, 143, 0.94),
    rgba(190, 255, 202, 0.96)
  );
  border-top: 2px solid rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  clip-path: polygon(
    0 0,
    100% 0,
    100% 100%,
    2% 100%,
    0 82%,
    2% 66%,
    0 50%,
    2% 34%,
    0 18%
  );
`;

const Legend = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${Theme.ink};
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
`;

const ColorSquare = styled.div<{ $color: string; $border?: string }>`
  width: 10px;
  height: 10px;
  background: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$border || "rgba(0,0,0,0.5)"};
`;

const EmptyState = styled.div`
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Theme.muted};
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
`;

/* ================= CONVERSION PARSERS ================= */
const toNumber = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const getPoints = (t: Team) =>
  typeof t.totalPoints === "number"
    ? t.totalPoints
    : toNumber(t.rankingScore ?? t.placementPoints) + toNumber(t.kills);
const getTag = (t: Team) => t.teamTag || t.shortName || t.tag || t.name;
const getPlayers = (team: Team): Array<Player | null> =>
  Array.from({ length: 4 }, (_, i) => team.players?.[i] ?? null);
const getPlayerHpPercent = (p: Player | null) => {
  if (!p) return 0;
  return Math.max(0, Math.min(100, toNumber(p.hpPercent ?? p.hp ?? 100)));
};
const getPlayerStatus = (p: Player | null): PlayerStatus | "empty" => {
  if (!p) return "empty";
  if (getPlayerHpPercent(p) <= 0) return "dead";
  if (p.hasRecalled) return "recalled";
  if (p.status === "dead") return "dead";
  if (p.status === "knocked" || p.isKnocked) return "knocked";
  return "alive";
};
const isTeamDead = (t: Team) =>
  t.isPlaying !== false &&
  (Boolean(t.isEliminated) || toNumber(t.playersAlive) <= 0);
const formatRank = (rank: number) => `0${rank}`.slice(-2);
const getTeamId = (team: Team) => String(team.id);

// ================= OPTIMIZED MEMOIZED TEAM ROW =================
interface TeamRowData {
  teams: Team[];
}

interface TeamRowProps extends TeamRowData {
  index: number;
  style: React.CSSProperties;
}

const TeamRowComponent = memo(function TeamRow({
  index,
  style,
  teams,
}: TeamRowProps) {
  const team = teams[index];
  if (!team) return null;

  const isDead = isTeamDead(team);
  const players = getPlayers(team);

  const [phase, setPhase] = useState<"alive" | "flash_wipe" | "settled_normal">(
    isDead ? "settled_normal" : "alive",
  );
  const [showElimText, setShowElimText] = useState(false);
  const phaseRef = useRef(phase);

  useEffect(() => {
    if (isDead) {
      if (phaseRef.current === "alive") {
        setPhase("flash_wipe");
        phaseRef.current = "flash_wipe";

        const timer1 = setTimeout(() => {
          setShowElimText(true);
        }, ELIMINATION_SWAP_DELAY_MS);

        const timer2 = setTimeout(() => {
          setPhase("settled_normal");
          phaseRef.current = "settled_normal";
        }, ELIMINATION_BANNER_MS);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    } else {
      setPhase("alive");
      phaseRef.current = "alive";
      setShowElimText(false);
    }
  }, [isDead]);

  const rank = team.rank ?? team.rankingScore ?? index + 1;

  return (
    <div style={style}>
      <LiveRow
        $dead={isDead}
        $odd={index % 2 === 1}
        $top={rank === 1}
        $height={phase === "flash_wipe" ? 112 : 64}
        $phase={phase}
        layout={false}
      >
        {phase === "flash_wipe" && showElimText && <CinematicWipeOverlay />}

        {/* Player portraits overlay */}
        <AnimatePresence mode="wait">
          {phase === "flash_wipe" && (
            <FullRowRosterOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              layout={false}
            >
              {showElimText && (
                <EliminatedTextOverlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  layout={false}
                />
              )}

              {players.map((player, pIdx) => (
                <GrandPlayerFrame
                  key={pIdx}
                  initial={{ scale: 0.8, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    delay: pIdx * 0.04,
                    type: "spring",
                    stiffness: 240,
                    damping: 18,
                  }}
                  layout={false}
                >
                  <SkullIndicator>☠</SkullIndicator>
                  {player?.playerPic ? (
                    <PlayerPortrait src={player.playerPic} alt="" />
                  ) : (
                    <div style={{ color: "#222", fontSize: "14px" }}>☠</div>
                  )}
                </GrandPlayerFrame>
              ))}
            </FullRowRosterOverlay>
          )}
        </AnimatePresence>

        {/* Base content */}
        <BaseContentGroup $hidden={phase === "flash_wipe"}>
          <RankCell $rank={rank} $dead={isDead}>
            {formatRank(rank)}
          </RankCell>

          <CellWrap>
            <CountryBox>
              {team.countryUrl && <Img src={team.countryUrl} alt="" />}
            </CountryBox>
          </CellWrap>

          <CellWrap>
            <LogoBox>
              {team.logoUrl && <Logo src={team.logoUrl} alt="" />}
            </LogoBox>
          </CellWrap>

          <TeamName $dead={isDead}>{getTag(team)}</TeamName>

          <AliveWrap layout={false}>
            {players.map((player, pIdx) => {
              const st = getPlayerStatus(player);
              return (
                <Bar key={pIdx}>
                  <Fill $hp={getPlayerHpPercent(player)} $status={st} />
                </Bar>
              );
            })}
          </AliveWrap>

          <PipeDivider>|</PipeDivider>
          <Num>{getPoints(team)}</Num>

          <PipeDivider>|</PipeDivider>
          <Num>{toNumber(team.kills)}</Num>
        </BaseContentGroup>
      </LiveRow>
    </div>
  );
});

/* ================= MAIN COMPONENT ================= */
export default function StandingsTable({
  teams = [],
  maxRows = 18,
}: StandingsTableProps) {
  console.log("Want to see api Call for realtime api? lol you cant track api");
  const sortedTeams = useMemo(() => {
    return [...teams]
      .sort((a, b) => {
        const pointDiff = getPoints(b) - getPoints(a);
        if (pointDiff !== 0) return pointDiff;
        return toNumber(b.kills) - toNumber(a.kills);
      })
      .slice(0, maxRows)
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));
  }, [teams, maxRows]);

  // Batch image preloading
  useEffect(() => {
    const urls = new Set<string>();
    sortedTeams.forEach((team) => {
      team.players?.forEach((player) => {
        if (player?.playerPic) urls.add(player.playerPic);
      });
    });

    // Use requestIdleCallback for non-blocking preloading
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => {
        urls.forEach((url) => {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.href = url;
          document.head.appendChild(link);
        });
      });
    }
  }, [sortedTeams]);

  if (sortedTeams.length === 0) {
    return (
      <Board>
        <Frame>
          <HeaderRow>
            <HeaderCell $center>#</HeaderCell>
            <HeaderCell />
            <HeaderCell />
            <HeaderCell $center>TEAM</HeaderCell>
            <HeaderCell $center>ALIVE</HeaderCell>
            <PipeDivider>|</PipeDivider>
            <HeaderCell $center>PTS</HeaderCell>
            <PipeDivider>|</PipeDivider>
            <HeaderCell $center>KILL</HeaderCell>
          </HeaderRow>
          <EmptyState>No Teams Active</EmptyState>
        </Frame>
      </Board>
    );
  }

  return (
    <Board>
      <Frame>
        <HeaderRow>
          <HeaderCell $center>#</HeaderCell>
          <HeaderCell />
          <HeaderCell />
          <HeaderCell $center>TEAM</HeaderCell>
          <HeaderCell $center>ALIVE</HeaderCell>
          <PipeDivider>|</PipeDivider>
          <HeaderCell $center>PTS</HeaderCell>
          <PipeDivider>|</PipeDivider>
          <HeaderCell $center>KILL</HeaderCell>
        </HeaderRow>

        <RowsContainer>
          {sortedTeams.map((team, index) => (
            <RowSlot key={getTeamId(team)}>
              <TeamRowComponent
                index={index}
                teams={sortedTeams}
                style={{ height: BASE_ROW_HEIGHT, width: "100%" }}
              />
            </RowSlot>
          ))}
        </RowsContainer>

        <Footer>
          <Legend>
            <LegendItem>
              <ColorSquare $color={Theme.aliveYellow} />
              <ColorSquare $color={Theme.aliveBlue} />
              ALIVE
            </LegendItem>

            <LegendItem>
              <ColorSquare $color={Theme.danger} /> KNOCKED
            </LegendItem>
            <LegendItem>
              <ColorSquare $color="transparent" /> ELIMINATED
            </LegendItem>
          </Legend>
        </Footer>
      </Frame>
    </Board>
  );
}
