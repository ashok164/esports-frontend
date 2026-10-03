import React from "react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import { PlayerData, PlayerStatus, TeamData } from "./LastFourTeam1";
import LiveStandingsFont, { GFF_LATIN_EXTRA_BOLD_FONT_FAMILY, LIVE_STANDINGS_FONT_FAMILY } from "../../../LiveStandingsTable/View/LiveStandingsFont";

const isTrue = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";
const hpOf = (player: PlayerData) => {
  const hp = Number(player.hpPercent ?? player.hp ?? 100);
  return Number.isFinite(hp) ? Math.max(0, Math.min(100, hp)) : 0;
};
const statusOf = (player: PlayerData): PlayerStatus => {
  if (player.status === "dead") return "dead";
  if (player.isKnocked || player.status === "knocked") return "knocked";
  if (hpOf(player) <= 0) return "dead";
  if (player.hasRecalled || player.status === "recalled") return "recalled";
  return "alive";
};
const winRateOf = (team: TeamData) => {
  const value = Number(String(team.winRate ?? team.win_rate ?? 0).replace(/[^0-9.]/g, ""));
  return `${Number.isFinite(value) ? Math.round(value) : 0}%`;
};
const teamHealthOf = (team: TeamData) => {
  if (!team.players?.length) {
    return Math.max(0, Math.min(4, Number(team.playersAlive) || 0)) * 25;
  }
  // Keep all four squad slots in the denominator; dead players contribute zero.
  return team.players.slice(0, 4).reduce((total, player) =>
    total + (statusOf(player) === "dead" ? 0 : hpOf(player)), 0) / 4;
};

const LastFourTeam4: React.FC<{ teams?: TeamData[] }> = ({ teams = [] }) => {
  const aliveTeams = teams.filter((team) => Number(team.playersAlive ?? 0) > 0 &&
    !isTrue(team.is_eliminated) && !isTrue(team.isEliminated)).sort((a, b) => a.rank - b.rank);
  const visibleTeams = aliveTeams.length <= 4 ? aliveTeams : [];

  return <Overlay aria-label="Last four teams, Style 4">
    <LiveStandingsFont />
    <AnimatePresence mode="popLayout">
      {visibleTeams.map((team, index) => <Card
        key={team.id ?? team.name}
        layout
        layoutDependency={`${team.id ?? team.name}:${team.rank}`}
        initial={{ opacity: 0, y: -220, x: -60, rotate: -8, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
        exit={{
          opacity: 0,
          y: -240,
          x: 100,
          rotate: 12,
          scale: 0.7,
          transition: { duration: 0.55, ease: [0.4, 0, 1, 1] },
        }}
        transition={{
          default: { type: "spring", stiffness: 130, damping: 19, delay: index * 0.1 },
          opacity: { duration: 0.3, delay: index * 0.1 },
          layout: { type: "spring", stiffness: 140, damping: 22 },
        }}
      >
        <MainBox>
        <TeamPanel>
            {team.logoUrl ? <Logo src={team.logoUrl} alt={team.name} /> :
              <LogoFallback>{(team.shortName || team.name || "T").slice(0, 2)}</LogoFallback>}
        </TeamPanel>
        <Body>
          <TeamName title={team.name}>{team.shortName || team.name}</TeamName>
        </Body>
          <HealthPanel aria-label={`${team.playersAlive} players alive`}>
            <PlayerBars>
            {Array.from({ length: 4 }, (_, index) => {
              const player = team.players?.[index];
              const fallbackAlive = !team.players?.length && index < Number(team.playersAlive);
              const status = player ? statusOf(player) : fallbackAlive ? "alive" : "dead";
              return <HealthBar key={index} $status={status}>
                <HealthFill $status={status} $hp={player ? hpOf(player) : fallbackAlive ? 100 : 0} />
              </HealthBar>;
            })}
            </PlayerBars>
          </HealthPanel>
          <PressureRow>
            <PressureLabel $visible={teamHealthOf(team) > 25 && teamHealthOf(team) < 100}>
              TEAM PRESSURE
            </PressureLabel>
            <SurvivalTrack
              role="progressbar"
              aria-label={`${team.shortName || team.name} combined team health`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={teamHealthOf(team)}
              aria-valuetext={`${Math.round(teamHealthOf(team))}% team health, ${team.playersAlive} of 4 players alive`}
            >
              <SurvivalFill $health={teamHealthOf(team)} />
            </SurvivalTrack>
          </PressureRow>
        </MainBox>
        <Footer><span>WIN RATE</span><WinRateValue>{winRateOf(team)}</WinRateValue></Footer>
      </Card>)}
    </AnimatePresence>
  </Overlay>;
};

export default LastFourTeam4;

const Overlay = styled.section`
  position: fixed;
  top: 30px;
  left: 50%;
  display: flex;
  justify-content: center;
  gap: 24px;
  width: 1352px;
  transform: translateX(-50%);
  transform-origin: top center;
  z-index: 9999;
  pointer-events: none;
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", "Arial Narrow", sans-serif;
  text-transform: uppercase;

  @media (min-width: 1920px) {
    top: 34px;
    transform: translateX(-50%) scale(1.35);
  }
  @media (min-width: 2560px) {
    top: 42px;
    transform: translateX(-50%) scale(1.72);
  }
  @media (max-width: 1390px) {
    width: calc(100vw - 32px);
    gap: 12px;
  }
`;

const Card = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 320px;
  min-width: 0;
  flex: 0 1 320px;
`;
const MainBox = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) 128px;
  height: 108px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px));
`;
const Body = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 8px 12px 28px;
  background: linear-gradient(90deg, #f3ba50 0%, #fff7a5 80%);
  color: #302100;
`;
const TeamPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 8px 6px;
  background: #241704;
  color: #ffe99b;
`;
const TeamName = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}", "Arial Black", sans-serif;
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: #302100;
`;
const Logo = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
`;
const LogoFallback = styled.span`
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border: 2px solid #ffe99b;
  border-radius: 50%;
  font-size: 18px;
  font-family: "${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}", "Arial Black", sans-serif;
  font-weight: 800;
`;
const HealthPanel = styled.div`
  box-sizing: border-box;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(90deg, #fff7a5, #f3ba50);
`;
const PlayerBars = styled.div`
  display: flex;
  gap: 6px;
`;
const PressureLabel = styled.span<{ $visible: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: max-content;
  max-width: calc(100% - 12px);
  height: 16px;
  padding: 0 7px;
  clip-path: polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px);
  visibility: ${({ $visible }) => $visible ? "visible" : "hidden"};
  background: linear-gradient(180deg, #38270c 0%, #211603 100%);
  box-shadow: inset 0 1px 0 rgba(255, 233, 155, 0.55), inset 0 -1px 0 rgba(255, 233, 155, 0.25);
  color: #fff3b0;
  font-family: "${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}", "Arial Black", sans-serif;
  font-size: 9px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.35px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  text-align: center;
  white-space: nowrap;
`;
const PressureRow = styled.div`
  position: absolute;
  left: 76px;
  right: 0;
  bottom: 6px;
  height: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  align-items: center;
  justify-items: center;
`;
const SurvivalTrack = styled.div`
  width: 106px;
  height: 6px;
  overflow: hidden;
  background: rgba(36, 23, 4, 0.3);
  border: 1px solid #241704;
`;
const SurvivalFill = styled.div<{ $health: number }>`
  height: 100%;
  width: ${({ $health }) => $health}%;
  background: ${({ $health }) => $health <= 25 ? "#e20c24" : $health < 100 ? "#f5b51b" : "#22c92c"};
  transition: width 280ms ease, background-color 280ms ease;
`;
const HealthBar = styled.span<{ $status: PlayerStatus }>`
  position: relative;
  width: 22px;
  height: 76px;
  overflow: hidden;
  background: rgba(36, 23, 4, 0.25);
  border: 1px solid #241704;
`;
const HealthFill = styled.span<{ $status: PlayerStatus; $hp: number }>`
  position: absolute;
  inset: 0;
  background: ${({ $status }) => $status === "knocked" ? "#e20c24" : $status === "recalled" ? "#2575fc" : "#22c92c"};
  transform: scaleY(${({ $status, $hp }) => $status === "dead" ? 0 : $hp / 100});
  transform-origin: bottom;
  transition: transform 280ms ease;
`;
const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
  min-width: 164px;
  padding: 0 14px;
  gap: 10px;
  height: 36px;
  background: linear-gradient(90deg, #f3ba50 0%, #fff7a5 80%);
  color: #302100;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  span {
    letter-spacing: 0.6px;
    white-space: nowrap;
  }
  font-variant-numeric: tabular-nums;
`;
const WinRateValue = styled.span`
  padding-left: 10px;
  border-left: 2px solid rgba(48, 33, 0, 0.45);
  color: #241704 !important;
  -webkit-text-fill-color: #241704;
  font-family: "${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}", "Arial Black", sans-serif;
  font-size: 22px;
  font-weight: 800;
`;
