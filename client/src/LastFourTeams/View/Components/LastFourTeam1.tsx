import React from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

export type PlayerStatus = "alive" | "knocked" | "recalled" | "dead";

export interface PlayerData {
  status: PlayerStatus;
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
   1. KEYFRAME ANIMATIONS (Low HP Flash & Glow)
   ========================================================================== */

const lowHpFlicker = keyframes`
  0%, 100% { box-shadow: 0 0 4px rgba(var(--project-danger-rgb, 255, 42, 109), 0.4); filter: brightness(0.9); }
  50% { box-shadow: 0 0 14px rgba(var(--project-danger-rgb, 255, 42, 109), 0.95); filter: brightness(1.2); }
`;

/* ==========================================================================
   2. CONFIGURATION & THEME STYLES
   ========================================================================== */

const Theme = {
  purplePlateBg: "linear-gradient(135deg, var(--project-primary, #4d0cb5) 0%, var(--project-surface, #2f047a) 100%)",
  blackLogoBg: "var(--project-background, #0d0d11)",
  limeBadge: "var(--project-accent, #bfff00)",
  orangeBadge: "var(--project-warning, #ff6a00)",
  aliveYellow: "#ffd35a",
  aliveBlue: "#2575fc",
  knocked: "var(--project-danger, #FF0055)",
  lowAlert: "var(--project-danger, #FF2A6D)",
  textDark: "var(--project-background, #000000)",
  textLight: "var(--project-text-primary, #ffffff)",
};

/* ==========================================================================
   3. STYLED HUD TOP GRID LAYOUT
   ========================================================================== */

const EndgameHUDContainer = styled.div`
  position: fixed;
  top: 30px; 
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  z-index: 9999;
  background: transparent;
  pointer-events: none;
`;

const CardContainer = styled(motion.div)`
  position: relative;
  width: 250px; /* Slightly scaled up width footprint */
  height: 98px; /* Balanced height scale */
  background: transparent;
  pointer-events: auto;
`;

// Main aggressive angled body shape
const MainSkelBody = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 74px; /* Increased track space height */
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
  width: 70px; /* Enhanced badge window wrapper width */
  height: 74px;
  background: ${Theme.blackLogoBg};
  clip-path: polygon(12% 0%, 100% 0%, 82% 100%, 0% 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
`;

const TeamLogoImg = styled.img`
  width: 42px; /* Upscaled brand identity asset rendering scale */
  height: 42px;
  object-fit: contain;
`;

/* ==========================================================================
   4. TEXT LABELS & DATA NESTED TAGS
   ========================================================================== */

// Warning-colored tag beneath logo for country flag and short-name identifier
const LimeNameTag = styled.div`
  position: absolute;
  bottom: 6px;
  left: 2%;
  height: 22px; /* Increased structural layout density slightly */
  background: ${Theme.orangeBadge};
  clip-path: polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px 0 10px;
  z-index: 5;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.35);
`;

const FlagImg = styled.img`
  width: 16px;
  height: 11px;
  object-fit: cover;
  border-radius: 1px;
`;

const TeamShortText = styled.span`
  font-family: 'Arial Black', Gadget, sans-serif;
  font-size: 12px; /* Prominent profile font optimization */
  font-weight: 900;
  color: ${Theme.textDark};
  font-style: italic;
  text-transform: uppercase;
`;

// WR text alignment label
const WrLabel = styled.span`
  position: absolute;
  bottom: 10px;
  left: 100px; /* Repositioned to balance the shifted elements */
  font-family: 'Arial Black', Gadget, sans-serif;
  font-size: 12px;
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
  left: 128px; /* Repositioned to balance upscale */
  width: 100px; /* Expanded spatial envelope */
  height: 22px;
  background: ${Theme.orangeBadge};
  clip-path: polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.35);
`;

const WinRateText = styled.span`
  font-family: 'Arial Black', Gadget, sans-serif;
  font-size: 13px; /* Clean tracking font scaling up scale readability */
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
  top: 12px;
  right: 40px;
  display: flex;
  gap: 5px; /* Clean spacing for upscaled blocks */
  z-index: 3;
`;

const HPBlock = styled.div<{
  $isDead: boolean;
  $isLow: boolean;
  $isKnocked: boolean;
  $hasRecalled: boolean;
}>`
  width: 11px; /* Expanded tracking fill window */
  height: 32px; /* Significantly increased health bar height profile */
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
    animation: ${lowHpFlicker} 1.2s infinite ease-in-out;
  `}
`;

const HealthFill = styled.div<{
  $percent: number;
  $isKnocked: boolean;
  $hasRecalled: boolean;
}>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.$percent}%;
  background: ${(props) => {
    if (props.$hasRecalled) return Theme.aliveBlue;
    if (props.$isKnocked) return Theme.knocked;
    return Theme.aliveYellow;
  }};
  transition: height 0.35s cubic-bezier(0.16, 1, 0.3, 1);
`;

/* ==========================================================================
   6. MASTER CONTROLLER LAYOUT MODULE
   ========================================================================== */

const EndgameTopHUD: React.FC<EndgameTopHUDProps> = ({ teams = [] }) => {
  // Filters out eliminated squads immediately, showcasing active Top 4 survivors
  const activeTopFour = [...teams]
    .filter(team => team.playersAlive > 0 && !team.is_eliminated && !team.isEliminated)
    .slice(0, 4)
    .sort((a, b) => a.rank - b.rank);

  // Helper function to format the Win Rate string matching image reference spacing
  const formatWinRate = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === "") return "0 %";
    const numeric = Number(String(val).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(numeric)) return "0 %";
    return `${Math.round(numeric)} %`;
  };

  const getPlayerHpPercent = (player: PlayerData) =>
    Math.max(0, Math.min(100, Number(player.hpPercent ?? 0) || 0));

  const getPlayerStatus = (player: PlayerData): PlayerStatus => {
    if (getPlayerHpPercent(player) <= 0) return "dead";
    if (player.hasRecalled) return "recalled";
    if (player.status === "dead") return "dead";
    if (player.status === "knocked" || player.isKnocked) return "knocked";
    return "alive";
  };

  return (
    <EndgameHUDContainer>
      <AnimatePresence mode="popLayout">
        {activeTopFour.map((team) => {
          
          const squadDataSlots = Array.from({ length: 4 }, (_, i) => {
            return team.players?.[i] || { status: "dead" as PlayerStatus, hpPercent: 0, isKnocked: false, hasRecalled: false };
          });

          return (
            <CardContainer
              key={team.id || team.name}
              layout
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
              {/* Core Trapezoidal Base Hull Component */}
              <MainSkelBody>
                
                {/* Embedded Skewed Shield Component for Team Badge Icons */}
                <LogoShield>
                  <TeamLogoImg src={team.logoUrl} alt="Icon" />
                </LogoShield>

                {/* Plain Text Header Label Descriptor Elements */}
                <WrLabel>WS</WrLabel>

                {/* Embedded Esports 4-Squad Individual Teammate Monitor bars */}
                <HealthSystemRow>
                  {squadDataSlots.map((player, index) => {
                    const playerStatus = getPlayerStatus(player);
                    const hpPercent = getPlayerHpPercent(player);
                    const isDead = playerStatus === "dead";
                    const isKnocked = playerStatus === "knocked";
                    const hasRecalled = playerStatus === "recalled";
                    const isLow = playerStatus === "alive" && hpPercent > 0 && hpPercent < 30;

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
                            $percent={hasRecalled ? 100 : hpPercent}
                            $isKnocked={isKnocked}
                            $hasRecalled={hasRecalled}
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

            </CardContainer>
          );
        })}
      </AnimatePresence>
    </EndgameHUDContainer>
  );
};

export default EndgameTopHUD;
