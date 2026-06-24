import React from "react";
import styled, { keyframes } from "styled-components";

type TeamNotificationData = {
  name?: string;
  logoUrl?: string;
  rank?: number;
  eliminatedNumber?: number;
  kills?: number;
  totalPoints?: number;
  rankingScore?: number;
  placementPoints?: number;
  teamTag?: string;
  shortName?: string;
  tag?: string;
};

type Eliminated3Props = {
  team?: TeamNotificationData;
  tournamentName?: string;
  color1: string;
  color2: string;
  color5: string;
  textColor1: string;
  textColor3: string;
  textColor4: string;
};

const WIDTH = 900;
const STYLE3_BORDER_RED = "#ff1010";
const enter = keyframes`
  0% {
    transform: translateY(-18px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const paintSwipe = keyframes`
  0% {
    transform: translateX(-118%) skewX(-16deg);
  }
  60% {
    transform: translateX(-6%) skewX(-16deg);
  }
  100% {
    transform: translateX(118%) skewX(-16deg);
  }
`;

const contentReveal = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const getTeamLabel = (team?: TeamNotificationData) =>
  team?.teamTag || team?.shortName || team?.tag || team?.name || "TEAM";

const getPlacement = (team?: TeamNotificationData) =>
  Math.max(1, Number(team?.eliminatedNumber ?? team?.rank ?? 1));

const getPlacementPoints = (team?: TeamNotificationData) =>
  Math.max(0, Number(team?.placementPoints ?? 0));

const getTotalPoints = (team?: TeamNotificationData) =>
  Math.max(0, Number(team?.totalPoints ?? team?.rankingScore ?? 0));

const Eliminated3: React.FC<Eliminated3Props> = ({
  team,
  textColor3,
  textColor4,
}) => {
  const placement = getPlacement(team);
  const kills = Math.max(0, Number(team?.kills ?? 0));
  const placementPoints = getPlacementPoints(team);
  const totalPoints = getTotalPoints(team);

  return (
    <Overlay>
      <Wrapper>
        <MainBanner $border={STYLE3_BORDER_RED}>
          <PaintSwipeLayer>
            <PaintCore />
            <PaintEdge />
            <PaintChunk $top="14px" $left="42px" $width="168px" $height="38px" $rotate="-8deg" />
            <PaintChunk $top="48px" $left="180px" $width="244px" $height="30px" $rotate="4deg" />
            <PaintChunk $top="98px" $left="132px" $width="310px" $height="34px" $rotate="-5deg" />
            <PaintChunk $top="40px" $left="470px" $width="198px" $height="42px" $rotate="-11deg" />
            <PaintChunk $top="104px" $left="548px" $width="252px" $height="28px" $rotate="7deg" />
            <PaintDrip $top="34px" $left="250px" $height="56px" />
            <PaintDrip $top="86px" $left="610px" $height="46px" />
            <PaintDrip $top="58px" $left="736px" $height="52px" />
          </PaintSwipeLayer>

          <ContentLayer>
          <LogoZone $background={STYLE3_BORDER_RED}>
            <LogoGlow />
            {team?.logoUrl ? <TeamLogo src={team.logoUrl} alt={getTeamLabel(team)} /> : <LogoFallback>{getTeamLabel(team)}</LogoFallback>}
          </LogoZone>

          <TextZone>
            <TeamName>{getTeamLabel(team)}</TeamName>
            <EliminatedTitle $color={textColor3}>ELIMINATED</EliminatedTitle>
          </TextZone>

          <StatsZone>
            <RankBox $background={STYLE3_BORDER_RED}>{`RANK #${String(placement).padStart(2, "0")}`}</RankBox>
            <StatsTable $border={STYLE3_BORDER_RED}>
              <StatRow $border={STYLE3_BORDER_RED}>
                <span>Total Kills</span>
                <StatValue $color={textColor3}>{kills}</StatValue>
              </StatRow>
              <StatRow $border={STYLE3_BORDER_RED}>
                <span>Placing Points</span>
                <StatValue $color={textColor3}>{placementPoints}</StatValue>
              </StatRow>
              <StatRow $border={STYLE3_BORDER_RED}>
                <span>Total Points</span>
                <StatValue $color={textColor3}>{totalPoints}</StatValue>
              </StatRow>
            </StatsTable>
          </StatsZone>
          </ContentLayer>
        </MainBanner>

        <BottomTicker $background={STYLE3_BORDER_RED} $color={textColor4}>
          {`ELIMINATION | ${getTeamLabel(team)}`}
        </BottomTicker>
      </Wrapper>
    </Overlay>
  );
};

export default Eliminated3;

const Overlay = styled.div`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: ${WIDTH}px;
  height: 240px;
  z-index: 9999;
  pointer-events: none;

  @media (min-width: 2560px) {
    top: 16px;
    transform: translateX(-50%) scale(1.96);
    transform-origin: center top;
  }
`;

const Wrapper = styled.div`
  width: ${WIDTH}px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${enter} 260ms ease-out both;
`;

const MainBanner = styled.div<{ $border: string }>`
  width: 100%;
  height: 188px;
  background: #12161a;
  border: none;
  box-shadow:
    inset 0 0 0 3px ${({ $border }) => $border},
    0 10px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 28px;
    height: 22px;
    border-top: 4px solid ${({ $border }) => $border};
    border-right: 4px solid ${({ $border }) => $border};
  }
`;

const PaintSwipeLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  animation: ${paintSwipe} 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const PaintCore = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 16, 16, 0) 0%, rgba(255, 24, 24, 0.18) 8%, rgba(255, 24, 24, 0.96) 18%, rgba(255, 0, 0, 1) 40%, rgba(180, 0, 0, 0.95) 64%, rgba(255, 40, 40, 0.36) 82%, rgba(255, 16, 16, 0) 100%);
  filter: saturate(1.08);
  opacity: 0.9;
`;

const PaintEdge = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  width: 180px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), transparent 26%),
    linear-gradient(180deg, rgba(255, 48, 48, 0.98), rgba(160, 0, 0, 0.96));
  clip-path: polygon(0 0, 88% 0, 100% 18%, 92% 34%, 100% 52%, 90% 68%, 100% 86%, 84% 100%, 0 100%);
  opacity: 0.96;
`;

const PaintChunk = styled.div<{
  $top: string;
  $left: string;
  $width: string;
  $height: string;
  $rotate: string;
}>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.06) 22%, rgba(90, 0, 0, 0.12) 100%),
    linear-gradient(180deg, rgba(255, 52, 52, 0.98), rgba(186, 0, 0, 0.98));
  clip-path: polygon(0 16%, 10% 0, 88% 0, 100% 22%, 96% 50%, 100% 82%, 88% 100%, 10% 100%, 0 76%, 4% 48%);
  transform: rotate(${({ $rotate }) => $rotate}) skewX(-14deg);
  opacity: 0.94;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    background: inherit;
  }

  &::before {
    left: -20px;
    width: 34px;
    clip-path: polygon(100% 0, 100% 100%, 0 72%, 10px 0);
  }

  &::after {
    right: -18px;
    width: 46px;
    clip-path: polygon(0 0, 100% 26%, calc(100% - 16px) 100%, 0 100%);
  }
`;

const PaintDrip = styled.div<{
  $top: string;
  $left: string;
  $height: string;
}>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: 16px;
  height: ${({ $height }) => $height};
  background: linear-gradient(180deg, rgba(255, 48, 48, 0.94), rgba(150, 0, 0, 0.95));
  border-radius: 12px;
  opacity: 0.88;
  filter: blur(0.2px);

  &::after {
    content: "";
    position: absolute;
    left: -5px;
    bottom: -10px;
    width: 26px;
    height: 20px;
    background: inherit;
    border-radius: 50%;
  }
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  animation: ${contentReveal} 360ms ease-out 180ms both;
`;

const LogoZone = styled.div<{ $background: string }>`
  width: 22%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, ${({ $background }) => $background} 0%, ${({ $background }) => $background} 76%, rgba(0, 0, 0, 0.14) 100%);
  box-shadow:
    inset -3px 0 0 ${({ $background }) => $background},
    5px 0 15px rgba(0, 0, 0, 0.5);
`;

const LogoGlow = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%);
`;

const TeamLogo = styled.img`
  width: 122px;
  height: 122px;
  z-index: 2;
  object-fit: contain;
  filter: drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.6));
`;

const LogoFallback = styled.div`
  z-index: 2;
  padding: 0 18px;
  color: #ffffff;
  font-family: "Oswald", sans-serif;
  font-size: 24px;
  font-weight: 900;
  text-align: center;
  line-height: 1;
  text-transform: uppercase;
`;

const TextZone = styled.div`
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 22px 0 26px;
  z-index: 1;
`;

const EliminatedTitle = styled.div<{ $color: string }>`
  font-family: "Oswald", sans-serif;
  font-size: 62px;
  font-weight: 900;
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  letter-spacing: -1px;
  line-height: 0.96;
  text-shadow: 0px 0px 12px rgba(0, 0, 0, 0.12);
  max-width: 100%;
  white-space: nowrap;
`;

const TeamName = styled.div`
  font-family: "Oswald", sans-serif;
  font-size: 24px;
  color: #ffffff;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 10px;
  line-height: 1;
`;

const StatsZone = styled.div`
  width: 28%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px 14px 12px 0;
`;

const RankBox = styled.div<{ $background: string }>`
  background: linear-gradient(180deg, ${({ $background }) => $background} 0%, ${({ $background }) => $background} 100%);
  color: #ffffff;
  text-align: center;
  font-family: "Oswald", sans-serif;
  font-size: 24px;
  font-weight: 700;
  padding: 6px 0;
  text-transform: uppercase;
  border: none;
  box-shadow:
    inset 0 2px 0 ${({ $background }) => $background},
    inset 2px 0 0 ${({ $background }) => $background},
    inset -2px 0 0 ${({ $background }) => $background};
  border-radius: 4px 4px 0 0;
  letter-spacing: 1px;
`;

const StatsTable = styled.div<{ $border: string }>`
  background-color: #ffffff;
  border-radius: 0 0 4px 4px;
  border: none;
  box-shadow:
    inset 2px 0 0 ${({ $border }) => $border},
    inset -2px 0 0 ${({ $border }) => $border},
    inset 0 -2px 0 ${({ $border }) => $border};
  overflow: hidden;
`;

const StatRow = styled.div<{ $border: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  border-bottom: 1px solid ${({ $border }) => $border};
  color: #111;
  font-family: "Oswald", sans-serif;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;

  &:last-child {
    border-bottom: none;
  }
`;

const StatValue = styled.span<{ $color: string }>`
  font-family: "Oswald", sans-serif;
  font-size: 20px;
  font-weight: 900;
  color: ${({ $color }) => $color};
`;

const BottomTicker = styled.div<{ $background: string; $color: string }>`
  min-width: 360px;
  margin-top: -2px;
  padding: 5px 34px;
  background: linear-gradient(90deg, transparent 0%, ${({ $background }) => $background} 15%, ${({ $background }) => $background} 85%, transparent 100%);
  box-shadow: inset 0 -2px 0 ${({ $background }) => $background};
  color: ${({ $color }) => $color};
  font-family: "Oswald", sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
`;
