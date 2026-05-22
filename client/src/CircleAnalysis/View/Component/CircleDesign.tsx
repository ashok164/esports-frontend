import React from 'react';
import styled, { keyframes } from 'styled-components';

// ==========================================
// 1. LOCKED CONSTANT VELOCITY KEYFRAMES
// ==========================================

const constantVelocityGrow = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

const popNode = keyframes`
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
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
  background-color: #310062; 
  padding: 24px;
  font-family: 'Montserrat', sans-serif;
  color: #fff;
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
  background: #bfff00; 
  color: #000;
  text-align: center;
  font-weight: 900;
  font-style: italic;
  padding: 8px 0;
  font-size: 13px;
  text-transform: uppercase;
  border-right: 2px solid #310062;
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
  position: relative;
  background-color: #310062; 
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  
  animation: ${popNode} 0.2s linear both;
  /* Syncs intermediate node pop times with velocity track scale */
  animation-delay: ${props => `${(props.delayIndex - 0.5) * 2.5}s`};
`;

const CircularTargetIcon = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid #bfff00; 
  background-color: #310062;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    width: 4px;
    height: 4px;
    background-color: #fff;
    border-radius: 50%;
  }
`;

const KillCountText = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  
  span {
    color: #bfff00; 
    margin-right: 1px;
  }
`;

const TeamLogoBox = styled.div<{ bgImage?: string; isDead?: boolean }>`
  width: 36px;
  height: 36px;
  background-color: ${props => props.isDead ? '#3a1a4a' : '#1a0033'};
  background-image: ${props => props.bgImage ? `url(${props.bgImage})` : 'none'};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 6px;
  border: 2px solid ${props => props.isDead ? 'rgba(255, 51, 51, 0.6)' : '#bfff00'};
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoFallbackText = styled.span`
  font-size: 12px;
  font-weight: 900;
  color: #bfff00;
  letter-spacing: -0.5px;
`;

const LogoDeadOverlayCross = styled.div`
  position: absolute;
  top: -4px;
  left: -4px;
  background: #ff3333;
  color: white;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
`;

// --- FIX: BOOYAH APPEARS DYNAMICALLY ON THE EXACT FINISH FRAME ---
interface BooyahTagProps {
  revealDelay: number;
}
const BooyahTag = styled.div<BooyahTagProps>`
  position: absolute;
  top: -18px;
  background: linear-gradient(180deg, #ffb703 0%, #fb8500 100%);
  color: white;
  font-size: 8px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  border: 1px solid #fff;
  white-space: nowrap;
  
  /* Initial state is scale(0) so it's hidden during travel, popping up instantly on stop */
  transform: scale(0);
  animation: ${instantPopBooyah} 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  animation-delay: ${props => `${props.revealDelay}s`};
`;

// ==========================================
// 3. TEAM DATA INTERFACE
// ==========================================

interface TeamMatchData {
  teamId: string;
  teamName: string;
  shortLabel: string;
  logoUrl: string;
  isDead: boolean;
  hasBooyah: boolean;
  lastCircle: number;
  killsPerCircle: { [circleKey: number]: number };
}

const MOCK_12_TEAMS_DATA: TeamMatchData[] = [
  { teamId: "t1", teamName: "Team 1", shortLabel: "T1", logoUrl: "", isDead: false, hasBooyah: true, lastCircle: 6, killsPerCircle: { 1: 5, 2: 2, 3: 2, 4: 3, 5: 6, 6: 4 } },
  { teamId: "t2", teamName: "Team 2", shortLabel: "T2", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 6, killsPerCircle: { 1: 3, 2: 1, 3: 2, 4: 4, 5: 4 } },
  { teamId: "t3", teamName: "Team 3", shortLabel: "T3", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 5, killsPerCircle: { 1: 9, 3: 2, 5: 1 } },
  { teamId: "t4", teamName: "Team 4", shortLabel: "T4", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 5, killsPerCircle: { 1: 4, 2: 3, 5: 1 } },
  { teamId: "t5", teamName: "Team 5", shortLabel: "T5", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 5, killsPerCircle: { 1: 6, 2: 1, 4: 2 } },
  { teamId: "t6", teamName: "Team 6", shortLabel: "T6", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 5, killsPerCircle: { 1: 5, 4: 1 } },
  { teamId: "t7", teamName: "Team 7", shortLabel: "T7", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 4, killsPerCircle: { 1: 8, 2: 3 } },
  { teamId: "t8", teamName: "Team 8", shortLabel: "T8", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 4, killsPerCircle: { 1: 6 } },
  { teamId: "t9", teamName: "Team 9", shortLabel: "T9", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 4, killsPerCircle: { 1: 8, 2: 1 } },
  { teamId: "t10", teamName: "Team 10", shortLabel: "T10", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 2, killsPerCircle: { 1: 4 } },
  { teamId: "t11", teamName: "Team 11", shortLabel: "T11", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 1, killsPerCircle: { 1: 3 } },
  { teamId: "t12", teamName: "Team 12", shortLabel: "T12", logoUrl: "", isDead: true, hasBooyah: false, lastCircle: 1, killsPerCircle: { 1: 1 } }
];

export const StreamPerformanceTimeline: React.FC = () => {
  const circles = [1, 2, 3, 4, 5, 6, 7, 8];
  
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
        {MOCK_12_TEAMS_DATA.map((team) => {
          // Calculate the uniform time this specific row takes to reach its terminal cap point
          // Formula scales to the center line point of their target column layout position
          const structuralDestinationDuration = (team.lastCircle - 0.5) * SECONDS_PER_COLUMN;
          
          // Full map length reference duration remains locked for constant speed sync 
          const baseVelocityReferenceTime = TOTAL_TRACKS_COUNT * SECONDS_PER_COLUMN; // 20s

          return (
            <TeamRow key={team.teamId}>
              
              {/* 1. DYNAMICALLY SPEED-CONTROLLED PERFORMANCE SNAKE UNIT */}
              <MovingSnakeTrack 
                endCircle={team.lastCircle} 
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
                    {team.isDead && <LogoDeadOverlayCross>×</LogoDeadOverlayCross>}
                  </TeamLogoBox>
                </HeadStatusWrapper>
              </MovingSnakeTrack>

              {/* 2. FOREGROUND INTERMEDIATE BADGES */}
              {circles.map((circleNum) => {
                const kills = team.killsPerCircle[circleNum];
                const hasKills = kills !== undefined && kills > 0;
                const isIntermediateCircle = circleNum < team.lastCircle;

                return (
                  <GridCell key={circleNum}>
                    {isIntermediateCircle && hasKills && (
                      <MidTrackKillGroup delayIndex={circleNum}>
                        <CircularTargetIcon />
                        <KillCountText><span>x</span>{kills}</KillCountText>
                      </MidTrackKillGroup>
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