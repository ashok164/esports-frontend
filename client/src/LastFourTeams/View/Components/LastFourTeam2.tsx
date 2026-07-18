import React from "react";
import styled, { css } from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import { useProjectTheme } from "../../../Theme";
import { PlayerData, PlayerStatus, TeamData } from "./LastFourTeam1";
import LiveStandingsFont, {
  LIVE_STANDINGS_FONT_FAMILY,
} from "../../../LiveStandingsTable/View/LiveStandingsFont";

const CARD_WIDTH = 230;
const CARD_HEIGHT = 78;
const LOGO_WIDTH = 64;
const FOOTER_HEIGHT = 27;
const RECALLED_BLUE = "#2575fc";

const withOpacity = (color: string, opacity: number) => {
  const normalized = color.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return color;

  const value = Number.parseInt(normalized, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
};

const formatWinRate = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === "") return "0%";
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return "0%";
  return `${Math.round(numeric)}%`;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPlayerHpPercent = (player: PlayerData) =>
  Math.max(0, Math.min(100, toNumber(player.hpPercent ?? player.hp ?? 100)));

const getPlayerStatus = (player: PlayerData): PlayerStatus => {
  if (getPlayerHpPercent(player) <= 0) return "dead";
  if (player.hasRecalled) return "recalled";
  if (player.status === "dead") return "dead";
  if (player.status === "knocked" || player.isKnocked) return "knocked";
  return "alive";
};

const LastFourTeam2: React.FC<{ teams?: TeamData[] }> = ({ teams = [] }) => {
  const { broadcastSettings } = useProjectTheme();

  const activeTeams = [...teams]
    .filter((team) => Number(team.playersAlive ?? 0) > 0 && !team.is_eliminated && !team.isEliminated)
    .sort((left, right) => left.rank - right.rank);

  const activeTopFour = activeTeams.length > 0 && activeTeams.length <= 4 ? activeTeams : [];

  const colors = {
    base: broadcastSettings.liveStandings2Color1,
    bar: broadcastSettings.liveStandings2Color2,
    logo: broadcastSettings.liveStandings2Color5,
    dark: broadcastSettings.liveStandings2Color4,
    accent: broadcastSettings.liveStandings2Color5,
    alive: "#24fe5b",
    recalled: RECALLED_BLUE,
    text: broadcastSettings.liveStandings2TextColor4,
    textDark: broadcastSettings.liveStandings2TextColor2,
  };

  return (
    <Overlay>
      <LiveStandingsFont />
      <AnimatePresence mode="popLayout">
        {activeTopFour.map((team) => {
          const players = Array.from({ length: 4 }, (_, index) => {
            return team.players?.[index] || { status: "dead" as PlayerStatus, hpPercent: 0, isKnocked: false, hasRecalled: false };
          });

          return (
            <Card
              key={team.id || team.name}
              layout
              layoutDependency={`${team.id || team.name}:${team.rank}`}
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -50,
                scale: 0.82,
                transition: { duration: 0.2, ease: "easeInOut" },
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
            >
              <Body $base={colors.base} $dark={colors.dark}>
                <LogoPanel $logo={colors.logo}>
                  {team.logoUrl ? <Logo src={team.logoUrl} alt={team.name} /> : <LogoFallback>LOGO</LogoFallback>}
                </LogoPanel>

                <HealthZone $base={colors.base}>
                  <HealthBars>
                    {players.map((player, index) => {
                      const status = getPlayerStatus(player);
                      const percent = getPlayerHpPercent(player);
                      const isDead = status === "dead";
                      const isKnocked = status === "knocked";
                      const hasRecalled = status === "recalled";
                      const isLow = (status === "alive" || status === "recalled") && percent > 0 && percent < 30;

                      return (
                        <HealthBar
                          key={index}
                          $isDead={isDead}
                          $isKnocked={isKnocked}
                          $isLow={isLow}
                          $hasRecalled={hasRecalled}
                          $dark={colors.dark}
                          $accent={colors.accent}
                        >
                          <HealthFill
                            $percent={percent}
                            $status={status}
                            $accent={colors.accent}
                            $alive={colors.alive}
                            $recalled={colors.recalled}
                          />
                        </HealthBar>
                      );
                    })}
                  </HealthBars>
                </HealthZone>
              </Body>

              <Footer $bar={colors.bar} $text={colors.textDark}>
                <FooterText>{`WIN RATE - ${formatWinRate(team.winRate ?? team.win_rate)}`}</FooterText>
              </Footer>
            </Card>
          );
        })}
      </AnimatePresence>
    </Overlay>
  );
};

export default LastFourTeam2;

const Overlay = styled.div`
  position: fixed;
  top: 24px;
  left: 50%;
  display: flex;
  gap: 26px;
  transform: translateX(-50%);
  transform-origin: top center;
  z-index: 9999;
  pointer-events: none;

  @media (min-width: 1920px) {
    top: 34px;
    transform: translateX(-50%) scale(1.35);
  }

  @media (min-width: 2560px) {
    top: 42px;
    transform: translateX(-50%) scale(1.72);
  }
`;

const Card = styled(motion.div)`
  position: relative;
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT + FOOTER_HEIGHT}px;
  pointer-events: auto;
`;

const Body = styled.div<{ $base: string; $dark: string }>`
  position: relative;
  display: grid;
  grid-template-columns: ${LOGO_WIDTH}px 1fr;
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  overflow: hidden;
  background: ${({ $base }) => $base};
`;

const LogoPanel = styled.div<{ $logo: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $logo }) => $logo};
`;

const Logo = styled.img`
  width: 58px;
  height: 58px;
  object-fit: contain;
  filter: none;
`;

const LogoFallback = styled.span`
  color: #ffffff;
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const HealthZone = styled.div<{ $base: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $base }) => $base};
`;

const HealthBars = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  contain: layout paint style;
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const HealthBar = styled.i<{
  $isDead: boolean;
  $isKnocked: boolean;
  $isLow: boolean;
  $hasRecalled: boolean;
  $dark: string;
  $accent: string;
}>`
  position: relative;
  width: 11px;
  height: 34px;
  overflow: hidden;
  background: ${({ $isDead, $dark }) => ($isDead ? "#ffffff" : withOpacity($dark, 0.4))};
  border: 1px solid
    ${({ $isDead, $isKnocked, $isLow, $hasRecalled, $accent }) => {
      if ($isDead) return "rgba(255,255,255,0.28)";
      if ($isKnocked) return $accent;
      if ($isLow) return "#ffd54a";
      if ($hasRecalled) return RECALLED_BLUE;
      return "rgba(255,255,255,0.18)";
    }};

  ${({ $isLow, $isDead }) =>
    $isLow &&
    !$isDead &&
    css`
      box-shadow: 0 0 8px rgba(255, 213, 74, 0.35);
    `}
`;

const HealthFill = styled.span<{
  $percent: number;
  $status: PlayerStatus;
  $accent: string;
  $alive: string;
  $recalled: string;
}>`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: ${({ $status, $accent, $alive, $recalled }) => {
    if ($status === "knocked") return $accent;
    if ($status === "recalled") return $recalled;
    return $alive;
  }};
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  transform: scaleY(${({ $status, $percent }) => ($status === "dead" ? 0 : $percent / 100)});
  transform-origin: bottom center;
  will-change: transform;
`;

const Footer = styled.div<{ $bar: string; $text: string }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${FOOTER_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04) 72%, transparent 100%),
    ${({ $bar }) => $bar};
  color: ${({ $text }) => $text};
`;

const FooterText = styled.span`
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-shadow: none;
  line-height: 1;
  transform: skewX(-8deg);
`;
