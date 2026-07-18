import React from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectTheme } from "../../../Theme";
import LiveStandingsFont, {
  LIVE_STANDINGS_FONT_FAMILY,
} from "../../../LiveStandingsTable/View/LiveStandingsFont";

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

export type PlayerStatus = "alive" | "knocked" | "recalled" | "dead";

export interface PlayerData {
  status: PlayerStatus;
  hp?: number;
  hpPercent: number;
  isKnocked: boolean;
  hasRecalled: boolean;
}

export interface TeamData {
  id?: string | number;
  name: string;
  shortName?: string;
  logoUrl?: string;
  countryFlag?: string;
  countryUrl?: string;
  rank: number;
  playersAlive: number;
  is_eliminated?: boolean;
  isEliminated?: boolean;
  winRate?: string | number;
  win_rate?: string | number;
  players?: PlayerData[];
}

interface EndgameTopHUDProps {
  teams?: TeamData[];
}

/* ==========================================================================
   2. CONFIGURATION & THEME STYLES
   ========================================================================== */

const Theme = {
  purplePlateBg: "linear-gradient(135deg, var(--last4-body, var(--project-primary, #4d0cb5)) 0%, var(--last4-body-alt, var(--project-surface, #2f047a)) 100%)",
  blackLogoBg: "var(--last4-logo-bg, var(--project-background, #0d0d11))",
  orangeBadge: "var(--last4-badge, var(--project-warning, #ff6a00))",
  aliveYellow: "#ffd35a",
  alive: "var(--last4-health-alive, #ffd35a)",
  aliveBlue: "#2575fc",
  knocked: "var(--last4-health-knocked, var(--last4-danger, var(--project-danger, #FF0055)))",
  lowAlert: "var(--last4-health-low, var(--last4-danger, var(--project-danger, #FF2A6D)))",
  recalled: "var(--last4-health-recalled, #2575fc)",
  textDark: "var(--last4-text-dark, var(--project-background, #000000))",
  textLight: "var(--last4-text-light, var(--project-text-primary, #ffffff))",
  logoText: "var(--last4-logo-text, var(--project-text-primary, #ffffff))",
};

/* ==========================================================================
   3. STYLED HUD TOP GRID LAYOUT
   ========================================================================== */

const EndgameHUDContainer = styled.div`
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  transform-origin: top center;
  display: flex;
  gap: 28px;
  z-index: 9999;
  background: transparent;
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

const CardContainer = styled(motion.div)`
  position: relative;
  width: 272px;
  height: 108px;
  background: transparent;
  pointer-events: auto;
`;

const CardScale = styled.div`
  position: absolute;
  inset: 0;
  transform: scale(0.94);
  transform-origin: top center;
`;

// Main aggressive angled body shape
const MainSkelBody = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 82px;
  background: ${Theme.purplePlateBg};
  clip-path: polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%);
  border-top: 1.5px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.55);
`;

// Dark skewed box holding the team logo icon
const LogoShield = styled.div`
  position: absolute;
  top: 0;
  left: 4%;
  width: 78px;
  height: 82px;
  background: ${Theme.blackLogoBg};
  clip-path: polygon(12% 0%, 100% 0%, 82% 100%, 0% 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
`;

const TeamLogoImg = styled.img`
  width: 66px;
  height: 66px;
  object-fit: contain;
`;

const LogoFallback = styled.span`
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 13px;
  font-weight: 900;
  color: ${Theme.logoText};
  text-transform: uppercase;
`;

/* ==========================================================================
   4. TEXT LABELS & DATA NESTED TAGS
   ========================================================================== */

// Warning-colored tag beneath logo for country flag and short-name identifier
const LimeNameTag = styled.div`
  position: absolute;
  bottom: 6px;
  left: 2%;
  height: 25px;
  background: ${Theme.orangeBadge};
  clip-path: polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px 0 11px;
  z-index: 5;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.35);
`;

const FlagImg = styled.img`
  width: 18px;
  height: 12px;
  object-fit: cover;
  border-radius: 1px;
`;

const TeamShortText = styled.span`
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 13px;
  font-weight: 900;
  color: ${Theme.textDark};
  font-style: italic;
  text-transform: uppercase;
`;

// WR text alignment label
const WrLabel = styled.span`
  position: absolute;
  bottom: 11px;
  left: 110px;
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 13px;
  font-weight: 900;
  font-style: italic;
  color: ${Theme.textLight};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Orange win rate display block nested beneath right-hand section
const OrangeWrBadge = styled.div`
  position: absolute;
  bottom: 6px;
  left: 140px;
  width: 110px;
  height: 25px;
  background: ${Theme.orangeBadge};
  clip-path: polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.35);
`;

const WinRateText = styled.span`
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 14px;
  font-weight: 900;
  color: ${Theme.textDark};
  font-style: italic;
  letter-spacing: -0.2px;
`;

/* ==========================================================================
   5. BATTLE ROYALE HEALTH MONITOR
   ========================================================================== */

const HealthSystemRow = styled.div`
  position: absolute;
  top: 14px;
  right: 44px;
  display: flex;
  gap: 6px;
  z-index: 3;
  contain: layout paint style;
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const HPBlock = styled.div<{
  $isDead: boolean;
  $isLow: boolean;
  $isKnocked: boolean;
  $hasRecalled: boolean;
}>`
  width: 12px;
  height: 35px;
  position: relative;
  background: ${(props) => (props.$isDead ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.55)")};
  border: 1px solid ${(props) => {
    if (props.$isDead) return "rgba(255, 255, 255, 0.2)"; /* Slightly visible structural border frame for dead state */
    if (props.$isKnocked) return Theme.knocked;
    if (props.$isLow) return Theme.lowAlert;
    if (props.$hasRecalled) return Theme.aliveBlue;
    return "rgba(255, 255, 255, 0.35)";
  }};
  border-radius: 1px;
  overflow: hidden;
  
  ${props => props.$isLow && !props.$isDead && css`
    box-shadow: 0 0 10px rgba(var(--project-danger-rgb, 255, 42, 109), 0.75);
  `}
`;

const HealthFill = styled.div<{
  $percent: number;
  $status: PlayerStatus;
}>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${(props) => {
    if (props.$status === "alive" && props.$percent <= 25) return Theme.knocked;
    if (props.$status === "knocked") return Theme.knocked;
    if (props.$status === "recalled") return Theme.recalled;
    return Theme.alive;
  }};
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  transform: scaleY(${(props) => props.$percent / 100});
  transform-origin: bottom center;
  will-change: transform;
`;

/* ==========================================================================
   6. MASTER CONTROLLER LAYOUT MODULE
   ========================================================================== */

const EndgameTopHUD: React.FC<EndgameTopHUDProps> = ({ teams = [] }) => {
  const { broadcastSettings } = useProjectTheme();
  const style3Colors =
    broadcastSettings.selectedBroadcastStyle === "theme3"
      ? ({
          "--last4-body": broadcastSettings.liveStandings2Color1,
          "--last4-body-alt": broadcastSettings.liveStandings2Color1,
          "--last4-logo-bg": broadcastSettings.liveStandings2Color3,
          "--last4-badge": broadcastSettings.liveStandings2Color2,
          "--last4-danger": broadcastSettings.liveStandings2Color5,
          "--last4-text-dark": broadcastSettings.liveStandings2TextColor2,
          "--last4-text-light": broadcastSettings.liveStandings2TextColor1,
          "--last4-logo-text": broadcastSettings.liveStandings2TextColor3,
          "--last4-health-alive": "#24fe5b",
          "--last4-health-knocked": broadcastSettings.liveStandings2Color5,
          "--last4-health-low": broadcastSettings.liveStandings2Color5,
          "--last4-health-recalled": Theme.aliveBlue,
        } as React.CSSProperties)
      : undefined;

  // Once the match reaches the last-four phase, keep showing the survivors as they drop from 4 to 1.
  const activeTeams = [...teams]
    .filter(team => team.playersAlive > 0 && !team.is_eliminated && !team.isEliminated)
    .sort((a, b) => a.rank - b.rank);

  const activeTopFour = activeTeams.length > 0 && activeTeams.length <= 4 ? activeTeams : [];

  // Helper function to format the Win Rate string matching image reference spacing
  const formatWinRate = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === "") return "0 %";
    const numeric = Number(String(val).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(numeric)) return "0 %";
    return `${Math.round(numeric)} %`;
  };

  const toNumber = (value: unknown) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
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

  return (
    <EndgameHUDContainer style={style3Colors}>
      <LiveStandingsFont />
      <AnimatePresence mode="popLayout">
        {activeTopFour.map((team) => {
          
          const squadDataSlots = Array.from({ length: 4 }, (_, i) => {
            return team.players?.[i] || { status: "dead" as PlayerStatus, hpPercent: 0, isKnocked: false, hasRecalled: false };
          });

          return (
            <CardContainer
              key={team.id || team.name}
              layout
              layoutDependency={`${team.id || team.name}:${team.rank}`}
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ 
                opacity: 0, 
                y: -50, 
                scale: 0.8,
                transition: { duration: 0.2, ease: "easeInOut" }
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
            >
              <CardScale>
              {/* Core Trapezoidal Base Hull Component */}
              <MainSkelBody>
                
                {/* Embedded Skewed Shield Component for Team Badge Icons */}
                <LogoShield>
                  {team.logoUrl ? (
                    <TeamLogoImg src={team.logoUrl} alt="Icon" />
                  ) : (
                    <LogoFallback>LOGO</LogoFallback>
                  )}
                </LogoShield>

                {/* Plain Text Header Label Descriptor Elements */}
                <WrLabel>WR</WrLabel>

                {/* Embedded Esports 4-Squad Individual Teammate Monitor bars */}
                <HealthSystemRow>
                  {squadDataSlots.map((player, index) => {
                    const playerStatus = getPlayerStatus(player);
                    const hpPercent = getPlayerHpPercent(player);
                    const isDead = playerStatus === "dead";
                    const isKnocked = playerStatus === "knocked";
                    const hasRecalled = playerStatus === "recalled";
                    const isLow =
                      (playerStatus === "alive" || playerStatus === "recalled") &&
                      hpPercent > 0 &&
                      hpPercent < 30;

                    return (
                      <HPBlock
                        key={index}
                        $isDead={isDead}
                        $isLow={isLow}
                        $isKnocked={isKnocked}
                        $hasRecalled={hasRecalled}
                      >
                        {!isDead && (
                          <HealthFill
                            $percent={hpPercent}
                            $status={playerStatus}
                          />
                        )}
                      </HPBlock>
                    );
                  })}
                </HealthSystemRow>

              </MainSkelBody>

              {/* Sub-Badge One: Name Plate */}
              <LimeNameTag>
                <FlagImg 
                  src={team.countryFlag || team.countryUrl || "https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg"} 
                  alt="Flag" 
                />
                <TeamShortText>{team.shortName || team.name?.substring(0, 4)}</TeamShortText>
              </LimeNameTag>

              {/* Sub-Badge Two: Win Rate Tag with formatted string */}
              <OrangeWrBadge>
                <WinRateText>{formatWinRate(team.winRate ?? team.win_rate)}</WinRateText>
              </OrangeWrBadge>
              </CardScale>

            </CardContainer>
          );
        })}
      </AnimatePresence>
    </EndgameHUDContainer>
  );
};

export default EndgameTopHUD;
