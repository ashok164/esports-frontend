import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import LiveStandingsFont, { LIVE_STANDINGS_FONT_FAMILY } from "./LiveStandingsFont";

type Player = {
  hp?: number;
  hpPercent?: number;
  isKnocked?: boolean;
  isAlive?: boolean;
  status?: "alive" | "knocked" | "recalled" | "dead";
  hasRecalled?: boolean;
};

type Team = {
  id: string | number;
  name: string;
  teamTag?: string;
  shortName?: string;
  tag?: string;
  logoUrl?: string;
  kills?: number;
  totalPoints?: number;
  rankingScore?: number;
  placementPoints?: number;
  playersAlive?: number;
  isEliminated?: boolean;
  is_eliminated?: boolean;
  isCrowned?: boolean;
  is_crowned?: boolean;
  players?: Player[];
};

const numberOf = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pointsOf = (team: Team) => team.totalPoints != null
  ? numberOf(team.totalPoints)
  : numberOf(team.rankingScore ?? team.placementPoints) + numberOf(team.kills);

const playerState = (player?: Player): "alive" | "knocked" | "dead" => {
  const hp = Math.max(0, Math.min(100, numberOf(player?.hpPercent ?? player?.hp ?? 100)));
  if (!player || hp <= 0 || player.isAlive === false || player.status === "dead") return "dead";
  if (player.isKnocked || player.status === "knocked") return "knocked";
  return "alive";
};

const EliminationRow: React.FC<React.PropsWithChildren<{ eliminated: boolean; crowned: boolean; index: number }>> = ({ eliminated, crowned, index, children }) => {
  const entranceIndex = useRef(index);
  const [hasEntered, setHasEntered] = useState(false);
  const wasEliminated = useRef(eliminated);
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    if (eliminated && !wasEliminated.current) setShowBanner(true);
    if (!eliminated) setShowBanner(false);
    wasEliminated.current = eliminated;
  }, [eliminated]);
  return <CrownedRow
    $index={entranceIndex.current}
    style={hasEntered ? { animation: "none" } : undefined}
    onAnimationEnd={(event) => {
      if (event.target === event.currentTarget) setHasEntered(true);
    }}
  >
    {crowned && <CrownIcon src="/images/crown.png" alt="Champion Rush crown" />}
    <RowShell $index={entranceIndex.current}>
    {children}
    {showBanner && <EliminationBanner onAnimationEnd={() => setShowBanner(false)}>
      ELIMINATED
    </EliminationBanner>}
  </RowShell>
  </CrownedRow>;
};

const LiveStandings4: React.FC<{ teams?: Team[]; preview?: boolean }> = ({ teams = [], preview = false }) => {
  const [footerHasEntered, setFooterHasEntered] = useState(false);
  const entranceRowCount = useRef<number | null>(null);
  const [previewEliminated, setPreviewEliminated] = useState(false);
  useEffect(() => {
    if (!preview || !previewEliminated) return;
    const timer = window.setTimeout(() => setPreviewEliminated(false), 3500);
    return () => window.clearTimeout(timer);
  }, [preview, previewEliminated]);
  const previewThreeDigitPoints = preview && new URLSearchParams(window.location.search).get("pointsDigits") === "3";
  const previewTeams: Team[] = ["JE", "HORAA", "CME", "HC", "TRE", "S9X", "BB", "VS", "UN", "GR", "MBXNF", "BG"].map((name, index) => ({
    id: index, name, kills: 0, totalPoints: previewThreeDigitPoints ? 999 - index * 73 : 0,
    isEliminated: index === 0 && previewEliminated,
    players: Array.from({ length: 4 }, () => ({ hp: index === 0 && previewEliminated ? 0 : 100 })),
  }));
  const rankedTeams = useMemo(
    () => [...teams].sort((left, right) => pointsOf(right) - pointsOf(left) || numberOf(right.kills) - numberOf(left.kills)).slice(0, 12),
    [teams],
  );
  const displayedTeams = preview ? previewTeams : rankedTeams;
  if (entranceRowCount.current === null && displayedTeams.length > 0) {
    entranceRowCount.current = displayedTeams.length;
  }

  return (
    <>
      <LiveStandingsFont />
      {preview && <PreviewButton onClick={() => setPreviewEliminated(true)} disabled={previewEliminated}>Replay elimination</PreviewButton>}
      <Board aria-label="Live standings, Style 4">
        <Header aria-hidden="true" />
        <Rows>
          {displayedTeams.map((team, index) => {
            const players = (team.players || []).slice(0, 4);
            const eliminated = Boolean(team.isEliminated || team.is_eliminated) ||
              (team.playersAlive != null && numberOf(team.playersAlive) <= 0) ||
              (players.length > 0 && players.every((player) => playerState(player) === "dead"));
            return (
              <EliminationRow key={team.id} eliminated={eliminated} crowned={Boolean(team.isCrowned ?? team.is_crowned)} index={index}>
              <TeamRow $first={index === 0} $eliminated={eliminated} $crowned={Boolean(team.isCrowned ?? team.is_crowned)}>
                <Rank>{index + 1}</Rank>
                <TeamCell>
                  {team.logoUrl ? <TeamLogo src={team.logoUrl} alt="" /> : <LogoFallback>{(team.teamTag || team.name || "T").slice(0, 2)}</LogoFallback>}
                  <TeamName>{team.teamTag || team.shortName || team.tag || team.name}</TeamName>
                </TeamCell>
                <HealthCell aria-label={`${players.filter((player) => playerState(player) === "alive").length} players alive`}>
                  {[0, 1, 2, 3].map((playerIndex) => {
                    const player = players[playerIndex];
                    const state = playerState(player);
                    const hp = Math.max(0, Math.min(100, numberOf(player?.hpPercent ?? player?.hp ?? 100)));
                    return <HealthBar key={playerIndex} $state={state} $hp={hp} />;
                  })}
                </HealthCell>
                <Points>{pointsOf(team)}</Points>
                <Elims>{numberOf(team.kills)}</Elims>
              </TeamRow>
              </EliminationRow>
            );
          })}
        </Rows>
        <Footer
          aria-hidden="true"
          $rowCount={entranceRowCount.current ?? 0}
          style={footerHasEntered ? { animation: "none" } : undefined}
          onAnimationEnd={() => setFooterHasEntered(true)}
        />
      </Board>
    </>
  );
};

export default LiveStandings4;

const crownedRowPulse = keyframes`
  0% { transform: translateX(0) skewX(-18deg); opacity: 0; }
  18% { opacity: 0.95; }
  52% { opacity: 0.7; }
  100% { transform: translateX(215%) skewX(-18deg); opacity: 0; }
`;

const booyahNeededSweep = keyframes`
  0%, 84% {
    transform: translateX(0);
    opacity: 0;
  }
  86% {
    opacity: 1;
  }
  94% {
    opacity: 1;
  }
  100% {
    transform: translateX(51%);
    opacity: 0;
  }
`;

const eliminationSlide = keyframes`
  0% { transform: translateX(105%); }
  20%, 75% { transform: translateX(0); }
  100% { transform: translateX(-105%); }
`;

const tableFlyIn = keyframes`
  0% { opacity: 0; transform: translate3d(110%, 0, 0) scaleX(0.96); }
  45% { opacity: 1; }
  78% { opacity: 1; transform: translate3d(-4px, 0, 0) scaleX(1); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scaleX(1); }
`;

const arrivalSweep = keyframes`
  0% { opacity: 0; transform: translateX(-140%) skewX(-18deg); }
  20% { opacity: 0.65; }
  75% { opacity: 0.25; }
  100% { opacity: 0; transform: translateX(420%) skewX(-18deg); }
`;

const headerReveal = keyframes`
  0% { opacity: 0; transform: translate3d(0, -28px, 0) scale(0.96); clip-path: inset(0 0 0 100%); }
  65% { opacity: 1; transform: translate3d(0, 3px, 0) scale(1); clip-path: inset(0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); clip-path: inset(0); }
`;

const footerReveal = keyframes`
  0% { opacity: 0; transform: translate3d(0, 18px, 0); clip-path: inset(0 50%); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); clip-path: inset(0); }
`;

const CrownedRow = styled.div<{ $index: number }>`
  position: relative;
  transform-origin: right center;
  animation: ${tableFlyIn} 720ms cubic-bezier(0.16, 1, 0.3, 1)
    ${({ $index }) => 180 + $index * 65}ms both;
`;

const CrownIcon = styled.img`
  position: absolute;
  left: -60px;
  top: 50%;
  width: 50px;
  height: 50px;
  box-sizing: border-box;
  padding: 5px;
  background: linear-gradient(180deg, #8b5e3c 0%, #5c3822 50%, #2f1b10 100%);
  border: 1px solid #f5c84f;
  border-radius: 6px;
  box-shadow: 0 0 12px rgba(255, 211, 90, 0.35);
  object-fit: contain;
  transform: translateY(-50%);
  z-index: 40;
  pointer-events: none;
`;

const RowShell = styled.div<{ $index: number }>`
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 36%;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(255, 219, 125, 0.5), transparent);
    animation: ${arrivalSweep} 650ms ease-out
      ${({ $index }) => 500 + $index * 65}ms both;
  }
`;

const EliminationBanner = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(90deg, #720a0a, #dc2020, #720a0a);
  color: #fff;
  font-size: 26px;
  font-weight: 900;
  -webkit-text-stroke: 1px currentColor;
  letter-spacing: 2px;
  animation: ${eliminationSlide} 2400ms cubic-bezier(0.4, 0, 0.2, 1) both;
`;

const PreviewButton = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  padding: 12px 20px;
  cursor: pointer;
`;

const Board = styled.section`
  position: fixed;
  z-index: 999;
  top: 50%;
  right: 28px;
  width: min(396px, calc(100vw - 32px));
  transform: translateY(-50%);
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", "Arial Narrow", sans-serif;
  text-transform: uppercase;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.24));

  @media (max-width: 600px) {
    right: 8px;
    width: min(360px, calc(100vw - 16px));
  }
`;

const Header = styled.div`
  width: 100%;
  aspect-ratio: 9.18 / 1;
  background: url("/theme4/livestandings/header.png") center / 100% 100% no-repeat;
  animation: ${headerReveal} 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

const TeamRow = styled.div<{ $first: boolean; $eliminated: boolean; $crowned: boolean }>`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 82px 62px 62px;
  min-height: 50px;
  border-bottom: 2px dashed rgba(60, 60, 60, 0.3);
  background: #ffffff;
  opacity: ${({ $eliminated }) => ($eliminated ? 0.45 : 1)};
  transition: opacity 300ms ease;
  ${({ $crowned }) =>
    $crowned &&
    css`
      position: relative;
      box-shadow:
        inset 3px 0 0 rgba(255, 211, 90, 0.88),
        0 10px 24px rgba(0, 0, 0, 0.32),
        0 0 22px rgba(255, 211, 90, 0.28);
      z-index: 35;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 48%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 211, 90, 0.12),
          rgba(255, 255, 255, 0.34),
          rgba(255, 211, 90, 0.18),
          transparent
        );
        mix-blend-mode: screen;
        pointer-events: none;
        z-index: 18;
        animation: ${crownedRowPulse} 2.2s ease-in-out infinite;
      }

      &::before {
        content: "BOOYAH RACE";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
          90deg,
          rgba(5, 5, 5, 0),
          rgba(5, 5, 5, 0.96) 18%,
          #242018 50%,
          rgba(5, 5, 5, 0.96) 82%,
          rgba(5, 5, 5, 0)
        );
        box-shadow: inset 0 2px 0 #f5c84f, inset 0 -2px 0 #d59b25;
        color: #fff1a8;
        font-size: 22px;
        font-weight: 1000;
        letter-spacing: 1.8px;
        text-shadow:
          0 2px 5px rgba(0, 0, 0, 0.76),
          0 0 12px rgba(245, 200, 79, 0.34);
        pointer-events: none;
        z-index: 19;
        animation: ${booyahNeededSweep} 30s ease-in-out infinite;
      }
    `}


  @media (max-width: 600px) {
    grid-template-columns: 40px minmax(0, 1fr) 72px 54px 56px;
    min-height: 46px;
  }

  & > :nth-child(n + 3) {
    background: #050505;
    color: #fff;
    border-left: 1px solid rgba(255, 255, 255, 0.16);
  }

  & > :nth-child(4) {
    color: #fff;
  }

  ${({ $first }) => $first && `
    & > :first-child {
      background: linear-gradient(180deg, #fff1a8 0%, #f5c84f 48%, #d59b25 100%);
    }
  `}
`;

const Rank = styled.div`
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #fff1a8 0%, #f5c84f 48%, #d59b25 100%);
  color: #090909;
  font-size: 24px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
`;

const TeamCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 8px;
  color: #090909;
`;

const TeamLogo = styled.img`
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  object-fit: contain;
`;

const LogoFallback = styled.span`
  display: grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 2px solid #191919;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 900;
`;

const TeamName = styled.span`
  overflow: hidden;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HealthCell = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 6px;
  padding: 3px 7px;
`;

const HealthBar = styled.span<{ $state: "alive" | "knocked" | "dead"; $hp: number }>`
  position: relative;
  display: block;
  width: 10px;
  height: 100%;
  min-height: 40px;
  background: #777366;

  &::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: ${({ $state, $hp }) => ($state === "dead" ? 0 : `${$hp}%`)};
    background: ${({ $state }) => ($state === "knocked" ? "#e20c24" : "#22c92c")};
    content: "";
  }
`;

const Points = styled.div`
  display: grid;
  place-items: center;
  font-size: 26px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
`;

const Elims = styled(Points)`
  font-size: 27px;
`;

const Footer = styled.div<{ $rowCount: number }>`
  width: 100%;
  aspect-ratio: 9.18 / 1;
  background: url("/theme4/livestandings/footer.png") center / 100% 100% no-repeat;
  animation: ${footerReveal} 450ms cubic-bezier(0.22, 1, 0.36, 1)
    ${({ $rowCount }) => 450 + $rowCount * 65}ms both;
`;
