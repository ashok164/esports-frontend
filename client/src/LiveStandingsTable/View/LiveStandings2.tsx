import React, { useEffect, useMemo, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { AnimatePresence, motion } from "framer-motion";

const ELIMINATION_BANNER_MS = 3200;

type PlayerStatus = "alive" | "knocked" | "dead";

interface Player {
  hpPercent?: number;
  isKnocked?: boolean;
  status?: PlayerStatus;
  hasRecalled?: boolean;
}

interface Team {
  id: string | number;
  rank: number;
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
  players?: Player[];
}

interface StandingsTableProps {
  teams?: Team[];
  maxRows?: number;
  position?: "left" | "right";
}

const Theme = {
  aliveYellow: "var(--project-accent, #ffd35a)",
  aliveBlue: "var(--project-secondary, #2575fc)",
  knocked: "var(--project-danger, #ff3158)",
  deadBg: "transparent",
  panel: "var(--project-surface, #071c13)",
  panel2: "var(--project-surface-alt, #0d2b1d)",
  rowA: "var(--project-surface, #111513)",
  rowB: "var(--project-surface-alt, #161b18)",
  rowDead: "rgba(var(--project-danger-rgb, 15, 18, 16), 0.14)",
  text: "var(--project-text-primary, #ffffff)",
  white: "var(--project-text-primary, #ffffff)",
  navy: "var(--project-secondary, #2575fc)",
  border: "rgba(var(--project-accent-rgb, 0,255,136),0.32)",
};

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(0,255,136,.24), 0 0 26px rgba(0,255,136,.10); }
  50% { box-shadow: 0 0 18px rgba(0,255,136,.42), 0 0 38px rgba(0,255,136,.18); }
`;

const pulseRed = keyframes`
  0%, 100% { opacity: .45; }
  50% { opacity: 1; }
`;

const Board = styled.div<{ $position: "left" | "right" }>`
  position: fixed;
  top: 50%;
  ${(p) => (p.$position === "left" ? "left: 36px;" : "right: 36px;")}
  transform: translateY(-50%);
  width: 580px; 
  font-family: "Rajdhani", "Teko", "Oswald", "Inter", sans-serif;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 18px 30px rgba(0,0,0,.45));
`;

const Frame = styled.div`
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, ${Theme.panel}, #03120b);
  border: 2px solid ${Theme.border};
  clip-path: polygon(0 0, 96% 0, 100% 4%, 100% 100%, 4% 100%, 0 96%);
  animation: ${glow} 2.8s infinite;
`;

// Unified matching grid system across header and data rows for perfect alignment
const HeaderRow = styled.div`
  height: 44px;
  display: grid;
  grid-template-columns: 55px 1fr 120px 72px 76px;
  align-items: center;
  background: linear-gradient(90deg, var(--project-background, #020907), var(--project-surface-alt, #0b2d1f) 50%, var(--project-background, #020907));
  color: ${Theme.white};
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.2px;
`;

const HeaderCell = styled.div<{ $center?: boolean; $last?: boolean }>`
  text-align: ${(p) => (p.$center ? "center" : "left")};
  padding: 0 4px;
  ${(p) => p.$last && css`padding-right: 14px; text-align: center;`}
`;

const Rows = styled.div``;

const Row = styled(motion.div)<{ $dead: boolean; $odd: boolean; $top: boolean }>`
  position: relative;
  height: 52px;
  display: grid;
  grid-template-columns: 55px 1fr 120px 72px 76px;
  align-items: center;
  overflow: hidden;
  background: ${(p) => (p.$odd ? Theme.rowB : Theme.rowA)};
  border-bottom: 1px solid rgba(3,18,11,.3);

  ${(p) =>
    p.$top &&
    css`
      background: linear-gradient(90deg, rgba(255,211,90,.12), transparent 45%),
        ${p.$odd ? Theme.rowB : Theme.rowA};
    `}

  ${(p) =>
    p.$dead &&
    css`
      background: ${Theme.rowDead};
      color: #5d6660;
      filter: grayscale(.8) brightness(.6);

      &::after {
        content: "";
        position: absolute;
        inset: 0;
        border-left: 5px solid ${Theme.knocked};
        animation: ${pulseRed} 1s infinite;
      }
    `}
`;

const RankCell = styled.div<{ $rank: number; $dead: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) =>
    p.$dead
      ? "#0a0f0c"
      : p.$rank === 1
      ? `linear-gradient(135deg, #ffd35a, #b87917)`
      : `linear-gradient(135deg, #1f2923, #0d120f)`};
  color: ${(p) => (p.$rank === 1 && !p.$dead ? "#181103" : Theme.white)};
  font-size: 22px;
  font-weight: 900;
  font-style: italic;
  text-shadow: ${(p) => (p.$rank === 1 && !p.$dead ? "none" : "0 2px 0 rgba(0,0,0,.4)")};
  clip-path: polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%);
`;

const TeamCell = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 8px;
  padding-right: 8px;
  gap: 12px; 
  min-width: 0;
`;

// Rectangle 1: Country container remains distinct with its metallic base
const CountryBox = styled.div`
  width: 54px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #505854 0%, #333a36 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const Country = styled.img`
  width: 28px;
  height: 18px;
  object-fit: cover;
`;

// Rectangle 2: Now transparent and free of any separating lines (|) or borders
const TeamBadgeBox = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  flex-grow: 1;
  min-width: 0;
  background: transparent;
  padding: 0;
`;

const LogoBox = styled.div`
  width: 28px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px; /* Smooth inline spacing before team tag */
`;

const Logo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

// Middle text system perfectly placed under the "TEAM" header
const TeamName = styled.div<{ $dead: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center; 
  text-align: center;
  height: 100%;
  flex-grow: 1;
  color: ${(p) => (p.$dead ? "#5d6660" : Theme.text)};
  font-size: 16px;
  font-weight: 900;
  letter-spacing: .8px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
  padding-top: 1px;
`;

const AliveBars = styled.div`
  display: flex;
  justify-content: center;
  gap: 5px;
  padding-right: 6px;
`;

const Bar = styled.div`
  position: relative;
  width: 10px;
  height: 28px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(0,0,0,.4);
  overflow: hidden;
`;

interface BarFillProps {
  $hp: number;
  $status: PlayerStatus | "empty";
}

const BarFill = styled.div<BarFillProps>`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: ${(p) => (p.$status === "empty" ? "0%" : `${p.$hp}%`)};
  background: ${(p) => {
    if (p.$status === "alive") return Theme.aliveYellow;
    if (p.$status === "knocked") return Theme.knocked;
    if (p.$status === "dead") return Theme.aliveBlue;
    return "transparent";
  }};
  box-shadow: ${(p) => (p.$status === "alive" || p.$status === "knocked" ? "0 0 6px rgba(255,255,255,0.15)" : "none")};
  transition: height 0.3s ease, background-color 0.2s ease;
`;

const NumberCell = styled.div<{ $main?: boolean; $last?: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$main ? "rgba(0,255,136,.04)" : "rgba(0,0,0,.15)")};
  border-left: 1px solid rgba(255,255,255,.05);
  color: ${(p) => (p.$main ? "#ffd35a" : "#a2b0a7")};
  font-size: ${(p) => (p.$main ? "20px" : "18px")};
  font-weight: 900;
  ${(p) => p.$last && css`padding-right: 14px;`} 
`;

const EliminatedBanner = styled(motion.div)`
  position: absolute;
  inset: 0 0 0 55px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, rgba(255,49,88,.98), rgba(96,7,24,.98));
  color: ${Theme.white};
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 5px;
  text-transform: uppercase;
  text-shadow: 0 2px 0 rgba(0,0,0,.3);
`;

const Footer = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  background: linear-gradient(90deg, #03120b, ${Theme.panel2}, #03120b);
  border-top: 1px solid rgba(0,255,136,.22);
`;

const Legend = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const SquareContainer = styled.div`
  display: flex;
  gap: 3px;
  align-items: center;
`;

const ColorSquare = styled.div<{ $color: string; $empty?: boolean }>`
  width: 12px;
  height: 12px;
  background: ${(p) => p.$color};
  border: 1px solid ${(p) => (p.$empty ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)")};
`;

const EmptyState = styled.div`
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,.68);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getTeamName(team: Team): string {
  return team.teamTag || team.shortName || team.tag || team.name || "TEAM";
}

function getPoints(team: Team): number {
  if (typeof team.totalPoints === "number") return team.totalPoints;
  return toNumber(team.rankingScore ?? team.placementPoints) + toNumber(team.kills);
}

function getPlayers(team: Team): Array<Player | null> {
  return Array.from({ length: 4 }, (_, index) => team.players?.[index] ?? null);
}

function getPlayerStatus(player: Player | null): PlayerStatus | "empty" {
  if (!player) return "empty";
  if (player.status === "dead" || player.hasRecalled) return "dead";
  if (player.status === "knocked" || player.isKnocked) return "knocked";
  return "alive";
}

function isTeamDead(team: Team): boolean {
  return Boolean(team.isEliminated) || toNumber(team.playersAlive) <= 0;
}

function formatRank(rank: number): string {
  return String(rank).padStart(2, "0");
}

function TimedEliminationNotice({ showWhenDead }: { showWhenDead: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!showWhenDead) {
      setShow(false);
      return;
    }

    setShow(true);
    const timer = window.setTimeout(() => setShow(false), ELIMINATION_BANNER_MS);
    return () => window.clearTimeout(timer);
  }, [showWhenDead]);

  return (
    <AnimatePresence>
      {show && (
        <EliminatedBanner
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "30%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 22 }}
        >
          Team Eliminated
        </EliminatedBanner>
      )}
    </AnimatePresence>
  );
}

export default function StandingsTable({
  teams = [],
  maxRows = 18,
  position = "right",
}: StandingsTableProps) {
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

  return (
    <Board $position={position}>
      <Frame>
        <HeaderRow>
          <HeaderCell $center>#</HeaderCell>
          <HeaderCell style={{ paddingLeft: "8px", textAlign: "center" }}>Team</HeaderCell>
          <HeaderCell $center>Alive</HeaderCell>
          <HeaderCell $center>Pts</HeaderCell>
          <HeaderCell $last>Elims</HeaderCell>
        </HeaderRow>

        <Rows>
          <AnimatePresence mode="popLayout">
            {sortedTeams.length === 0 ? (
              <EmptyState>No Teams Available</EmptyState>
            ) : (
              sortedTeams.map((team, index) => {
                const dead = isTeamDead(team);
                const players = getPlayers(team);

                return (
                  <Row
                    key={team.id}
                    $dead={dead}
                    $odd={index % 2 === 1}
                    $top={team.rank === 1}
                    layout
                    initial={{ opacity: 0, x: 22 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.28 }}
                  >
                    <TimedEliminationNotice showWhenDead={dead} />

                    <RankCell $rank={team.rank} $dead={dead}>
                      {formatRank(team.rank)}
                    </RankCell>

                    <TeamCell>
                      <CountryBox>
                        {team.countryUrl ? <Country src={team.countryUrl} alt="" /> : null}
                      </CountryBox>

                      <TeamBadgeBox>
                        <LogoBox>
                          {team.logoUrl ? <Logo src={team.logoUrl} alt="" /> : null}
                        </LogoBox>
                        <TeamName $dead={dead}>{getTeamName(team)}</TeamName>
                      </TeamBadgeBox>
                    </TeamCell>

                    <AliveBars>
                      {players.map((player, playerIndex) => {
                        const status = getPlayerStatus(player);
                        const hpValue = status === "dead" ? 100 : toNumber(player?.hpPercent ?? 100);
                        
                        return (
                          <Bar key={playerIndex}>
                            <BarFill 
                              $hp={hpValue} 
                              $status={status} 
                            />
                          </Bar>
                        );
                      })}
                    </AliveBars>

                    <NumberCell $main>{getPoints(team)}</NumberCell>
                    <NumberCell $last>{toNumber(team.kills)}</NumberCell>
                  </Row>
                );
              })
            )}
          </AnimatePresence>
        </Rows>

        <Footer>
          <Legend>
            <LegendItem>
              <SquareContainer>
                <ColorSquare $color={Theme.aliveYellow} />
                <ColorSquare $color={Theme.aliveBlue} />
              </SquareContainer>
              Alive
            </LegendItem>
            <LegendItem>
              <ColorSquare $color={Theme.knocked} /> Knocked
            </LegendItem>
            <LegendItem>
              <ColorSquare $color={Theme.deadBg} $empty /> Dead
            </LegendItem>
          </Legend>
        </Footer>
      </Frame>
    </Board>
  );
}
