import React from "react";
import styled, { keyframes } from "styled-components";
import {
  BROADCAST_DISPLAY_SETTINGS_KEY,
  BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT,
  getBroadcastDisplaySettings,
} from "../../../Theme/projectTheme";
import {
  getTournamentAssetId,
  getTournamentAssetUrl,
  getTournamentAssetsApi,
} from "../../../TournamentAssets/Repository/remote";
import { CircleAnalysisTeam } from "../../types";

const growPath = keyframes`
  0% {
    stroke-dashoffset: var(--path-length);
    opacity: 0;
  }
  6% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
`;

const travelHead = keyframes`
  0% {
    left: var(--start-x);
    transform: translate(-50%, -50%) scale(0.64);
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  100% {
    left: var(--finish-x);
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
`;

const popNode = keyframes`
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
`;

const withOpacity = (color: string, opacity: number) => {
  const normalized = color.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return color;

  const value = Number.parseInt(normalized, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
};

const CrosshairSvg: React.FC<{ title?: string }> = ({ title = "Elims" }) => (
  <svg viewBox="0 0 64 64" aria-label={title} role="img">
    <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="8" />
    <circle cx="32" cy="32" r="8" fill="currentColor" />
    <path d="M32 3v17M32 44v17M3 32h17M44 32h17" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
  </svg>
);

const DashboardContainer = styled.div`
  --circle-panel-width: 940px;
  position: fixed;
  top: 50%;
  right: 58px;
  transform: translateY(-50%);
  width: min(var(--circle-panel-width), calc(100vw - 96px));
  color: var(--circle-text-1);
  font-family: "Oswald", "Arial Narrow", sans-serif;
  text-transform: uppercase;
  pointer-events: none;

  @media (min-width: 2560px) {
    right: 84px;
    transform: translateY(-50%) scale(1.45);
    transform-origin: right center;
  }
`;

const TimelineHeaderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  height: 42px;
  border: 1px solid var(--circle-grid-line);
  border-bottom: 0;
`;

const CircleHeader = styled.div<{ $index: number }>`
  display: grid;
  place-items: center;
  min-width: 0;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--circle-header-bg) 82%, #ffffff 18%) 0%,
    var(--circle-header-bg) 46%,
    color-mix(in srgb, var(--circle-header-bg) 82%, #000000 18%) 100%
  );
  color: var(--circle-header-text);
  border-right: 1px solid var(--circle-grid-line);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0;
  white-space: nowrap;

  &:last-child {
    border-right: 0;
  }
`;

const TrackList = styled.div`
  position: relative;
  min-height: 696px;
  border: 1px solid var(--circle-grid-line);
  background:
    linear-gradient(90deg, var(--circle-grid-line) 1px, transparent 1px) 0 0 / calc(100% / 8) 100%,
    linear-gradient(180deg, var(--circle-row-line) 1px, transparent 1px) 0 0 / 100% 58px,
    var(--circle-panel-bg);
  overflow: hidden;
`;

const TeamRow = styled.div`
  position: relative;
  height: 58px;
`;

const TrackSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const TrackPath = styled.path<{ $delay: number; $dead: boolean; $duration: number; $pathLength: number }>`
  --path-length: ${({ $pathLength }) => $pathLength};
  fill: none;
  stroke: ${({ $dead }) => ($dead ? "var(--circle-elim)" : "var(--circle-line)")};
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  opacity: 0;
  filter: drop-shadow(0 0 7px ${({ $dead }) => ($dead ? "var(--circle-elim-glow)" : "var(--circle-line-glow)")});
  animation: ${growPath} ${({ $duration }) => `${$duration}ms`} linear forwards;
  animation-delay: ${({ $delay }) => `${$delay}ms`};
`;

const LogoPoint = styled.div<{ $startX: number; $x: number; $dead: boolean; $delay: number; $duration: number }>`
  --start-x: ${({ $startX }) => `${$startX}%`};
  --finish-x: ${({ $x }) => `${$x}%`};
  position: absolute;
  left: var(--start-x);
  top: 50%;
  z-index: 4;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.78);
  animation: ${travelHead} ${({ $duration }) => `${$duration}ms`} linear forwards;
  animation-delay: ${({ $delay }) => `${$delay}ms`};
`;

const LogoBox = styled.div<{ $bgImage?: string; $dead?: boolean }>`
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  position: relative;
  background:
    ${({ $bgImage }) => ($bgImage ? `url(${$bgImage}) center / contain no-repeat` : "var(--circle-logo-bg)")};
  border: ${({ $bgImage }) => ($bgImage ? "0" : "1px solid var(--circle-grid-line)")};
  box-shadow: ${({ $bgImage }) => ($bgImage ? "none" : "0 3px 10px rgba(0, 0, 0, 0.45)")};
  filter: ${({ $dead }) => ($dead ? "grayscale(0.9) brightness(0.72)" : "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55))")};
`;

const LogoFallback = styled.span`
  color: var(--circle-logo-text);
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
`;

const Flag = styled.img`
  position: absolute;
  right: -7px;
  bottom: -5px;
  width: 16px;
  height: 12px;
  object-fit: cover;
  border: 1px solid var(--circle-text-1);
  background: #000;
`;

const KillBadge = styled.div<{ $x: number; $delay: number; $terminal: boolean }>`
  position: absolute;
  left: ${({ $x }) => `${$x}%`};
  top: ${({ $terminal }) => ($terminal ? "78%" : "50%")};
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 42px;
  padding: 2px 6px 2px 3px;
  background: var(--circle-badge-bg);
  color: var(--circle-badge-text);
  border: 1px solid var(--circle-grid-line);
  transform: translate(-50%, -50%) scale(0);
  animation: ${popNode} 180ms ease-out forwards;
  animation-delay: ${({ $delay }) => `${$delay}ms`};
`;

const IconWrap = styled.span`
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  color: var(--circle-accent);

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const KillCountText = styled.span`
  font-family: "Roboto Condensed", "Arial Narrow", sans-serif;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
`;

const BooyahReveal = styled.div<{ $x: number; $delay: number }>`
  position: absolute;
  left: ${({ $x }) => `${$x}%`};
  top: 50%;
  z-index: 7;
  transform: translate(-50%, -86%) scale(0);
  opacity: 0;
  animation: ${popNode} 240ms ease-out forwards;
  animation-delay: ${({ $delay }) => `${$delay}ms`};
`;

const BooyahAsset = styled.img`
  width: 112px;
  height: 70px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.7));
`;

const BooyahFallback = styled.div`
  padding: 2px 7px;
  background: var(--circle-accent);
  color: var(--circle-header-text);
  font-size: 10px;
  font-weight: 900;
  white-space: nowrap;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  min-width: 178px;
  height: 48px;
  margin-top: 22px;
  color: var(--circle-header-text);
`;

const FooterIcon = styled.span`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  background: var(--circle-badge-bg);
  color: var(--circle-text-2);
  clip-path: polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%, 14% 50%);

  svg {
    width: 30px;
    height: 30px;
  }
`;

const FooterLabel = styled.span`
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 28px 0 20px;
  background: var(--circle-accent);
  clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%, 10% 50%);
  font-size: 25px;
  font-style: italic;
  font-weight: 900;
`;

interface StreamPerformanceTimelineProps {
  circles?: number[];
  teams?: CircleAnalysisTeam[];
}

export const StreamPerformanceTimeline: React.FC<StreamPerformanceTimelineProps> = ({
  circles = [1, 2, 3, 4, 5, 6, 7, 8],
  teams = [],
}) => {
  const [displaySettings, setDisplaySettings] = React.useState(getBroadcastDisplaySettings);
  const [booyahAssetUrl, setBooyahAssetUrl] = React.useState("");

  React.useEffect(() => {
    const syncSettings = () => setDisplaySettings(getBroadcastDisplaySettings());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BROADCAST_DISPLAY_SETTINGS_KEY) syncSettings();
    };

    window.addEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    getTournamentAssetsApi()
      .then((assets) => {
        if (!isMounted) return;

        const booyahAsset = assets.find((asset) => {
          const assetId = getTournamentAssetId(asset);
          return assetId === "1";
        });

        setBooyahAssetUrl(getTournamentAssetUrl(booyahAsset));
      })
      .catch(() => {
        if (isMounted) setBooyahAssetUrl("");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCircles = circles.length ? circles.slice(0, 8) : [1, 2, 3, 4, 5, 6, 7, 8];
  const animationEnabled = displaySettings.circleAnalysisAnimationEnabled;
  const overlayColors = {
    "--circle-panel-bg": withOpacity(displaySettings.liveStandings2Color2, 0.88),
    "--circle-header-bg": displaySettings.liveStandings2Color1,
    "--circle-header-text": "#ffffff",
    "--circle-grid-line": withOpacity(displaySettings.liveStandings2Color1, 0.28),
    "--circle-row-line": withOpacity(displaySettings.liveStandings2Color1, 0.12),
    "--circle-line": displaySettings.liveStandings2TextColor2,
    "--circle-line-glow": withOpacity(displaySettings.liveStandings2TextColor2, 0.38),
    "--circle-accent": displaySettings.liveStandings2Color5,
    "--circle-elim": displaySettings.liveStandings2TextColor2,
    "--circle-elim-glow": withOpacity(displaySettings.liveStandings2TextColor2, 0.7),
    "--circle-text-1": displaySettings.liveStandings2TextColor1,
    "--circle-text-2": displaySettings.liveStandings2TextColor2,
    "--circle-badge-bg": displaySettings.liveStandings2Color2,
    "--circle-badge-text": displaySettings.liveStandings2TextColor2,
    "--circle-logo-bg": displaySettings.liveStandings2Color2,
    "--circle-logo-text": displaySettings.liveStandings2TextColor3,
    "--circle-muted-bg": withOpacity(displaySettings.liveStandings2Color2, 0.58),
  } as React.CSSProperties;

  const getCircleX = (circleNumber: number) => {
    const index = Math.max(1, Math.min(visibleCircles.length, circleNumber));
    return ((index - 0.5) / visibleCircles.length) * 100;
  };

  const pathFor = (circleNumber: number, rowIndex: number) => {
    const startX = 0;
    const x = getCircleX(circleNumber);
    const endX = Math.max(startX, x - 2.25);
    const bend = 0;
    const controlOne = startX + (endX - startX) * 0.38;
    const controlTwo = startX + (endX - startX) * 0.72;
    return `M ${startX} 50 C ${controlOne} ${50 + bend}, ${controlTwo} ${50 - bend}, ${endX} 50`;
  };

  return (
    <DashboardContainer style={overlayColors}>
      <TimelineHeaderGrid>
        {visibleCircles.map((num, index) => (
          <CircleHeader key={num} $index={index}>Circle {num}</CircleHeader>
        ))}
      </TimelineHeaderGrid>

      <TrackList>
        {animationEnabled && teams.slice(0, 12).map((team, rowIndex) => {
          const finishCircle = team.hasBooyah ? visibleCircles[visibleCircles.length - 1] : team.lastCircle;
          const clampedFinishCircle = Math.max(1, Math.min(visibleCircles.length, finishCircle));
          const startX = 0;
          const logoX = getCircleX(clampedFinishCircle);
          const rowDelay = 320;
          const travelDuration = 1300 + Math.max(1, clampedFinishCircle - 1) * 360;
          const pathLength = Math.max(1, logoX - startX);

          return (
            <TeamRow key={team.teamId}>
              <TrackSvg preserveAspectRatio="none" viewBox="0 0 100 100">
                <TrackPath
                  d={pathFor(clampedFinishCircle, rowIndex)}
                  $dead={team.isDead}
                  $delay={rowDelay}
                  $duration={travelDuration}
                  $pathLength={pathLength}
                />
              </TrackSvg>

              <LogoPoint
                $startX={startX}
                $x={logoX}
                $dead={team.isDead}
                $delay={rowDelay}
                $duration={travelDuration}
              >
                <LogoBox $dead={team.isDead} $bgImage={team.logoUrl}>
                  {!team.logoUrl && <LogoFallback>{team.shortLabel}</LogoFallback>}
                  {team.countryLogoUrl && <Flag src={team.countryLogoUrl} alt="Country flag" />}
                </LogoBox>
              </LogoPoint>

              {team.hasBooyah && (
                <BooyahReveal $x={logoX} $delay={rowDelay + travelDuration + 120}>
                  {booyahAssetUrl ? (
                    <BooyahAsset src={booyahAssetUrl} alt="Booyah" />
                  ) : (
                    <BooyahFallback>BOOYAH!</BooyahFallback>
                  )}
                </BooyahReveal>
              )}

              {visibleCircles.map((circleNum) => {
                const kills = team.killsPerCircle[circleNum];
                const hasKills = kills !== undefined && kills > 0;
                const isReachedCircle = circleNum <= clampedFinishCircle;
                const isTerminalCircle = circleNum === team.lastCircle && !team.hasBooyah;

                return (
                  isReachedCircle && hasKills && (
                    <KillBadge
                      key={circleNum}
                      $x={getCircleX(circleNum)}
                      $terminal={isTerminalCircle}
                      $delay={
                        rowDelay +
                        Math.round(
                          (getCircleX(circleNum) / Math.max(1, logoX)) *
                            travelDuration,
                        )
                      }
                    >
                      <IconWrap>
                        <CrosshairSvg />
                      </IconWrap>
                      <KillCountText>x{kills}</KillCountText>
                    </KillBadge>
                  )
                );
              })}
            </TeamRow>
          );
        })}
      </TrackList>

      <Footer>
        <FooterIcon>
          <CrosshairSvg />
        </FooterIcon>
        <FooterLabel>ELIMS</FooterLabel>
      </Footer>
    </DashboardContainer>
  );
};

export default StreamPerformanceTimeline;
