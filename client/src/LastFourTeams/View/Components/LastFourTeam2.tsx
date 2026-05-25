import React, { useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

export type PlayerStatus = "alive" | "knocked" | "dead";

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
  rank: number;
  playersAlive: number;
  is_eliminated?: boolean;
  winRate?: string | number;
  players?: PlayerData[];
}

interface EndgameTopHUDProps {
  teams?: TeamData[];
}

/* ==========================================================================
   TIER-1 PREMIUM COLOR STANDARD MATRIX
   ========================================================================== */

const BROADCAST_THEME = {
  gradients: {
    mainCarbon: "linear-gradient(180deg, var(--project-surface, #0d0e12) 0%, var(--project-background, #060608) 100%)",
    brandAegis: "linear-gradient(135deg, var(--project-primary, #1b0e30) 0%, var(--project-background, #07030d) 100%)",
    shineOverlay: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)",
    barBacktrack: "linear-gradient(180deg, rgba(20, 20, 25, 0.8) 0%, rgba(10, 10, 12, 0.9) 100%)",
    hpActiveNormal: "linear-gradient(to top, var(--project-accent, #447300) 0%, var(--project-accent, #bfff00) 100%)",
    hpActiveKnocked: "linear-gradient(to top, var(--project-danger, #8f001b) 0%, var(--project-danger, #ff003c) 100%)",
    hpActiveRecalled: "linear-gradient(to top, var(--project-success, #007343) 0%, var(--project-success, #00ff8c) 100%)",
  },
  colors: {
    neonLime: "var(--project-accent, #bfff00)",
    esportsOrange: "var(--project-warning, #ff6a00)",
    criticalRed: "var(--project-danger, #ff003c)",
    cleanWhite: "var(--project-text-primary, #ffffff)",
    dimGray: "var(--project-text-secondary, rgba(255, 255, 255, 0.45))",
    chassisFrame: "var(--project-border, rgba(255, 255, 255, 0.05))",
    glowShadow: "rgba(0, 0, 0, 0.85)",
  },
} as const;

/* ==========================================================================
   DYNAMIC REFRESH HUD TELEMETRY ANIMATIONS
   ========================================================================== */

const lowHpPulseAlert = keyframes`
  0%, 100% { 
    opacity: 0.5; 
    filter: drop-shadow(0 0 1px ${BROADCAST_THEME.colors.criticalRed}); 
  }
  50% { 
    opacity: 1; 
    filter: drop-shadow(0 0 8px ${BROADCAST_THEME.colors.criticalRed}); 
  }
`;

const globalLightSweep = keyframes`
  0% { transform: translateX(-160%) skewX(-25deg); }
  100% { transform: translateX(220%) skewX(-25deg); }
`;

/* ==========================================================================
   HUD STRUCTURAL CHASSIS HOUSING
   ========================================================================== */

const EndgameHUDContainer = styled.div`
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 14px;
  z-index: 999999;
  pointer-events: none;
`;

const CardWrapper = styled(motion.div)`
  position: relative;
  width: 325px;
  height: 74px;
  pointer-events: auto;
  filter: drop-shadow(0 16px 26px ${BROADCAST_THEME.colors.glowShadow});
`;

const SolidChassisHull = styled.div`
  position: absolute;
  inset: 0;
  background: ${BROADCAST_THEME.gradients.mainCarbon};
  clip-path: polygon(0 0, 100% 0, 96% 100%, 0 100%);
  border: 1px solid ${BROADCAST_THEME.colors.chassisFrame};
  border-left: 3px solid ${BROADCAST_THEME.colors.neonLime};
  display: flex;
  align-items: center;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 60%;
    background: ${BROADCAST_THEME.gradients.shineOverlay};
    animation: ${globalLightSweep} 5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
    pointer-events: none;
    z-index: 1;
  }
`;

/* ==========================================================================
   VISUAL LANE 1: THE TEAM SHIELD (BRANDING PANEL)
   ========================================================================== */

const BrandingShield = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 66px;
  height: 100%;
  background: ${BROADCAST_THEME.gradients.brandAegis};
  clip-path: polygon(0 0, 100% 0, 84% 100%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 4px;
  z-index: 2;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
`;

const TeamLogoImage = styled.img`
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6));
`;

/* ==========================================================================
   VISUAL LANE 2: DATA REGISTRY WORKSPACE (IDENTITY & METRICS)
   ========================================================================== */

const DataMetricsWorkspace = styled.div`
  position: absolute;
  left: 76px;
  right: 92px;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  z-index: 3;
`;

const IdentityBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountryFlagImg = styled.img`
  width: 18px;
  height: 11px;
  object-fit: cover;
  border-radius: 1px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const TeamShortText = styled.span`
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 20px;
  font-weight: 900;
  text-transform: uppercase;
  color: ${BROADCAST_THEME.colors.cleanWhite};
  letter-spacing: 0.6px;
  font-style: italic;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.85);
`;

const AnalyticsBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const WrLabelText = styled.span`
  font-family: "Arial Black", sans-serif;
  font-size: 10px;
  font-weight: 900;
  color: ${BROADCAST_THEME.colors.dimGray};
  letter-spacing: 0.5px;
`;

const WinRateValueText = styled.span`
  font-family: "Impact", sans-serif;
  font-size: 15px;
  font-weight: 900;
  color: ${BROADCAST_THEME.colors.esportsOrange};
  font-style: italic;
  letter-spacing: 0.2px;
`;

/* ==========================================================================
   VISUAL LANE 3: PREMIUM HIGH-FIDELITY VERTICAL LIFELINE DECK
   ========================================================================== */

const VerticalLifelineDeck = styled.div`
  position: absolute;
  right: 22px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 5px;
  height: 48px;
  z-index: 4;
`;

interface HPBlockProps {
  $isDead: boolean;
  $isLow: boolean;
  $isKnocked: boolean;
}

const HPBlock = styled.div<HPBlockProps>`
  width: 11px;
  height: 100%;
  position: relative;
  background: ${BROADCAST_THEME.gradients.barBacktrack};
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.6);
  border-radius: 1.5px;
  overflow: hidden;

  ${({ $isDead }) =>
    $isDead &&
    css`
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.03);
      box-shadow: none;
    `}

  ${({ $isKnocked }) =>
    $isKnocked &&
    css`
      border-color: ${BROADCAST_THEME.colors.criticalRed};
    `}

  ${({ $isLow, $isDead }) =>
    $isLow &&
    !$isDead &&
    css`
      animation: ${lowHpPulseAlert} 0.45s ease-in-out infinite alternate;
      border-color: ${BROADCAST_THEME.colors.criticalRed};
    `}
`;

interface ActiveVerticalFillProps {
  $percent: number;
  $isKnocked: boolean;
  $hasRecalled: boolean;
}

const ActiveVerticalFill = styled.div<ActiveVerticalFillProps>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${({ $percent }) => $percent}%;
  transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background: ${({ $isKnocked, $hasRecalled }) => {
    if ($hasRecalled) return BROADCAST_THEME.gradients.hpActiveRecalled;
    if ($isKnocked) return BROADCAST_THEME.gradients.hpActiveKnocked;
    return BROADCAST_THEME.gradients.hpActiveNormal;
  }};
  border-top: 1px solid rgba(255, 255, 255, 0.4);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.15) 100__%
    );
    pointer-events: none;
  }
`;

/* ==========================================================================
   MASTER TRANSMISSION CONTROLLER ENGINE
   ========================================================================== */

const CRITICAL_DEFAULT_FLAG = "https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg";

const EndgameTopHUD: React.FC<EndgameTopHUDProps> = ({ teams = [] }) => {
  const activeTopFour = useMemo(() => {
    return [...teams]
      .filter((team) => team.playersAlive > 0 && !team.is_eliminated)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 4);
  }, [teams]);

  const formatWinRate = (val?: string | number): string => {
    if (!val) return "0%";
    const numericStr = String(val).replace(/[^0-9]/g, "");
    return numericStr ? `${numericStr}%` : "0%";
  };

  return (
    <EndgameHUDContainer>
      <AnimatePresence mode="popLayout">
        {activeTopFour.map((team) => {
          const telemetryTeamKey = team.id || team.name;

          // Locks the layout to exactly 4 structural player profile vertical streams
          const structuredSquadSlots = Array.from({ length: 4 }, (_, i) => {
            return (
              team.players?.[i] || {
                status: "dead" as PlayerStatus,
                hpPercent: 0,
                isKnocked: false,
                hasRecalled: false,
              }
            );
          });

          return (
            <CardWrapper
              key={telemetryTeamKey}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -35,
                scale: 0.9,
                transition: { duration: 0.2, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 250, damping: 27 }}
            >
              <SolidChassisHull>
                
                {/* Visual Lane 1: Team Shield Frame Anchor */}
                <BrandingShield>
                  <TeamLogoImage src={team.logoUrl} alt={`${team.name} Logo`} />
                </BrandingShield>

                {/* Visual Lane 2: Data Registry Text Grid */}
                <DataMetricsWorkspace>
                  <IdentityBlock>
                    <CountryFlagImg src={team.countryFlag || CRITICAL_DEFAULT_FLAG} alt="Country Flag" />
                    <TeamShortText>
                      {team.shortName || team.name?.substring(0, 4)}
                    </TeamShortText>
                  </IdentityBlock>

                  <AnalyticsBlock>
                    <WrLabelText>WR</WrLabelText>
                    <WinRateValueText>{formatWinRate(team.winRate)}</WinRateValueText>
                  </AnalyticsBlock>
                </DataMetricsWorkspace>

                {/* Visual Lane 3: High-Fidelity Vertical Player Track Deck */}
                <VerticalLifelineDeck>
                  {structuredSquadSlots.map((player, index) => {
                    const isDead = player.status === "dead" && !player.hasRecalled;
                    const isLow = !player.hasRecalled && player.hpPercent > 0 && player.hpPercent < 30;

                    return (
                      <HPBlock
                        key={`vertical-track-${telemetryTeamKey}-${index}`}
                        $isDead={isDead}
                        $isLow={isLow}
                        $isKnocked={player.isKnocked}
                      >
                        {(!isDead || player.hasRecalled) && (
                          <ActiveVerticalFill
                            $percent={player.hasRecalled ? 100 : player.hpPercent}
                            $isKnocked={player.isKnocked}
                            $hasRecalled={player.hasRecalled}
                          />
                        )}
                      </HPBlock>
                    );
                  })}
                </VerticalLifelineDeck>

              </SolidChassisHull>
            </CardWrapper>
          );
        })}
      </AnimatePresence>
    </EndgameHUDContainer>
  );
};

export default EndgameTopHUD;
