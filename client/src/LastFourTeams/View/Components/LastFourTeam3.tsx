import React from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/* ==========================================================================
   1. KEYFRAME ANIMATIONS
   ========================================================================== */

const lowHpFlicker = keyframes`
  0%, 100% {
    box-shadow:
      0 0 4px rgba(var(--project-danger-rgb, 255, 42, 109), 0.4),
      inset 0 0 2px rgba(var(--project-danger-rgb, 255, 42, 109), 0.15);

    filter: brightness(0.92);
  }

  50% {
    box-shadow:
      0 0 14px rgba(var(--project-danger-rgb, 255, 42, 109), 0.95),
      inset 0 0 6px rgba(var(--project-danger-rgb, 255, 42, 109), 0.45);

    filter: brightness(1.2);
  }
`;

const shimmerMove = keyframes`
  0% {
    transform: translateX(-140%) skewX(-20deg);
  }

  100% {
    transform: translateX(480%) skewX(-20deg);
  }
`;

/* ==========================================================================
   2. THEME
   ========================================================================== */

const Theme = {
  purplePlateBg: `
    linear-gradient(
      135deg,
      var(--project-primary, #5b17d4) 0%,
      var(--project-surface, #3d0a97) 45%,
      var(--project-background, #1b0148) 100%
    )
  `,

  blackLogoBg: `
    linear-gradient(
      180deg,
      var(--project-background, #050507) 0%,
      var(--project-surface, #111117) 100%
    )
  `,

  limeBadge: "var(--project-accent, #cfff00)",
  orangeBadge: "var(--project-warning, #ff6a00)",

  knocked: "var(--project-danger, #ff0048)",
  lowAlert: "var(--project-danger, #ff2a6d)",
  recalled: "var(--project-success, #00ff88)",

  textDark: "var(--project-background, #000000)",
  textLight: "var(--project-text-primary, #ffffff)",
};

/* ==========================================================================
   3. ROOT HUD CONTAINER
   ========================================================================== */

const EndgameHUDContainer = styled.div`
  position: fixed;

  top: 28px;
  left: 50%;

  transform: translateX(-50%);

  display: flex;
  gap: 30px;

  z-index: 999999;

  pointer-events: none;
`;

/* ==========================================================================
   4. CARD
   ========================================================================== */

const CardContainer = styled(motion.div)`
  position: relative;

  width: 350px;
  height: 120px;

  pointer-events: auto;
`;

const MainSkelBody = styled.div`
  position: absolute;
  inset: 0;

  overflow: hidden;

  background: ${Theme.purplePlateBg};

  clip-path: polygon(
    5% 0%,
    100% 0%,
    95% 100%,
    0% 100%
  );

  border-top: 1px solid rgba(255,255,255,0.16);
  border-bottom: 1px solid rgba(255,255,255,0.08);

  box-shadow:
    0 14px 30px rgba(0,0,0,0.55),
    inset 0 0 18px rgba(255,255,255,0.04);

  display: flex;
  align-items: center;

  &::before {
    content: "";

    position: absolute;

    top: 0;
    left: 0;

    width: 26%;
    height: 100%;

    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.08),
      transparent
    );

    animation: ${shimmerMove} 4s linear infinite;

    pointer-events: none;
  }
`;

/* ==========================================================================
   5. LOGO SECTION
   ========================================================================== */

const LogoShield = styled.div`
  position: absolute;

  left: 0;
  top: 0;

  width: 94px;
  height: 100%;

  background: ${Theme.blackLogoBg};

  clip-path: polygon(
    0 0,
    88% 0,
    100% 100%,
    0 100%
  );

  display: flex;
  align-items: center;
  justify-content: center;

  border-right: 1px solid rgba(255,255,255,0.08);

  z-index: 5;
`;

const TeamLogoImg = styled.img`
  width: 54px;
  height: 54px;

  object-fit: contain;

  filter:
    drop-shadow(0 0 10px rgba(255,255,255,0.16));
`;

/* ==========================================================================
   6. TEAM NAME TAG
   ========================================================================== */

const LimeNameTag = styled.div`
  position: absolute;

  left: 14px;
  bottom: 12px;

  height: 30px;

  background: linear-gradient(
    135deg,
    var(--project-accent, #d6ff38) 0%,
    var(--project-accent, #b6ff00) 100%
  );

  clip-path: polygon(
    5% 0%,
    100% 0%,
    95% 100%,
    0% 100%
  );

  display: flex;
  align-items: center;
  gap: 7px;

  padding: 0 15px 0 12px;

  z-index: 20;

  box-shadow:
    0 6px 16px rgba(0,0,0,0.35);
`;

const FlagImg = styled.img`
  width: 18px;
  height: 12px;

  object-fit: cover;

  border-radius: 2px;
`;

const TeamShortText = styled.span`
  font-family: "Arial Black", sans-serif;

  font-size: 13px;
  font-weight: 900;
  font-style: italic;

  text-transform: uppercase;
  letter-spacing: 0.5px;

  color: ${Theme.textDark};
`;

/* ==========================================================================
   7. CENTER SECTION
   ========================================================================== */

const MiddleSection = styled.div`
  position: absolute;

  left: 112px;
  top: 50%;

  transform: translateY(-50%);

  width: 210px;

  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 14px;

  z-index: 10;
`;

const WrWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const WrLabel = styled.span`
  font-family: "Arial Black", sans-serif;

  font-size: 11px;
  font-weight: 900;
  font-style: italic;

  color: var(--project-text-secondary, rgba(255,255,255,0.75));

  letter-spacing: 1px;
`;

const OrangeWrBadge = styled.div`
  width: 100px;
  height: 30px;

  background: linear-gradient(
    135deg,
    var(--project-warning, #ff9200) 0%,
    var(--project-primary, #ff5a00) 100%
  );

  clip-path: polygon(
    8% 0%,
    100% 0%,
    92% 100%,
    0% 100%
  );

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 6px 16px rgba(0,0,0,0.35);
`;

const WinRateText = styled.span`
  font-family: "Arial Black", sans-serif;

  font-size: 14px;
  font-weight: 900;
  font-style: italic;

  letter-spacing: 0.5px;

  color: ${Theme.textDark};
`;

/* ==========================================================================
   8. HEALTH SYSTEM
   ========================================================================== */

const HealthSystemRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;

  gap: 8px;
`;

const HPBlock = styled.div<{
  $isDead: boolean;
  $isLow: boolean;
  $isKnocked: boolean;
  $hasRecalled: boolean;
}>`
  width: 14px;
  height: 46px;

  position: relative;

  overflow: visible;

  border-radius: 3px;

  background: ${(props) =>
    props.$isDead
      ? "rgba(255,255,255,0.08)"
      : "linear-gradient(to bottom, rgba(15,15,15,0.96), rgba(0,0,0,1))"};

  border: 1px solid
    ${(props) => {
      if (props.$isDead) return "rgba(255,255,255,0.08)";
      if (props.$isKnocked) return Theme.knocked;
      if (props.$isLow) return Theme.lowAlert;
      if (props.$hasRecalled) return Theme.recalled;

      return "rgba(255,255,255,0.18)";
    }};

  box-shadow:
    inset 0 0 6px rgba(255,255,255,0.04),
    0 4px 10px rgba(0,0,0,0.35);

  transition:
    border 0.2s ease,
    transform 0.2s ease;

  ${(props) =>
    props.$isLow &&
    !props.$isDead &&
    css`
      animation: ${lowHpFlicker} 1.1s infinite ease-in-out;

      z-index: 10;

      &::before {
        content: "";

        position: absolute;

        inset: -5px;

        border-radius: 6px;

        background:
          radial-gradient(
            circle,
            rgba(var(--project-danger-rgb, 255, 42, 109), 0.45),
            transparent 70%
          );

        z-index: -1;
      }
    `}
`;

const HealthFill = styled.div<{
  $percent: number;
  $isKnocked: boolean;
  $hasRecalled: boolean;
}>`
  position: absolute;

  left: 0;
  bottom: 0;

  width: 100%;
  height: ${(props) => props.$percent}%;

  border-radius: 2px;

  transition:
    height 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  background: ${(props) => {
    if (props.$hasRecalled) {
      return `
        linear-gradient(
          to top,
          var(--project-success, #007a4a) 0%,
          var(--project-success, #00ffaa) 65%,
          var(--project-text-primary, #ffffff) 100%
        )
      `;
    }

    if (props.$isKnocked) {
      return `
        linear-gradient(
          to top,
          var(--project-danger, #650019) 0%,
          var(--project-danger, #ff0048) 75%,
          var(--project-text-primary, #ff8ab1) 100%
        )
      `;
    }

    return `
      linear-gradient(
        to top,
        var(--project-accent, #8fb800) 0%,
        var(--project-accent, #d0ff00) 75%,
        var(--project-text-primary, #ffffff) 100%
      )
    `;
  }};

  &::after {
    content: "";

    position: absolute;

    top: 0;
    left: 0;

    width: 100%;
    height: 35%;

    background:
      linear-gradient(
        to bottom,
        rgba(255,255,255,0.4),
        transparent
      );

    opacity: 0.7;
  }
`;

/* ==========================================================================
   9. COMPONENT
   ========================================================================== */

const EndgameTopHUD = ({ teams = [] }) => {
  const activeTopFour = [...teams]
    .filter(
      (team) =>
        team.playersAlive > 0 &&
        !team.is_eliminated
    )
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4);

  const formatWinRate = (val) => {
    if (!val) return "0 %";

    const numericStr = String(val).replace(
      /[^0-9]/g,
      ""
    );

    return `${numericStr} %`;
  };

  return (
    <EndgameHUDContainer>
      <AnimatePresence mode="popLayout">
        {activeTopFour.map((team) => {
          const squadDataSlots = Array.from(
            { length: 4 },
            (_, i) => {
              return (
                team.players?.[i] || {
                  status: "dead",
                  hpPercent: 0,
                  isKnocked: false,
                  hasRecalled: false,
                }
              );
            }
          );

          return (
            <CardContainer
              key={team.id || team.name}
              layout
              initial={{
                opacity: 0,
                y: -40,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -50,
                scale: 0.82,
                transition: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 22,
              }}
            >
              <MainSkelBody>
                {/* LOGO */}
                <LogoShield>
                  <TeamLogoImg
                    src={team.logoUrl}
                    alt="Team"
                  />
                </LogoShield>

                {/* CENTER */}
                <MiddleSection>
                  <WrWrapper>
                    <WrLabel>
                      WIN RATE
                    </WrLabel>

                    <OrangeWrBadge>
                      <WinRateText>
                        {formatWinRate(
                          team.winRate
                        )}
                      </WinRateText>
                    </OrangeWrBadge>
                  </WrWrapper>

                  <HealthSystemRow>
                    {squadDataSlots.map(
                      (player, index) => {
                        const isDead =
                          player.status ===
                            "dead" &&
                          !player.hasRecalled;

                        const isLow =
                          !player.hasRecalled &&
                          player.hpPercent >
                            0 &&
                          player.hpPercent <
                            30;

                        return (
                          <HPBlock
                            key={index}
                            $isDead={isDead}
                            $isLow={isLow}
                            $isKnocked={
                              player.isKnocked
                            }
                            $hasRecalled={
                              !!player.hasRecalled
                            }
                          >
                            {(!isDead ||
                              player.hasRecalled) && (
                              <HealthFill
                                $percent={
                                  player.hasRecalled
                                    ? 100
                                    : player.hpPercent
                                }
                                $isKnocked={
                                  player.isKnocked
                                }
                                $hasRecalled={
                                  !!player.hasRecalled
                                }
                              />
                            )}
                          </HPBlock>
                        );
                      }
                    )}
                  </HealthSystemRow>
                </MiddleSection>
              </MainSkelBody>

              {/* TEAM NAME */}
              <LimeNameTag>
                <FlagImg
                  src={
                    team.countryFlag ||
                    "https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg"
                  }
                  alt="Flag"
                />

                <TeamShortText>
                  {team.shortName ||
                    team.name?.substring(
                      0,
                      4
                    )}
                </TeamShortText>
              </LimeNameTag>
            </CardContainer>
          );
        })}
      </AnimatePresence>
    </EndgameHUDContainer>
  );
};

export default EndgameTopHUD;
