import React from 'react';
import styled, { keyframes } from 'styled-components';
import { CircleAnalysisTeam } from '../../types';

// ==========================================
// 1. LOCKED CONSTANT VELOCITY KEYFRAMES
// ==========================================

const constantVelocityGrow = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

const popNode = keyframes`
  0% { transform: translateY(-50%) scale(0); opacity: 0; }
  100% { transform: translateY(-50%) scale(1); opacity: 1; }
`;

// Clean popup for the Booyah badge once its calculated travel timer expires
const instantPopBooyah = keyframes`
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

// ==========================================
// 2. STYLED COMPONENTS
// ==========================================

const DashboardContainer = styled.div`
  background-color: var(--project-surface, #310062);
  padding: 24px;
  font-family: 'Montserrat', sans-serif;
  color: var(--project-text-primary, #fff);
  width: 100%;
  max-width: 1300px;
  margin: 20px auto;
  box-shadow: 0 24px 48px rgba(0,0,0,0.5);
  border-radius: 8px;
  position: relative;
`;

const GridBase = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
`;

const TimelineHeaderGrid = styled(GridBase)`
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 14px;
  margin-bottom: 24px;
  position: relative;
  z-index: 5;
`;

const CircleHeader = styled.div`
  background: var(--project-accent, #bfff00);
  color: var(--project-text-inverse, #000);
  text-align: center;
  font-weight: 900;
  font-style: italic;
  padding: 8px 0;
  font-size: 13px;
  text-transform: uppercase;
  border-right: 2px solid var(--project-background, #310062);
  &:last-child {
    border-right: none;
  }
`;

const TrackList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: relative;
  background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
  background-size: calc(100% / 8) 100%;
  background-position: 0 0;
`;

const TeamRow = styled(GridBase)`
  position: relative;
  align-items: center;
  height: 48px;
`;

interface SnakeContainerProps {
  endCircle: number;
  travelDuration: number;
}
const MovingSnakeTrack = styled.div<SnakeContainerProps>`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2; 
  display: flex;
  align-items: center;
  pointer-events: none;
  max-width: ${props => `calc(((100% / 8) * ${props.endCircle} - (100% / 16)))`};
  width: calc((100% / 8) * 8 - (100% / 16));
  
  /* Uses customized dynamic track speed based on distance */
  animation: ${constantVelocityGrow} ${props => props.travelDuration}s linear forwards;
`;

const TailLine = styled.div`
  flex-grow: 1;
  height: 2px;
  background-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
`;

const HeadStatusWrapper = styled.div`
  position: absolute;
  right: 0;
  transform: translateX(50%); 
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 4;
`;

const GridCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 100%;
  z-index: 10; 
`;

const MidTrackKillGroup = styled.div<{ delayIndex: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -7px;
  transform-origin: left center;
  background-color: var(--project-surface, #310062); 
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  
  animation: ${popNode} 0.2s linear both;
  /* Syncs intermediate node pop times with velocity track scale */
  animation-delay: ${props => `${(props.delayIndex - 0.5) * 2.5}s`};
`;

const TerminalKillGroup = styled(MidTrackKillGroup)`
  margin-top: 42px;
`;

const CircularTargetIcon = styled.div`
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background:
    linear-gradient(var(--project-danger, #d72b5f), var(--project-danger, #d72b5f)) center / 2px 10px no-repeat,
    linear-gradient(90deg, var(--project-danger, #d72b5f), var(--project-danger, #d72b5f)) center / 10px 2px no-repeat,
    radial-gradient(circle, rgba(255, 255, 255, 0.98) 0 2px, transparent 2.5px),
    var(--project-danger, #d72b5f);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 0 1px rgba(var(--project-danger-rgb, 215, 43, 95), 0.55), 0 2px 5px rgba(0,0,0,0.4);

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 2px;
    border: 1px solid rgba(255, 255, 255, 0.62);
    border-radius: 50%;
  }

  &::after {
    inset: -3px;
    border-color: rgba(var(--project-danger-rgb, 215, 43, 95), 0.38);
  }
`;

const KillCountText = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: var(--project-text-primary, #fff);
  
  span {
    color: var(--project-accent, #bfff00); 
    margin-right: 1px;
  }
`;

const TeamLogoBox = styled.div<{ bgImage?: string; isDead?: boolean }>`
  width: 36px;
  height: 36px;
  background-color: ${props => props.isDead ? 'var(--project-surface-alt, #3a1a4a)' : 'var(--project-background, #1a0033)'};
  background-image: ${props => props.bgImage ? `url(${props.bgImage})` : 'none'};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 6px;
  border: 2px solid ${props => props.isDead ? 'rgba(var(--project-danger-rgb, 255, 51, 51), 0.6)' : 'var(--project-accent, #bfff00)'};
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CountryFlag = styled.img`
  position: absolute;
  right: -9px;
  bottom: -7px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--project-text-primary, #fff);
  background: var(--project-background, #000);
`;

const LogoFallbackText = styled.span`
  font-size: 12px;
  font-weight: 900;
  color: var(--project-accent, #bfff00);
  letter-spacing: -0.5px;
`;

const LogoDeadOverlayCross = styled.div`
  position: absolute;
  top: -7px;
  left: -7px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background:
    linear-gradient(var(--project-danger, #d72b5f), var(--project-danger, #d72b5f)) center / 2px 14px no-repeat,
    linear-gradient(90deg, var(--project-danger, #d72b5f), var(--project-danger, #d72b5f)) center / 14px 2px no-repeat,
    radial-gradient(circle, rgba(255, 255, 255, 0.98) 0 2px, transparent 2.5px),
    var(--project-danger, #d72b5f);
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);

  &::before {
    content: '';
    position: absolute;
    border-radius: 50%;
    inset: 3px;
    border: 1px solid rgba(255, 255, 255, 0.68);
  }
`;

// --- FIX: BOOYAH APPEARS DYNAMICALLY ON THE EXACT FINISH FRAME ---
interface BooyahTagProps {
  revealDelay: number;
}
const BooyahTag = styled.div<BooyahTagProps>`
  position: absolute;
  top: -18px;
  background: linear-gradient(180deg, var(--project-warning, #ffb703) 0%, var(--project-primary, #fb8500) 100%);
  color: var(--project-text-primary, white);
  font-size: 8px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  border: 1px solid var(--project-text-primary, #fff);
  white-space: nowrap;
  
  /* Initial state is scale(0) so it's hidden during travel, popping up instantly on stop */
  transform: scale(0);
  animation: ${instantPopBooyah} 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  animation-delay: ${props => `${props.revealDelay}s`};
`;

// ==========================================
// 3. TEAM DATA INTERFACE
// ==========================================

interface StreamPerformanceTimelineProps {
  circles?: number[];
  teams?: CircleAnalysisTeam[];
}

export const StreamPerformanceTimeline: React.FC<StreamPerformanceTimelineProps> = ({
  circles = [1, 2, 3, 4, 5, 6, 7, 8],
  teams = [],
}) => {
  
  // Base constants establishing that 1 full column step interval takes 2.5 seconds
  const SECONDS_PER_COLUMN = 2.5; 
  const TOTAL_TRACKS_COUNT = 8;

  return (
    <DashboardContainer>
      <TimelineHeaderGrid>
        {circles.map(num => (
          <CircleHeader key={num}>Circle {num}</CircleHeader>
        ))}
      </TimelineHeaderGrid>

      <TrackList>
        {teams.map((team) => {
          const finishCircle = team.hasBooyah ? circles[circles.length - 1] : team.lastCircle;
          // Calculate the uniform time this specific row takes to reach its terminal cap point
          // Formula scales to the center line point of their target column layout position
          const structuralDestinationDuration = (finishCircle - 0.5) * SECONDS_PER_COLUMN;
          
          // Full map length reference duration remains locked for constant speed sync 
          const baseVelocityReferenceTime = TOTAL_TRACKS_COUNT * SECONDS_PER_COLUMN; // 20s

          return (
            <TeamRow key={team.teamId}>
              
              {/* 1. DYNAMICALLY SPEED-CONTROLLED PERFORMANCE SNAKE UNIT */}
              <MovingSnakeTrack 
                endCircle={finishCircle} 
                travelDuration={baseVelocityReferenceTime}
              >
                <TailLine />
                <HeadStatusWrapper>
                  {team.hasBooyah && (
                    <BooyahTag revealDelay={structuralDestinationDuration}>
                      BOOYAH!
                    </BooyahTag>
                  )}
                  
                  <TeamLogoBox isDead={team.isDead} bgImage={team.logoUrl}>
                    {!team.logoUrl && <LogoFallbackText>{team.shortLabel}</LogoFallbackText>}
                    {team.countryLogoUrl && <CountryFlag src={team.countryLogoUrl} alt="Country flag" />}
                    {team.isDead && <LogoDeadOverlayCross aria-label="Eliminated" />}
                  </TeamLogoBox>
                </HeadStatusWrapper>
              </MovingSnakeTrack>

              {/* 2. FOREGROUND INTERMEDIATE BADGES */}
              {circles.map((circleNum) => {
                const kills = team.killsPerCircle[circleNum];
                const hasKills = kills !== undefined && kills > 0;
                const isReachedCircle = circleNum <= finishCircle;
                const isTerminalCircle = circleNum === team.lastCircle && !team.hasBooyah;
                const KillBadge = isTerminalCircle ? TerminalKillGroup : MidTrackKillGroup;

                return (
                  <GridCell key={circleNum}>
                    {isReachedCircle && hasKills && (
                      <KillBadge delayIndex={circleNum}>
                        <CircularTargetIcon />
                        <KillCountText><span>x</span>{kills}</KillCountText>
                      </KillBadge>
                    )}
                  </GridCell>
                );
              })}

            </TeamRow>
          );
        })}
      </TrackList>
    </DashboardContainer>
  );
};

export default StreamPerformanceTimeline;
