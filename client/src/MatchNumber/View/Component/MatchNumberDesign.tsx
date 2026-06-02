import React from "react";
import styled from "styled-components";

// --- STYLED COMPONENTS ---

const OverlayContainer = styled.div`
  /* Position fixed to lock it to the bottom-right corner of the stream canvas */
  position: absolute;
  bottom: 40px;  /* Distance from the bottom edge */
  right: 40px;   /* Distance from the right edge */
  
  display: flex;
  align-items: stretch;
  font-family: "Montserrat", "Arial Black", sans-serif;
  font-style: italic;
  font-weight: 900;
  text-transform: uppercase;
  user-select: none;
  filter: drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.4));
  z-index: 999; /* Ensures it stays on top of video feeds */
`;

// Left branding panel (Black/Charcoal with right slant)
const BrandPanel = styled.div`
  background: linear-gradient(135deg, var(--project-surface, #151515) 0%, #0d0d0d 100%);
  padding: 20px 40px 20px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
  margin-right: -40px; /* Overlaps with the main panel */
  z-index: 2;
  border-left: 4px solid var(--project-accent, #ffcc00); /* Subtle accent line */
`;

const PlaceholderLogo = styled.div`
  width: 104px;
  height: 104px;
  background: var(--project-accent, #ffcc00);
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--project-background, #000);
  font-size: 11px;
  font-weight: bold;
  text-align: center;
`;

const TournamentLogo = styled.img`
  width: 124px;
  height: 106px;
  object-fit: contain;
  transform: scale(1.28);
  transform-origin: center;
`;

// Right info panel (Purple texture)
const InfoPanel = styled.div`
  background: linear-gradient(90deg, var(--project-primary, #4b0082) 0%, var(--project-surface, #3a0066) 100%);
  padding: 15px 50px 15px 60px; /* Left padding accommodates the overlap */
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%);
  z-index: 1;
`;

// Dynamic top tag (e.g., GRAND FINALS)
const HeaderTag = styled.div`
  background-color: var(--project-text-primary, #ffffff);
  color: #000000;
  padding: 4px 16px;
  font-size: 14px;
  letter-spacing: 1px;
  width: fit-content;
  transform: skewX(-12deg);

  span {
    display: inline-block;
    transform: skewX(12deg); /* Un-skew text so it stays readable */
  }
`;

// Main Game Number display
const GameText = styled.h1`
  font-size: 48px;
  margin: 0;
  line-height: 1;
  color: var(--project-accent, #bfff00) !important;
  text-shadow: 0px 4px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
`;

// Bottom tag (Fixed or dynamic secondary info)
const SubTag = styled.div`
  background-color: var(--project-text-primary, #ffffff);
  color: #000000;
  padding: 4px 12px;
  font-size: 12px;
  letter-spacing: 0.5px;
  width: fit-content;
  transform: skewX(-12deg);

  span {
    display: inline-block;
    transform: skewX(12deg);
  }
`;

// --- INTERFACE PROPS ---

interface MatchOverlayProps {
  dayName: string; // e.g., "GRAND FINALS" or "DAY 1"
  gameNumber: number | string; // e.g., 2 or "02"
  modeName: string;
  logoUrl?: string;
}

// --- MAIN COMPONENT ---

export const MatchOverlay: React.FC<MatchOverlayProps> = ({
  dayName,
  gameNumber,
  modeName,
  logoUrl,
}) => {
  return (
    <OverlayContainer>
      <BrandPanel>
        {logoUrl ? <TournamentLogo src={logoUrl} alt="Tournament logo" /> : <PlaceholderLogo>LOGO</PlaceholderLogo>}
      </BrandPanel>

      <InfoPanel>
        <HeaderTag>
          <span>{dayName}</span>
        </HeaderTag>

        <GameText>GAME {gameNumber}</GameText>

        <SubTag>
          <span>{modeName}</span>
        </SubTag>
      </InfoPanel>
    </OverlayContainer>
  );
};

export default MatchOverlay;
