import React from "react";
import styled from "styled-components";

type MatchNumberDesign3Props = {
  dayName: string;
  gameNumber: number | string;
  modeName: string;
  logoUrl?: string;
  color1: string;
  color2: string;
  color5: string;
  textColor3: string;
  textColor4: string;
};

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 96;
const CARD_BOTTOM = 40;
const LOGO_WIDTH = 102;

const formatValue = (value: number | string | undefined, fallback: string) => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const MatchNumberDesign3: React.FC<MatchNumberDesign3Props> = ({
  dayName,
  gameNumber,
  modeName,
  logoUrl,
  color1,
  color2,
  color5,
  textColor3,
  textColor4,
}) => (
  <Overlay>
    <BadgeWrapper $color={color1}>
      <LogoPanel $color={color5}>
        <LogoMask>
          {logoUrl ? <Logo src={logoUrl} alt="Tournament logo" /> : <LogoFallback>LOGO</LogoFallback>}
          <LogoShine />
        </LogoMask>
      </LogoPanel>

      <ContentArea>
      <StageBanner $background={color2}>
        {formatValue(modeName, "Knockout Stage").toUpperCase()}
      </StageBanner>

      <GameText $color={textColor3}>{`GAME ${formatValue(gameNumber, "-")}`}</GameText>

      <MetaRow>
        <DarkArrow />
        <MetaText $color={textColor4}>{formatValue(dayName, "Week 3 | Day 1").toUpperCase()}</MetaText>
      </MetaRow>
      </ContentArea>
    </BadgeWrapper>
  </Overlay>
);

export default MatchNumberDesign3;

const Overlay = styled.div`
  position: fixed;
  right: 26px;
  bottom: ${CARD_BOTTOM}px;
  width: ${PANEL_WIDTH}px;
  height: ${PANEL_HEIGHT}px;
  z-index: 999;
  font-family: "Montserrat", sans-serif;
  pointer-events: none;

  @media (min-width: 2560px) {
    right: 26px;
    bottom: ${CARD_BOTTOM}px;
    transform: scale(1.96);
    transform-origin: right bottom;
  }
`;

const BadgeWrapper = styled.div<{ $color: string }>`
  width: ${PANEL_WIDTH}px;
  height: ${PANEL_HEIGHT}px;
  background: ${({ $color }) => $color};
  clip-path: polygon(22px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 22px);
  display: flex;
  align-items: stretch;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.3));
`;

const LogoPanel = styled.div<{ $color: string }>`
  flex: 0 0 ${LOGO_WIDTH}px;
  height: 100%;
  padding: 0;
  background: ${({ $color }) => $color};
  clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px);
`;

const LogoMask = styled.div`
  position: relative;
  width: calc(100% - 6px);
  height: calc(100% - 12px);
  margin: 6px 6px 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 14, 0.22);
  clip-path: polygon(14px 0, 100% 0, 100% 100%, 0 100%, 0 14px);
  overflow: hidden;
`;

const Logo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter:
    brightness(1.08)
    saturate(1.12)
    drop-shadow(0 6px 10px rgba(0, 0, 0, 0.24));
`;

const LogoFallback = styled.span`
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.8px;
`;

const LogoShine = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 34%, rgba(255, 255, 255, 0.08) 58%, transparent 78%),
    radial-gradient(circle at 24% 20%, rgba(255, 255, 255, 0.18), transparent 32%);
  pointer-events: none;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  padding: 10px 14px 8px 0;
`;

const StageBanner = styled.div<{ $background: string }>`
  background: ${({ $background }) => $background};
  color: #1a1a1a;
  padding: 2px 14px 2px 28px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  line-height: 1.1;
  margin-right: -14px;
  clip-path: polygon(14px 0%, 100% 0%, 100% 100%, 0% 100%);
`;

const GameText = styled.div<{ $color: string }>`
  font-family: "Kanit", sans-serif;
  font-size: 44px;
  font-weight: 900;
  color: ${({ $color }) => $color};
  line-height: 0.85;
  text-transform: uppercase;
  letter-spacing: -0.5px;
  margin-top: 1px;
  margin-bottom: 2px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-right: 2px;
`;

const DarkArrow = styled.div`
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid #1a1a1a;
  display: inline-block;
`;

const MetaText = styled.div<{ $color: string }>`
  font-size: 11px;
  font-weight: 900;
  color: ${({ $color }) => $color};
  letter-spacing: 0.3px;
  text-transform: uppercase;
  line-height: 1;
`;
