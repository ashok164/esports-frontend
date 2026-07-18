import React from "react";
import styled, { keyframes } from "styled-components";
import LiveStandingsFont, {
  GFF_LATIN_EXTRA_BOLD_FONT_FAMILY,
  LIVE_STANDINGS_FONT_FAMILY,
} from "../../LiveStandingsTable/View/LiveStandingsFont";

type TeamNotificationData = {
  name?: string;
  logoUrl?: string;
  countryFlag?: string;
  countryUrl?: string;
  rank?: number;
  eliminatedNumber?: number;
  kills?: number;
  totalPoints?: number;
  rankingScore?: number;
  placementPoints?: number;
  teamTag?: string;
  shortName?: string;
  tag?: string;
  players?: PlayerNotificationData[];
};

type PlayerNotificationData = {
  playerPic?: string;
  avatarUrl?: string;
  photoUrl?: string;
  player_image?: string;
  player_pic?: string;
  name?: string;
};

type Eliminated3Props = {
  team?: TeamNotificationData;
  tournamentName?: string;
  isExiting?: boolean;
  showPlayers?: boolean;
  color1: string;
  color2: string;
  color3?: string;
  color5: string;
  textColor1: string;
  textColor2?: string;
  textColor3: string;
  textColor4: string;
};

const WIDTH = 430;
const PLAYER_WIDTH = 760;
const PLAYER_HEIGHT = 330;
const STYLE3_BORDER_RED = "#ff1010";
const enter = keyframes`
  0% {
    transform: translateY(-24px) scale(0.965);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
`;

const contentReveal = keyframes`
  0% {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(1.2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
`;

const exit = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-18px) scale(0.96);
    opacity: 0;
  }
`;

const eliminatedWipe = keyframes`
  0% {
    transform: translateX(-114%) skewX(-8deg);
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  48% {
    transform: translateX(0) skewX(-8deg);
    opacity: 1;
  }
  74% {
    opacity: 1;
  }
  100% {
    transform: translateX(114%) skewX(-8deg);
    opacity: 0;
  }
`;

const wipeTextPop = keyframes`
  0% {
    opacity: 0;
    transform: skewX(8deg) scale(0.94);
  }
  24% {
    opacity: 1;
    transform: skewX(8deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: skewX(8deg) scale(0.98);
  }
`;

const playerCardReveal = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
    filter: blur(1.4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`;

const getTeamLabel = (team?: TeamNotificationData) =>
  team?.teamTag || team?.shortName || team?.tag || team?.name || "TEAM";

const getPlacement = (team?: TeamNotificationData) =>
  Math.max(1, Number(team?.eliminatedNumber ?? team?.rank ?? 1));

const getTotalPoints = (team?: TeamNotificationData) =>
  Math.max(0, Number(team?.totalPoints ?? team?.rankingScore ?? 0));

const getPlayerImage = (player?: PlayerNotificationData) =>
  player?.playerPic ||
  player?.avatarUrl ||
  player?.photoUrl ||
  player?.player_image ||
  player?.player_pic ||
  "";

const Eliminated3: React.FC<Eliminated3Props> = ({
  team,
  isExiting = false,
  showPlayers = false,
  color1,
  color2,
  color5,
  textColor1,
  textColor2,
  textColor3,
  textColor4,
}) => {
  const placement = getPlacement(team);
  const kills = Math.max(0, Number(team?.kills ?? 0));
  const totalPoints = getTotalPoints(team);
  const placementPoints = Math.max(0, totalPoints - kills);
  const bodyColor = color1 || "#12161a";
  const accentColor = color2 || STYLE3_BORDER_RED;
  const red = color5 || STYLE3_BORDER_RED;
  const teamTextColor = textColor1 || "#ffffff";
  const accentTextColor = textColor2 || "#ffffff";
  const eliminatedTextColor = textColor3 || "#ffffff";
  const stripTextColor = textColor1 || textColor4 || "#ffffff";
  const playerSlots = Array.from({ length: 4 }, (_, index) => team?.players?.[index]);

  if (showPlayers) {
    return (
      <Overlay $showPlayers>
        <LiveStandingsFont />
        <PlayerOnlyWrapper $isExiting={isExiting}>
          <PlayerRankBadge $background={accentColor} $color={accentTextColor}>
            {`#${placement}`}
          </PlayerRankBadge>
          <PlayerBackPlate $background={bodyColor} $border={red} />
          <PlayerOnlyGrid>
            {playerSlots.map((player, index) => {
              const src = getPlayerImage(player);
              const playerName = player?.name || `Player ${index + 1}`;

              return src ? (
                <PlayerOnlyImage
                  key={index}
                  $index={index}
                  src={src}
                  alt={playerName}
                />
              ) : (
                <PlayerFallback key={index} $index={index}>
                  {index + 1}
                </PlayerFallback>
              );
            })}
          </PlayerOnlyGrid>
          <PlayerBannerRow>
            <PlayerBrandBlock $background={bodyColor} $border={red}>
              {team?.countryFlag || team?.countryUrl ? (
                <PlayerCountryFlag
                  src={team.countryFlag || team.countryUrl}
                  alt=""
                />
              ) : null}
              <PlayerLogoSlot>
                {team?.logoUrl ? (
                  <PlayerTeamLogo src={team.logoUrl} alt={getTeamLabel(team)} />
                ) : (
                  <PlayerLogoFallback>{getTeamLabel(team)}</PlayerLogoFallback>
                )}
              </PlayerLogoSlot>
            </PlayerBrandBlock>
            <PlayerModeTitle $background={STYLE3_BORDER_RED} $color="#ffffff">
              ELIMINATED
            </PlayerModeTitle>
          </PlayerBannerRow>
        </PlayerOnlyWrapper>
      </Overlay>
    );
  }

  return (
    <Overlay $showPlayers={false}>
      <LiveStandingsFont />
      <Wrapper $isExiting={isExiting} $showPlayers={false}>
        <EliminatedWipe $background={STYLE3_BORDER_RED} $showPlayers={false}>
          <WipeText>ELIMINATED</WipeText>
        </EliminatedWipe>
        <MainBanner $background={bodyColor} $border={red} $showPlayers={false}>
          <ContentLayer $showPlayers={false}>
            <LogoZone $background={red}>
              {team?.logoUrl ? <TeamLogo src={team.logoUrl} alt={getTeamLabel(team)} /> : <LogoFallback>{getTeamLabel(team)}</LogoFallback>}
            </LogoZone>

            <TextZone $showPlayers={false}>
              <TeamName $color={teamTextColor} $showPlayers={false}>{getTeamLabel(team)}</TeamName>
              <EliminatedTitle $color={eliminatedTextColor} $showPlayers={false}>ELIMINATED</EliminatedTitle>
            </TextZone>

            <RankChip $background={accentColor} $color={accentTextColor}>
              {`#${placement}`}
            </RankChip>
          </ContentLayer>
        </MainBanner>
        <StatsStrip $background={bodyColor} $border={red} $color={stripTextColor} $showPlayers={false}>
          <StatItem>
            <span>KILLS</span>
            <strong>{kills}</strong>
          </StatItem>
          <StatDivider />
          <StatItem>
            <span>PLACE</span>
            <strong>{placementPoints}</strong>
          </StatItem>
          <StatDivider />
          <StatItem>
            <span>POINTS</span>
            <strong>{totalPoints}</strong>
          </StatItem>
        </StatsStrip>
      </Wrapper>
    </Overlay>
  );
};

export default Eliminated3;

const Overlay = styled.div<{ $showPlayers: boolean }>`
  position: fixed;
  top: 26px;
  left: 50%;
  width: ${({ $showPlayers }) => ($showPlayers ? PLAYER_WIDTH : WIDTH)}px;
  height: ${({ $showPlayers }) => ($showPlayers ? PLAYER_HEIGHT : 128)}px;
  z-index: 9999;
  pointer-events: none;
  transform: translateX(-50%);
  transform-origin: top center;

  @media (min-width: 2560px) {
    top: 34px;
    transform: translateX(-50%) scale(1.72);
  }
`;

const Wrapper = styled.div<{ $isExiting: boolean; $showPlayers: boolean }>`
  width: ${({ $showPlayers }) => ($showPlayers ? PLAYER_WIDTH : WIDTH)}px;
  height: ${({ $showPlayers }) => ($showPlayers ? PLAYER_HEIGHT : 128)}px;
  position: relative;
  animation: ${({ $isExiting }) => ($isExiting ? exit : enter)}
    ${({ $isExiting }) => ($isExiting ? "420ms" : "620ms")}
    cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const MainBanner = styled.div<{ $background: string; $border: string; $showPlayers: boolean }>`
  width: 100%;
  height: ${({ $showPlayers }) => ($showPlayers ? 216 : 96)}px;
  background: ${({ $background }) => $background};
  border: 2px solid ${({ $border }) => $border};
  clip-path: polygon(34px 0, 100% 0, calc(100% - 22px) 100%, 0 100%, 0 34px);
  box-shadow: none;
  display: flex;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 18px;
    height: 18px;
    border-top: 3px solid ${({ $border }) => $border};
    border-right: 3px solid ${({ $border }) => $border};
  }
`;

const ContentLayer = styled.div<{ $showPlayers: boolean }>`
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  animation: ${contentReveal} 560ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both;
`;

const EliminatedWipe = styled.div<{ $background: string; $showPlayers: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: ${({ $showPlayers }) => ($showPlayers ? 216 : 96)}px;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: ${({ $background }) => $background};
  color: #ffffff;
  clip-path: polygon(34px 0, 100% 0, calc(100% - 22px) 100%, 0 100%, 0 34px);
  transform-origin: center;
  animation: ${eliminatedWipe} 1.45s cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
`;

const WipeText = styled.div`
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 34px;
  font-weight: 900;
  color: inherit;
  letter-spacing: 1px;
  line-height: 1;
  text-transform: uppercase;
  transform: skewX(8deg);
  animation: ${wipeTextPop} 1.45s cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
`;

const LogoZone = styled.div<{ $background: string }>`
  width: 28%;
  flex: 0 0 28%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #050608;
  border-right: 2px solid ${({ $background }) => $background};
  clip-path: polygon(24px 0, 100% 0, calc(100% - 18px) 100%, 0 100%, 0 24px);
  box-shadow: none;
`;

const TeamLogo = styled.img`
  width: 82%;
  height: 82%;
  max-width: 132px;
  max-height: 132px;
  z-index: 2;
  object-fit: contain;
  filter: none;
`;

const LogoFallback = styled.div`
  z-index: 2;
  padding: 0 10px;
  color: #ffffff;
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 14px;
  font-weight: 900;
  text-align: center;
  line-height: 1;
  text-transform: uppercase;
`;

const TextZone = styled.div<{ $showPlayers: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: ${({ $showPlayers }) => ($showPlayers ? "flex-start" : "center")};
  min-width: 0;
  padding: ${({ $showPlayers }) => ($showPlayers ? "16px 12px 0 18px" : "0 8px 0 16px")};
  z-index: 1;
`;

const EliminatedTitle = styled.div<{ $color: string; $showPlayers: boolean }>`
  align-self: flex-start;
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: ${({ $showPlayers }) => ($showPlayers ? 34 : 32)}px;
  font-weight: 900;
  background: transparent;
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  letter-spacing: 0;
  line-height: 1;
  padding: 0;
  text-shadow: none;
  max-width: 100%;
  white-space: nowrap;
`;

const TeamName = styled.div<{ $color: string; $showPlayers: boolean }>`
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: ${({ $showPlayers }) => ($showPlayers ? 16 : 14)}px;
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
  line-height: 1;
`;

const RankChip = styled.div<{ $background: string; $color: string }>`
  width: 104px;
  flex: 0 0 104px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};
  font-family: ${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}, ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 43px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0;
  line-height: 0.86;
  text-align: center;
  clip-path: polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px);
`;

const PlayerOnlyWrapper = styled.div<{ $isExiting: boolean }>`
  width: ${PLAYER_WIDTH}px;
  height: ${PLAYER_HEIGHT}px;
  position: relative;
  overflow: visible;
  animation: ${({ $isExiting }) => ($isExiting ? exit : enter)}
    ${({ $isExiting }) => ($isExiting ? "420ms" : "620ms")}
    cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const PlayerBackPlate = styled.div<{ $background: string; $border: string }>`
  position: absolute;
  left: 50%;
  top: 66px;
  width: 680px;
  height: 202px;
  background: ${({ $background }) => $background};
  border: 3px solid ${({ $border }) => $border};
  clip-path: polygon(40px 0, 100% 0, calc(100% - 34px) 100%, 0 100%, 0 40px);
  transform: translateX(-50%);
  z-index: 1;
  animation: ${contentReveal} 520ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;

  &::after {
    content: "";
    position: absolute;
    inset: 0 0 0 auto;
    width: 118px;
    background: rgba(0, 0, 0, 0.24);
    clip-path: polygon(24px 0, 100% 0, 100% 100%, 0 100%);
  }
`;

const PlayerBannerRow = styled.div`
  position: absolute;
  left: 50%;
  top: 238px;
  display: flex;
  align-items: stretch;
  transform: translateX(-50%);
  z-index: 5;
  animation: ${contentReveal} 520ms cubic-bezier(0.22, 1, 0.36, 1) 520ms both;
`;

const PlayerBrandBlock = styled.div<{ $background: string; $border: string }>`
  width: 126px;
  height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: ${({ $background }) => $background};
  border: 2px solid ${({ $border }) => $border};
  clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%, 0 14px);
`;

const PlayerTeamLogo = styled.img`
  width: 70px;
  height: 54px;
  object-fit: contain;
  display: block;
`;

const PlayerLogoSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayerCountryFlag = styled.img`
  width: 22px;
  height: 14px;
  object-fit: cover;
  align-self: flex-start;
  margin-left: 20px;
`;

const PlayerLogoFallback = styled.div`
  color: #ffffff;
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
`;

const PlayerModeTitle = styled.div<{ $background: string; $color: string }>`
  width: 520px;
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 62px 0 46px;
  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};
  font-family: ${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}, ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 38px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0;
  clip-path: polygon(18px 0, 100% 0, calc(100% - 28px) 100%, 0 100%, 0 18px);
`;

const PlayerRankBadge = styled.div<{ $background: string; $color: string }>`
  position: absolute;
  top: 18px;
  left: 40px;
  z-index: 6;
  min-width: 104px;
  height: 42px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};
  font-family: ${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}, ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
  clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%, 0 12px);
  animation: ${contentReveal} 520ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both;
`;

const PlayerOnlyGrid = styled.div`
  position: absolute;
  left: 50%;
  top: 66px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  gap: 0;
  width: 680px;
  height: 202px;
  transform: translateX(-50%);
  z-index: 3;
  overflow: hidden;
  clip-path: polygon(40px 0, 100% 0, calc(100% - 34px) 100%, 0 100%, 0 40px);
`;

const PlayerOnlyImage = styled.img<{ $index: number }>`
  align-self: end;
  justify-self: center;
  width: ${({ $index }) => ($index === 1 || $index === 2 ? 164 : 154)}px;
  height: ${({ $index }) => ($index === 1 || $index === 2 ? 202 : 194)}px;
  display: block;
  object-fit: contain;
  object-position: center bottom;
  margin-inline: 0;
  z-index: ${({ $index }) => ($index === 1 || $index === 2 ? 4 : 3)};
  opacity: 0;
  animation: ${playerCardReveal} 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: ${({ $index }) => 120 + $index * 90}ms;
`;

const PlayerFallback = styled.div<{ $index: number }>`
  align-self: end;
  justify-self: stretch;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.16);
  border-left: ${({ $index }) => ($index === 0 ? "0" : "1px solid rgba(255, 255, 255, 0.34)")};
  font-family: ${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}, ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 34px;
  font-weight: 900;
  opacity: 0;
  animation: ${playerCardReveal} 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: ${({ $index }) => 120 + $index * 90}ms;
`;

const StatsStrip = styled.div<{ $background: string; $border: string; $color: string; $showPlayers: boolean }>`
  position: absolute;
  left: ${({ $showPlayers }) => ($showPlayers ? 116 : 42)}px;
  right: ${({ $showPlayers }) => ($showPlayers ? 116 : 42)}px;
  bottom: 2px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${({ $background }) => $background};
  border: 1px solid ${({ $border }) => $border};
  color: ${({ $color }) => $color};
  clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
  animation: ${contentReveal} 560ms cubic-bezier(0.22, 1, 0.36, 1) 280ms both;
`;

const StatItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: ${LIVE_STANDINGS_FONT_FAMILY};
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;

  strong {
    font-size: 14px;
    color: #ffffff;
  }
`;

const StatDivider = styled.i`
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.5);
`;
