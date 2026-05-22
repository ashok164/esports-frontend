import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/* ==========================================================================
   1. KEYFRAME ANIMATIONS (Slight, Smooth, and Steady Breathing)
   ========================================================================== */

const steadyLowHpGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 6px rgba(255, 46, 99, 0.4), inset 0 0 2px rgba(255, 0, 90, 0.2);
    filter: brightness(0.95);
  }
  50% {
    box-shadow: 0 0 14px rgba(255, 46, 99, 0.85), inset 0 0 4px rgba(255, 0, 90, 0.5);
    filter: brightness(1.25);
  }
`;

const steadyHeartBeat = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.75;
  }
`;

const steadyCoreFlash = keyframes`
  0%, 100% { opacity: 0.05; }
  50% { opacity: 0.45; }
`;

// Glowing pulsation specifically for the eye-catching Recalled state
const crystalRecallGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 4px rgba(0, 255, 136, 0.3), inset 0 0 1px rgba(0, 255, 136, 0.2);
  }
  50% {
    box-shadow: 0 0 12px rgba(0, 255, 136, 0.75), inset 0 0 3px rgba(0, 255, 136, 0.4);
  }
`;

/* ==========================================================================
   2. CONFIGURATION & CONFIG THEMES
   ========================================================================== */

const DIMENSIONS = {
  ROW_HEIGHT: 44,
  SKEW: -20,
  GAP: 4,
  RANK_W: 80,
  COUNTRY_W: 46,
  LOGO_W: 54,
  TAG_W: 150,
  KILLS_W: 80,
  STATUS_W: 130,
};

const ELIMINATION_BANNER_MS = 3200;

const Theme = {
  accent: "#FFD700",       // Cyber Gold Accent
  knocked: "#FF0055",      // Neon Crimson Flare
  lowAlert: "#FF2A6D",     // Synthwave Pink/Red Alert
  danger: "#DE123A",       // Pure Matte Red
  recalled: "#00FF88",     // Radioactive Cyan-Green (Eye-catching)
  plateBg: "rgba(10,12,16,0.96)",
  headerBg: "#050608",
  border: "rgba(255,255,255,0.06)",
};

interface Player {
  hpPercent: number;
  isKnocked: boolean;
  status: "alive" | "knocked" | "dead";
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
  players?: Player[];
}

/* ==========================================================================
   3. LAYOUT & STRUCTURAL PLATES
   ========================================================================== */

const TableWrapper = styled.div`
  position: fixed;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Oswald', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const RowLayout = styled(motion.div)`
  display: flex;
  gap: ${DIMENSIONS.GAP}px;
  align-items: center;
  position: relative;
`;

const Plate = styled.div<{
  $width: number;
  $bg?: string;
  $isHeader?: boolean;
  $borderAccent?: string;
  $allowGlow?: boolean;
  $isDimmed?: boolean;
}>`
  width: ${(props) => props.$width}px;
  height: ${DIMENSIONS.ROW_HEIGHT}px;
  background: ${(props) => props.$bg || Theme.plateBg};
  transform: skewX(${DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  position: relative;

  overflow: ${(props) => (props.$allowGlow ? "visible !important" : "hidden")};
  border-top: 1px solid ${Theme.border};
  filter: ${(props) =>
    props.$isDimmed ? "grayscale(0.75) brightness(0.55)" : "none"};

  ${props =>
    props.$isHeader &&
    css`
      background: ${Theme.headerBg};
      border-top: 2px solid ${props.$borderAccent || Theme.accent};
      overflow: hidden !important;
    `}

  ${props =>
    props.$borderAccent &&
    !props.$isHeader &&
    css`
      border-right: 4px solid ${props.$borderAccent};
    `}

  ${props =>
    props.$isDimmed &&
    !props.$isHeader &&
    css`
      background: rgba(7,8,11,0.98);
    `}
`;

const Content = styled.div`
  transform: skewX(${-DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 15px;
`;

/* ==========================================================================
   4. HEALTH INTERFACES
   ========================================================================== */

const HPGroup = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  width: 100%;
  overflow: visible !important;
`;

const PlayerBarContainer = styled.div<{
  $isDead: boolean;
  $isLow: boolean;
  $isKnocked: boolean;
  $hasRecalled: boolean;
}>`
  width: 9px;
  height: 24px;
  position: relative;
  box-sizing: border-box;
  overflow: visible !important;
  transition: background 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border 0.3s ease;

  /* BACKGROUND & BORDER CONTROLS */
  background: ${(props) => {
    if (props.$isDead) return "rgba(255, 255, 255, 0.05)";
    if (props.$hasRecalled) return "rgba(0, 255, 136, 0.08)";
    return "rgba(0, 0, 0, 0.75)";
  }};

  border: ${(props) => {
    if (props.$isDead) return `1px solid rgba(120, 30, 50, 0.4)`; 
    if (props.$isKnocked) return `1.5px solid ${Theme.knocked}`;
    if (props.$isLow) return `1.5px solid ${Theme.lowAlert}`; 
    if (props.$hasRecalled) return `1.5px solid ${Theme.recalled}`;
    return `1px solid rgba(255, 255, 255, 0.16)`;
  }};

  /* PREMIUM AMBIENT EFFECTS IF PLAYER HAS RECALLED */
  ${props =>
    props.$hasRecalled &&
    css`
      /* animation: ${crystalRecallGlow} 2s infinite ease-in-out; */
      z-index: 5;
    `}

  /* STEADY LOW HP FLICKER AND RADIAL BACKDROP GLOW */
  ${props =>
    props.$isLow &&
    !props.$isDead &&
    !props.$hasRecalled &&
    css`
      animation: ${steadyLowHpGlow} 1.4s infinite ease-in-out !important;
      z-index: 10;

      &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        background: radial-gradient(
          circle,
          rgba(255, 42, 109, 0.6) 0%,
          rgba(255, 0, 90, 0.2) 55%,
          transparent 80%
        );
        animation: ${steadyHeartBeat} 1.4s infinite ease-in-out !important;
        z-index: -1;
        pointer-events: none;
      }

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          transparent,
          rgba(255, 255, 255, 0.35),
          transparent
        );
        animation: ${steadyCoreFlash} 1.4s infinite ease-in-out !important;
        z-index: 3;
        pointer-events: none;
      }
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
  z-index: 1;

  background: ${(props) => {
    if (props.$hasRecalled) {
      // Striking Toxic Emerald / Cyber-Green Gradient
      return `linear-gradient(to top, #005d3c 0%, #00b875 70%, #72ffd0 100%)`;
    }
    if (props.$isKnocked) {
      // Hot Crimson / Dark Burgundy Shift
      return `linear-gradient(to top, #6a001d 0%, #ff0044 80%, #ff66aa 100%)`;
    }
    // High-Contrast Cyber Amber Core
    return `linear-gradient(to top, #cf8000 0%, #ffd700 75%, #fff9d0 100%)`;
  }};

  transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease;
`;

/* ==========================================================================
   5. UI OVERLAYS & LABEL TEXTURES
   ========================================================================== */

const EliminationOverlay = styled(motion.div)`
  position: absolute;
  left: 0;
  top: 0;
  z-index: 100;
  display: flex;
  gap: ${DIMENSIONS.GAP}px;
  pointer-events: none;
`;

const ElimPlate = styled.div<{ $width: number; $transparent?: boolean }>`
  width: ${(props) => props.$width}px;
  height: ${DIMENSIONS.ROW_HEIGHT}px;
  background: ${(props) => props.$transparent ? "rgba(92,12,24,0.82)" : Theme.danger};
  transform: skewX(${DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 2px solid rgba(255,215,0,0.45);
  box-shadow: 12px 0 24px rgba(0,0,0,0.55);
`;

const ElimText = styled.div`
  color: #fff;
  font-weight: 900;
  font-size: 20px;
  letter-spacing: 6px;
  text-transform: uppercase;
  font-style: italic;
  transform: skewX(${-DIMENSIONS.SKEW}deg);
  text-shadow: 0 0 10px rgba(255,255,255,0.65), 0 0 20px rgba(222,18,58,0.85);
`;

const TeamLogo = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`;

const CountryLogo = styled.img`
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 50%;
`;

const IdentityContent = styled.div`
  transform: skewX(${-DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 8px;
`;

const IdentityPlate = styled(Plate)<{ $kind?: "country" | "logo" | "tag" }>`
  background: ${(props) => {
    if (props.$kind === "country") return "rgba(18,20,26,0.98)";
    if (props.$kind === "logo") return "rgba(4,6,10,0.98)";
    return "rgba(10,12,16,0.96)";
  }};
  border-top: 1px solid rgba(255,255,255,0.08);
  border-left: ${(props) =>
    props.$kind === "tag" ? `2px solid ${Theme.accent}` : "1px solid rgba(255,255,255,0.08)"};
`;

const Label = styled.div<{ $color?: string; $bold?: boolean }>`
  font-size: ${(props) => (props.$bold ? '22px' : '13px')};
  font-weight: 900;
  text-transform: uppercase;
  color: ${(props) => props.$color || "#fff"};
  width: 100%;
  text-align: center;
`;

const TeamNameText = styled.span`
  min-width: 0;
  font-weight: 700;
  font-size: 19px;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const getTeamTag = (team: Team) => team.teamTag || team.shortName || team.tag || team.name || "";

const TimedEliminationOverlay = ({ isAlive }: { isAlive: boolean }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isAlive) {
      setShowBanner(false);
      return;
    }

    setShowBanner(true);
    const timer = window.setTimeout(() => setShowBanner(false), ELIMINATION_BANNER_MS);

    return () => window.clearTimeout(timer);
  }, [isAlive]);

  return (
    <AnimatePresence>
      {showBanner && (
        <EliminationOverlay
          initial={{ x: -500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 160, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 110,
            damping: 19,
          }}
        >
          <ElimPlate $width={DIMENSIONS.RANK_W} $transparent />
          <ElimPlate $width={DIMENSIONS.COUNTRY_W + DIMENSIONS.LOGO_W + DIMENSIONS.TAG_W + DIMENSIONS.GAP * 2}>
            <ElimText>ELIMINATED</ElimText>
          </ElimPlate>
          <ElimPlate $width={DIMENSIONS.KILLS_W} $transparent />
        </EliminationOverlay>
      )}
    </AnimatePresence>
  );
};

/* ==========================================================================
   6. EXPORTED MASTER CORE MODULE
   ========================================================================== */

const StandingsTable = ({ teams = [] }: { teams?: Team[] }) => {
  console.log(teams,'teams')
  return (
    <TableWrapper>
      {/* HEADER */}
      <RowLayout>
        <Plate $width={DIMENSIONS.RANK_W} $bg={Theme.headerBg} $isHeader>
          <Content><Label>RANK</Label></Content>
        </Plate>

        <Plate $width={DIMENSIONS.COUNTRY_W + DIMENSIONS.LOGO_W + DIMENSIONS.TAG_W + DIMENSIONS.GAP * 2} $isHeader>
          <Content>
            <Label style={{ textAlign: "left", paddingLeft: "72px" }}>
              TEAM
            </Label>
          </Content>
        </Plate>

        <Plate $width={DIMENSIONS.KILLS_W} $isHeader>
          <Content><Label>KILLS</Label></Content>
        </Plate>

        <Plate $width={DIMENSIONS.STATUS_W} $isHeader>
          <Content><Label>ALIVE</Label></Content>
        </Plate>
      </RowLayout>

      {/* CORE DATA BODY ENGINE */}
      <AnimatePresence mode="popLayout">
        {[...teams]
          .sort((a, b) => a.rank - b.rank)
          .map((team) => {
            const isAlive = team.playersAlive > 0;
            
            const hasAnyLowPlayer = team.players?.some(
              (p) => p.status !== "dead" && !p.hasRecalled && p.hpPercent > 0 && p.hpPercent < 30
            );

            // Create a fixed-size slot container array for exactly 4 slots
            const paddedPlayers = Array.from({ length: 4 }, (_, i) => {
              return team.players?.[i] || { status: "dead", hpPercent: 0, isKnocked: false, hasRecalled: false };
            });

            return (
              <RowLayout
                key={team.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* ELIMINATION MASK OVERLAY */}
                <TimedEliminationOverlay isAlive={isAlive} />

                {/* RANK FIELD */}
                <Plate $width={DIMENSIONS.RANK_W} $isDimmed={!isAlive}>
                  <Content>
                    <Label $bold $color={isAlive ? Theme.accent : "#666"}>
                      {team.rank}
                    </Label>
                  </Content>
                </Plate>

                {/* TEAM DESIGN PROFILE */}
                <IdentityPlate $width={DIMENSIONS.COUNTRY_W} $kind="country" $isDimmed={!isAlive}>
                  <IdentityContent>
                    {team.countryUrl && (
                      <CountryLogo
                        src={team.countryUrl}
                        alt={`${getTeamTag(team)} country`}
                      />
                    )}
                  </IdentityContent>
                </IdentityPlate>

                <IdentityPlate $width={DIMENSIONS.LOGO_W} $kind="logo" $isDimmed={!isAlive}>
                  <IdentityContent>
                    <TeamLogo src={team.logoUrl} alt={getTeamTag(team)} />
                  </IdentityContent>
                </IdentityPlate>

                <IdentityPlate $width={DIMENSIONS.TAG_W} $kind="tag" $isDimmed={!isAlive}>
                  <IdentityContent>
                    <TeamNameText>{getTeamTag(team)}</TeamNameText>
                  </IdentityContent>
                </IdentityPlate>

                {/* TOTAL KILLS PROFILE */}
                <Plate $width={DIMENSIONS.KILLS_W} $isDimmed={!isAlive}>
                  <Content>
                    <Label $bold $color={isAlive ? Theme.accent : "#666"}>
                      {team.kills}
                    </Label>
                  </Content>
                </Plate>

                {/* HEALTH INFRASTRUCTURE COLUMN FIELD */}
                <Plate
                  $width={DIMENSIONS.STATUS_W}
                  $borderAccent={isAlive ? Theme.accent : Theme.danger}
                  $allowGlow={isAlive && hasAnyLowPlayer}
                  $isDimmed={!isAlive}
                >
                  <Content>
                    <HPGroup>
                      {paddedPlayers.map((p, i) => {
                        const isDead = p.status === "dead" && !p.hasRecalled;
                        const isLow = !p.hasRecalled && p.hpPercent > 0 && p.hpPercent < 30;

                        return (
                          <PlayerBarContainer
                            key={i}
                            $isDead={isDead}
                            $isLow={isLow}
                            $isKnocked={p.isKnocked}
                            $hasRecalled={!!p.hasRecalled}
                          >
                            {(!isDead || p.hasRecalled) && (
                              <HealthFill
                                $percent={p.hasRecalled ? 100 : p.hpPercent}
                                $isKnocked={p.isKnocked}
                                $hasRecalled={!!p.hasRecalled}
                              />
                            )}
                          </PlayerBarContainer>
                        );
                      })}
                    </HPGroup>
                  </Content>
                </Plate>
              </RowLayout>
            );
          })}
      </AnimatePresence>
    </TableWrapper>
  );
};

export default StandingsTable;
