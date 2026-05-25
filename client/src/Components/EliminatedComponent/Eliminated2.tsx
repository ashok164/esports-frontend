import React from "react";
import styled, { keyframes } from "styled-components";

// --- KEYFRAME ANIMATIONS ---

const slamDown = keyframes`
  0% {
    transform: translateX(-50%) skewX(-8deg) translateY(-100px);
    opacity: 0;
  }
  60% {
    transform: translateX(-50%) skewX(-8deg) translateY(10px);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) skewX(-8deg) translateY(0);
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

const pulseOverlay = keyframes`
  0% { opacity: 0; }
  50% { opacity: 0.5; }
  100% { opacity: 0.3; }
`;

// --- STYLED COMPONENTS ---

// NEW: Fullscreen flex container that centers the card on the screen
const ScreenContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const CardWrapper = styled.div`
  position: relative;
  width: 600px;
  height: 350px;
  font-family: 'Arial Black', Gadget, sans-serif;
  overflow: hidden;
`;

const EnvironmentOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 40%
  );
  pointer-events: none;
  animation: ${pulseOverlay} 1s ease-out forwards;
`;

const RankBadge = styled.div`
  position: absolute;
  top: 20px;
  left: 60px;
  background-color: var(--project-accent, #bfff00);
  color: var(--project-background, #000);
  padding: 6px 24px;
  font-size: 24px;
  font-weight: 900;
  transform: skewX(-12deg);
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.2);
  z-index: 10;
  
  animation: ${slideInLeft} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  animation-delay: 0.2s;
  opacity: 0;
`;

const PurpleGeometry = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%) skewX(-8deg);
  width: 500px;
  height: 240px;
  background: linear-gradient(135deg, var(--project-primary, #4a159d) 0%, var(--project-surface, #2a085c) 100%);
  border: 4px solid var(--project-secondary, #7c3aed);
  z-index: 1;

  animation: ${slamDown} 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;

  &::before {
    content: "";
    position: absolute;
    bottom: 20px;
    left: -20px;
    width: 250px;
    height: 80px;
    background: var(--project-warning, #ff5500);
    transform: skewX(15deg) rotate(-5deg);
    opacity: 0.8;
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
  filter: grayscale(100%) brightness(0.9) contrast(1.1);
  transition: filter 0.3s ease, transform 0.3s ease;

  &:hover {
    filter: grayscale(20%) brightness(1);
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
  border-radius: 4px;
  border-bottom: 4px solid var(--project-success, #00ff66);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5);
  transform: skewX(-5deg);
  margin-right: -10px;
  z-index: 4;
`;

const CountryFlag = styled.img`
  width: 20px;
  height: 12px;
  align-self: flex-start;
  margin-bottom: 8px;
`;

const TeamLogo = styled.img`
  width: 55px;
  height: 55px;
  object-fit: contain;
`;

const EliminatedBanner = styled.div`
  background-color: var(--project-accent, #cbff14);
  padding: 12px 60px 12px 40px;
  transform: skewX(-8deg);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.4);
`;

const EliminatedText = styled.h1`
  margin: 0;
  font-size: 38px;
  font-weight: 900;
  color: var(--project-background, #3b0082);
  text-transform: uppercase;
  font-style: italic;
  letter-spacing: 1px;
  line-height: 1;
`;

// --- MAIN COMPONENT ---
const TeamNotificationCard = () => {
  const players = [
    "https://i.ibb.co/6wX88Ym/p1.png",
    "https://i.ibb.co/6wX88Ym/p1.png",
    "https://i.ibb.co/6wX88Ym/p1.png",
    "https://i.ibb.co/6wX88Ym/p1.png",
  ];

  return (
    <ScreenContainer>
      <CardWrapper>
        <EnvironmentOverlay />

        {/* Placement Rank */}
        <RankBadge>#7</RankBadge>

        {/* Purple background shape */}
        <PurpleGeometry />

        {/* Row of desaturated players */}
        <PlayersContainer>
          {players?.map((src, index) => (
            <PlayerPhoto key={index} src={src} alt={`Player ${index + 1}`} />
          ))}
        </PlayersContainer>

        {/* Bottom Branding & Status */}
        <BannerRow>
          <LogoBlock>
            <CountryFlag
              src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg"
              alt="BD Flag"
            />
            <TeamLogo
              src="https://i.postimg.co/g0g6Xv3S/green-x-logo.png"
              alt="Team Logo"
            />
          </LogoBlock>

          <EliminatedBanner>
            <EliminatedText>Eliminated</EliminatedText>
          </EliminatedBanner>
        </BannerRow>
      </CardWrapper>
    </ScreenContainer>
  );
};

export default TeamNotificationCard;
