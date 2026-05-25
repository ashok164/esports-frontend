import React from "react";
import styled, { keyframes } from "styled-components";

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

export interface Player {
  avatarUrl?: string;
  playerPic?: string;
  photoUrl?: string;
  player_image?: string;
  player_pic?: string;
  name?: string;
}

export interface TeamNotificationData {
  name: string;
  logoUrl?: string;
  countryFlag?: string;
  countryUrl?: string;
  rank: number;
  players?: Player[];
}

interface TeamNotificationCardProps {
  team?: TeamNotificationData;
}

/* ==========================================================================
   1. KEYFRAME ANIMATIONS
   ========================================================================== */

const slamDown = keyframes`
  0% {
    transform: translateX(-50%) skewX(-12deg) translateY(-100px);
    opacity: 0;
  }
  60% {
    transform: translateX(-50%) skewX(-12deg) translateY(10px);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) skewX(-12deg) translateY(0);
  }
`;

const slideInLeft = keyframes`
  0% {
    transform: skewX(-12deg) translateX(-100px);
    opacity: 0;
  }
  100% {
    transform: skewX(-12deg) translateX(0);
    opacity: 1;
  }
`;

const riseUp = keyframes`
  0% {
    transform: translateX(-50%) translateY(150px);
    opacity: 0;
  }
  70% {
    transform: translateX(-50%) translateY(-10px);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
`;

const bannerArrival = keyframes`
  0% {
    transform: translateX(-50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

/* ==========================================================================
   2. STYLED COMPONENTS
   ========================================================================== */

const ScreenContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background: transparent;
  overflow: hidden;
`;

const CardWrapper = styled.div`
  position: relative;
  width: 600px;
  height: 350px;
  font-family: "Arial Black", Gadget, sans-serif;
  overflow: hidden;
  background: transparent;
`;

const RankBadge = styled.div`
  position: absolute;
  top: 20px;
  left: 60px;
  background-color: var(--project-primary, #ff003c);
  color: var(--project-text-primary, #ffffff);
  padding: 6px 24px;
  font-size: 24px;
  font-weight: 900;
  transform: skewX(-12deg);
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
  z-index: 10;

  animation: ${slideInLeft} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  animation-delay: 0.2s;
  opacity: 0;
`;

const RedEliminatedGeometry = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%) skewX(-12deg);
  width: 500px;
  height: 240px;
  background: linear-gradient(135deg, rgba(var(--project-primary-rgb, 122, 9, 26), 0.72) 0%, var(--project-surface, #3a0209) 100%);
  border: 4px solid var(--project-primary, #ff003c);
  z-index: 1;

  animation: ${slamDown} 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;

  &::before {
    content: "";
    position: absolute;
    bottom: 0px;
    right: 0px;
    width: 120px;
    height: 100%;
    background: var(--project-surface, #111116);
    opacity: 0.4;
    transform: skewX(5deg);
  }
`;

const PlayersContainer = styled.div`
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: -10px;
  width: 480px;
  height: 220px;
  z-index: 2;

  animation: ${riseUp} 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
  animation-delay: 0.3s;
  opacity: 0;
`;

const PlayerPhoto = styled.img`
  width: 125px;
  height: auto;
  object-fit: contain;
  filter: grayscale(100%) brightness(0.7) contrast(1.2);
  transition: filter 0.3s ease, transform 0.3s ease;

  &:hover {
    filter: grayscale(30%) brightness(1);
    transform: scale(1.05) translateY(-5px);
    z-index: 5;
  }
`;

const BannerRow = styled.div`
  position: absolute;
  bottom: 15px;
  left: 30px;
  display: flex;
  align-items: flex-end;
  z-index: 3;

  animation: ${bannerArrival} 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.6s;
  opacity: 0;
`;

const LogoBlock = styled.div`
  background-color: var(--project-surface, #111116);
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  border-bottom: 4px solid var(--project-primary, #ff003c);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.6);
  transform: skewX(-12deg);
  margin-right: -10px;
  z-index: 4;
`;

const CountryFlag = styled.img`
  width: 20px;
  height: 12px;
  align-self: flex-start;
  margin-bottom: 8px;
  transform: skewX(12deg);
  object-fit: cover;
`;

const TeamLogo = styled.img`
  width: 55px;
  height: 55px;
  object-fit: contain;
  transform: skewX(12deg);
`;

const EliminatedBanner = styled.div`
  background: linear-gradient(90deg, var(--project-primary, #ff003c) 0%, var(--project-danger, #b30024) 100%);
  padding: 12px 60px 12px 40px;
  transform: skewX(-12deg);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5);
  border-left: 2px solid var(--project-text-primary, #ffffff);
`;

const EliminatedText = styled.h1`
  margin: 0;
  font-size: 36px;
  font-weight: 900;
  color: var(--project-text-primary, #ffffff);
  text-transform: uppercase;
  font-style: italic;
  letter-spacing: 2px;
  line-height: 1;
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.6),
    0 0 20px rgba(255, 0, 60, 0.8);
`;

/* ==========================================================================
   3. MAIN COMPONENT
   ========================================================================== */

const TeamNotificationCard: React.FC<TeamNotificationCardProps> = ({ team }) => {
  const standardFallbackPhoto = "https://i.ibb.co/6wX88Ym/p1.png";
  const visualSlots = Array.from({ length: 4 }, (_, i) => {
    const player = team?.players?.[i];

    return (
      player?.playerPic ||
      player?.avatarUrl ||
      player?.photoUrl ||
      player?.player_image ||
      player?.player_pic ||
      standardFallbackPhoto
    );
  });

  const formatRank = (rankNum?: number) => {
    if (rankNum === undefined || rankNum === null) return "#--";
    return `#${String(rankNum).padStart(2, "0")}`;
  };

  return (
    <ScreenContainer>
      <CardWrapper>
        <RankBadge>{formatRank(team?.rank)}</RankBadge>

        <RedEliminatedGeometry />

        <PlayersContainer>
          {visualSlots.map((src, index) => (
            <PlayerPhoto 
              key={index} 
              src={src} 
              alt={team?.players?.[index]?.name || `Teammate ${index + 1}`} 
            />
          ))}
        </PlayersContainer>

        {/* Dynamic Bottom Branding & Status Banner */}
        <BannerRow>
          <LogoBlock>
            <CountryFlag
              src={team?.countryFlag || team?.countryUrl || "https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg"}
              alt="Country Flag"
            />
            <TeamLogo
              src={team?.logoUrl || "https://i.postimg.co/g0g6Xv3S/green-x-logo.png"}
              alt={`${team?.name || "Team"} Logo`}
            />
          </LogoBlock>

          <EliminatedBanner>
            <EliminatedText>ELIMINATED</EliminatedText>
          </EliminatedBanner>
        </BannerRow>
      </CardWrapper>
    </ScreenContainer>
  );
};

export default TeamNotificationCard;
