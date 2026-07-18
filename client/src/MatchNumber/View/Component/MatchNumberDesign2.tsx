import React from "react";
import styled, { keyframes } from "styled-components";
import {
  GFF_LATIN_EXTRA_BOLD_FONT_FAMILY,
  LIVE_STANDINGS_FONT_FAMILY,
} from "../../../LiveStandingsTable/View/LiveStandingsFont";

type MatchNumberDesign2Props = {
  dayName: string;
  gameNumber: number | string;
  modeName: string;
  logoUrl?: string;
  color1: string;
  color2: string;
  color4: string;
  color5: string;
};

const PANEL_WIDTH = 296;
const PANEL_HEIGHT = 112;
const LOGO_WIDTH = 108;

const formatGameNumber = (value: number | string) => {
  const text = String(value ?? "").trim();
  return text || "-";
};

const withOpacity = (color: string, opacity: number) => {
  const normalized = color.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return color;

  const value = Number.parseInt(normalized, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
};

const logoPulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
`;

const MatchNumberDesign2: React.FC<MatchNumberDesign2Props> = ({
  dayName,
  gameNumber,
  modeName,
  logoUrl,
  color1,
  color2,
  color4,
  color5,
}) => (
  <Overlay>
    <LogoPanel $color={color5}>
      <LogoFrame>
        {logoUrl ? <Logo src={logoUrl} alt="Tournament logo" /> : <LogoFallback>LOGO</LogoFallback>}
      </LogoFrame>
    </LogoPanel>

    <InfoPanel>
      <HeaderStrip>{(dayName || "GRAND FINAL").toUpperCase()}</HeaderStrip>

      <MapPanel $color={color1} $accent={withOpacity(color4, 0.2)}>
        <MapGlow />
        <ContentStack>
          <MatchName>{`MATCH ${formatGameNumber(gameNumber)}`}</MatchName>
          <PhaseName>{(modeName || "CHAMPION RUSH").toUpperCase()}</PhaseName>
        </ContentStack>
      </MapPanel>
    </InfoPanel>
  </Overlay>
);

export default MatchNumberDesign2;

const Overlay = styled.div`
  position: fixed;
  right: 26px;
  bottom: 40px;
  display: flex;
  width: ${PANEL_WIDTH + 18}px;
  height: ${PANEL_HEIGHT}px;
  overflow: hidden;
  border: 1px solid #000000;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.38);
  font-family: ${LIVE_STANDINGS_FONT_FAMILY}, "Oswald", "Arial Narrow", sans-serif;
  text-transform: uppercase;
  z-index: 999;

  @media (min-width: 2560px) {
    right: 26px;
    bottom: 40px;
    transform: scale(1.96);
    transform-origin: right bottom;
  }
`;

const LogoPanel = styled.div<{ $color: string }>`
  position: relative;
  flex: 0 0 ${LOGO_WIDTH}px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: ${({ $color }) => $color};
`;

const LogoFrame = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 98px;
  height: 98px;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
`;

const Logo = styled.img`
  position: relative;
  z-index: 1;
  width: 94px;
  height: 94px;
  object-fit: contain;
  filter: none;
  animation: ${logoPulse} 2.4s ease-in-out infinite;
`;

const LogoFallback = styled.span`
  position: relative;
  z-index: 1;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const InfoPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const HeaderStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 31px;
  padding: 0 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
  color: #080808;
  font-family: ${LIVE_STANDINGS_FONT_FAMILY}, "Barlow Condensed", "Oswald", "Arial Narrow", sans-serif;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 1.25px;
  border-bottom: 1px solid #000000;
  white-space: nowrap;
  text-align: center;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
`;

const MapPanel = styled.div<{ $color: string; $accent: string }>`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    linear-gradient(180deg, ${({ $accent }) => $accent}, ${({ $accent }) => $accent}),
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent 40%),
    linear-gradient(180deg, rgba(11, 33, 43, 0.2), rgba(5, 17, 24, 0.35)),
    ${({ $color }) => $color};
`;

const ContentStack = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  padding: 0 10px;
`;

const MapGlow = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.14), transparent 28%),
    linear-gradient(115deg, transparent 55%, rgba(135, 244, 255, 0.26) 76%, transparent 88%);
  pointer-events: none;
`;

const MatchName = styled.div`
  position: relative;
  max-width: 100%;
  color: #ffffff;
  font-family: ${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}, ${LIVE_STANDINGS_FONT_FAMILY}, "Bebas Neue", "Teko", "Oswald", sans-serif;
  font-size: 39px;
  font-weight: 800;
  letter-spacing: 2.2px;
  line-height: 0.86;
  text-align: center;
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.18),
    0 6px 16px rgba(0, 0, 0, 0.34);
  white-space: nowrap;
`;

const PhaseName = styled.div`
  max-width: 100%;
  color: rgba(255, 255, 255, 0.96);
  font-family: ${LIVE_STANDINGS_FONT_FAMILY}, "Barlow Condensed", "Oswald", "Arial Narrow", sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1.4px;
  line-height: 1;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
`;
