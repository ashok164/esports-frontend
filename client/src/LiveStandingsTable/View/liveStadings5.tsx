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
};

const pulseRed = keyframes`
  0%, 100% { opacity: .45; }
  50% { opacity: 1; }
`;

const Board = styled.div`
  position: fixed;
  top: 50%;
  right: 36px;
  transform: translateY(-50%);
  width: 580px; /* Kept strictly at 580px */
  font-family: "Rajdhani", "Teko", "Oswald", "Inter", sans-serif;
  pointer-events: auto;
  user-select: none;
  z-index: 999;

  filter: drop-shadow(0 25px 35px rgba(0, 0, 0, 0.65))
    drop-shadow(0 10px 10px rgba(0, 0, 0, 0.4));
`;

const Frame = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, ${Theme.panel}, #03120b);
  border-radius: 8px;
`;

const GRID_LAYOUT = css`
  display: grid;
  /* Rebalanced tracks: Expanded logos from 54px to 68px, team text column scales down to absorb it */
  grid-template-columns: 58px 68px 68px 1fr 110px 64px 68px;
  align-items: center;
`;

const HeaderRow = styled.div`
  height: 44px;
  ${GRID_LAYOUT}
  background: linear-gradient(
    90deg,
    var(--project-background, #020907),
    var(--project-surface-alt, #0b2d1f) 50%,
    var(--project-background, #020907)
  );
  color: ${Theme.white};
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  flex-shrink: 0;
`;

const HeaderCell = styled.div<{ $center?: boolean; $last?: boolean }>`
  text-align: ${(p) => (p.$center ? "center" : "left")};
  padding: 0 4px;

  ${(p) =>
    p.$last &&
    css`
      padding-right: 14px;
      text-align: center;
    `}
`;

const Rows = styled.div``;

const Row = styled(motion.div)<{
  $dead: boolean;
  $odd: boolean;
  $top: boolean;
}>`
  position: relative;
  height: 64px;
  ${GRID_LAYOUT}
  background: ${(p) => (p.$odd ? Theme.rowB : Theme.rowA)};
  border-bottom: 1px solid rgba(3, 18, 11, 0.25);

  ${(p) =>
    p.$top &&
    css`
      background:
        linear-gradient(90deg, rgba(255, 211, 90, 0.12), transparent 45%),
        ${p.$odd ? Theme.rowB : Theme.rowA};
    `}

  ${(p) =>
    p.$dead &&
    css`
      background: ${Theme.rowDead};
      color: #5d6660;
      filter: grayscale(0.8) brightness(0.6);

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
  padding-right: 8px;
  z-index: 3;
  clip-path: polygon(0% 0%, 78% 0%, 100% 50%, 78% 100%, 0% 100%);

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
  text-shadow: ${(p) =>
    p.$rank === 1 && !p.$dead ? "none" : "0 2px 0 rgba(0,0,0,.4)"};
`;

const CountryDataCell = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  background: rgba(11, 56, 21, 0.45);
  border-right: 1px solid rgba(255, 255, 255, 0.02);
`;

const VisualDataCell = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 8px; /* Keeps a solid, proportional gap relative to the bigger items */
  background: rgba(0, 0, 0, 0.15);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
`;

const CountryBox = styled.div`
  width: 44px; /* Scaled up from 38px */
  height: 28px; /* Scaled up from 24px */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 8px rgba(0, 0, 0, 0.32);
  overflow: hidden;
`;

const Country = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LogoBox = styled.div`
  width: 42px; /* Scaled up from 36px */
  height: 30px; /* Scaled up from 36px */
  display: flex;
  margin-left: 5px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 5px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 8px rgba(0, 0, 0, 0.35);
  overflow: hidden;
`;

const Logo = styled.img`
  width: 150%;
  height: 150%;
  object-fit: contain;
`;

const TeamIdentityCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 0 6px; /* Slightly tightened safety padding */
  min-width: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
`;

const TeamTagText = styled.div<{ $dead: boolean }>`
  color: ${(p) => (p.$dead ? "#5d6660" : "#ffd35a")};
  font-size: 18px; /* Tiny step down to fit comfortably in a narrower space */
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  line-height: 1;
`;

const AliveBarsCell = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
`;

const AliveBars = styled.div`
  display: flex;
  justify-content: center;
  gap: 4px;
`;

const Bar = styled.div`
  position: relative;
  width: 9px;
  height: 34px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.4);
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
  box-shadow: ${(p) =>
    p.$status === "alive" || p.$status === "knocked"
      ? "0 0 6px rgba(255,255,255,0.15)"
      : "none"};
  transition:
    height 0.3s ease,
    background-color 0.2s ease;
`;

const NumberCell = styled.div<{ $last?: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  color: #ffd35a;
  font-size: 18px;
  font-weight: 900;

  ${(p) =>
    p.$last &&
    css`
      padding-right: 14px;
      color: #a2b0a7;
      font-size: 18px;
    `}
`;

const EliminatedBanner = styled(motion.div)`
  position: absolute;
  inset: 0 0 0 58px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    90deg,
    rgba(255, 49, 88, 0.98),
    rgba(96, 7, 24, 0.98)
  );
  color: ${Theme.white};
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 5px;
  text-transform: uppercase;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
`;

const Footer = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  background: linear-gradient(90deg, #03120b, ${Theme.panel2}, #03120b);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
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
  border: 1px solid
    ${(p) => (p.$empty ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)")};
`;

const EmptyState = styled.div`
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.68);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getTeamTag(team: Team): string {
  return team.teamTag || team.shortName || team.tag || "TEAM";
}

function getPoints(team: Team): number {
  if (typeof team.totalPoints === "number") return team.totalPoints;
  return (
    toNumber(team.rankingScore ?? team.placementPoints) + toNumber(team.kills)
  );
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
    const timer = window.setTimeout(
      () => setShow(false),
      ELIMINATION_BANNER_MS,
    );
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
  maxRows = 12,
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
    <Board>
      <Frame>
        <HeaderRow>
          <HeaderCell $center>#</HeaderCell>
          <HeaderCell />
          <HeaderCell />
          <HeaderCell $center>Team</HeaderCell>
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
                const tagValue = getTeamTag(team);

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

                    <CountryDataCell>
                      <CountryBox>
                        {team.countryUrl ? (
                          <Country src={team.countryUrl} alt="Country flag" />
                        ) : null}
                      </CountryBox>
                    </CountryDataCell>

                    <VisualDataCell>
                      <LogoBox>
                        {team.logoUrl ? (
                          <Logo src={team.logoUrl} alt="" />
                        ) : null}
                      </LogoBox>
                    </VisualDataCell>

                    <TeamIdentityCell>
                      <TeamTagText $dead={dead}>{tagValue}</TeamTagText>
                    </TeamIdentityCell>

                    <AliveBarsCell>
                      <AliveBars>
                        {players.map((player, playerIndex) => {
                          const status = getPlayerStatus(player);
                          const hpValue =
                            status === "dead"
                              ? 100
                              : toNumber(player?.hpPercent ?? 100);

                          return (
                            <Bar key={playerIndex}>
                              <BarFill $hp={hpValue} $status={status} />
                            </Bar>
                          );
                        })}
                      </AliveBars>
                    </AliveBarsCell>

                    <NumberCell>{getPoints(team)}</NumberCell>
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
