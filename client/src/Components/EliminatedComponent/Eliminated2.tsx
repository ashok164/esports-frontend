import React from "react";
import styled, { keyframes } from "styled-components";
import { useProjectTheme } from "../../Theme";

type TeamNotificationData = {
  name?: string;
  logoUrl?: string;
  rank?: number;
  eliminatedNumber?: number;
  kills?: number;
  teamTag?: string;
  shortName?: string;
  tag?: string;
  players?: Array<{
    playerPic?: string;
    avatarUrl?: string;
    photoUrl?: string;
    player_image?: string;
    player_pic?: string;
  }>;
};

const getTeamLabel = (team?: TeamNotificationData) =>
  team?.teamTag || team?.shortName || team?.tag || team?.name || "TEAM";

const getPlacement = (team?: TeamNotificationData) =>
  Math.max(1, Number(team?.eliminatedNumber ?? team?.rank ?? 1));

const getFinishes = (team?: TeamNotificationData) => Math.max(0, Number(team?.kills ?? 0));

const bannerEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(-28px);
  }
  68% {
    opacity: 1;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const bannerExit = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-22px);
  }
`;

const contentReveal = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyleTwoEliminatedCard: React.FC<{
  team?: TeamNotificationData;
  isExiting?: boolean;
  showPlayers?: boolean;
}> = ({ team, isExiting = false, showPlayers = false }) => {
  const { broadcastSettings } = useProjectTheme();
  const teamName = getTeamLabel(team);
  const placement = getPlacement(team);
  const playerPortraits = (team?.players ?? [])
    .map((player) => player.playerPic || player.avatarUrl || player.photoUrl || player.player_image || player.player_pic || "")
    .filter(Boolean)
    .slice(0, 4);

  const colorVars = {
    "--elim2-accent": broadcastSettings.liveStandings2Color5,
    "--elim2-accent-text": broadcastSettings.liveStandings2TextColor4,
    "--elim2-surface": broadcastSettings.liveStandings2Color1,
    "--elim2-surface-text": broadcastSettings.liveStandings2TextColor3,
    "--elim2-line": broadcastSettings.liveStandings2Color2,
    "--elim2-texture": broadcastSettings.liveStandings2Color4,
    "--elim2-divider": broadcastSettings.liveStandings2TextColor3,
  } as React.CSSProperties;

  return (
    <Overlay style={colorVars} $showPlayers={showPlayers}>
      <BannerFrame $isExiting={isExiting}>
        <PlacementPanel>
          <PlacementNumber>#{String(placement).padStart(2, "0")}</PlacementNumber>
          <BrandRow>
            {team?.logoUrl ? (
              <TeamLogo
                src={team.logoUrl}
                alt={teamName}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </BrandRow>
        </PlacementPanel>

        <DetailsPanel $showPlayers={showPlayers}>
          <TopStats>
            <TeamName title={teamName}>{teamName}</TeamName>
            <FinishCount>{getFinishes(team)} ELIMS</FinishCount>
          </TopStats>
          <Separator />
          <EliminatedText>ELIMINATED</EliminatedText>
          {showPlayers ? (
            <PlayerStrip>
              {playerPortraits.map((src, index) => <PlayerPortrait key={`${src}-${index}`} src={src} alt="" />)}
              {Array.from({ length: Math.max(0, 4 - playerPortraits.length) }, (_, index) => <PlayerPlaceholder key={index} />)}
            </PlayerStrip>
          ) : null}
        </DetailsPanel>
      </BannerFrame>
    </Overlay>
  );
};

export default StyleTwoEliminatedCard;

const Overlay = styled.section<{ $showPlayers: boolean }>`
  position: fixed;
  top: 26px;
  left: 50%;
  z-index: 9999;
  display: flex;
  width: ${({ $showPlayers }) => ($showPlayers ? "720px" : "460px")};
  height: ${({ $showPlayers }) => ($showPlayers ? "230px" : "120px")};
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  font-family: "Arial Black", "Roboto Condensed", sans-serif;
  text-transform: uppercase;
  transform: translateX(-50%);

  /* The 1080p composition scales as one fixed artwork for 2K broadcasts. */
  @media (min-width: 2560px) {
    transform: translateX(-50%) scale(1.96);
    transform-origin: center top;
  }
`;

const BannerFrame = styled.div<{ $isExiting: boolean }>`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  animation: ${({ $isExiting }) => ($isExiting ? bannerExit : bannerEnter)} ${({ $isExiting }) => ($isExiting ? "520ms" : "580ms")} cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const PlacementPanel = styled.div`
  position: relative;
  display: flex;
  flex: 0 0 35%;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 10px;
  background-color: var(--elim2-accent);
  background-image: radial-gradient(color-mix(in srgb, var(--elim2-texture) 20%, transparent) 15%, transparent 16%);
  background-size: 6px 6px;
  animation: ${contentReveal} 360ms ease-out 100ms both;
`;

const PlacementNumber = styled.strong`
  position: relative;
  z-index: 1;
  align-self: flex-start;
  color: var(--elim2-accent-text);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1;
`;

const BrandRow = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TeamLogo = styled.img`
  width: 74%;
  height: 74%;
  object-fit: contain;
  object-position: center;
`;

const DetailsPanel = styled.div<{ $showPlayers: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: ${({ $showPlayers }) => ($showPlayers ? "flex-start" : "center")};
  padding: 12px 16px;
  background-color: var(--elim2-surface);
  background-image: linear-gradient(90deg, transparent 94%, color-mix(in srgb, var(--elim2-line) 28%, transparent) 94% 95%, transparent 95%);
  background-size: 15px 100%;
  animation: ${contentReveal} 360ms ease-out 180ms both;
`;

const TopStats = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 90%;
`;

const Separator = styled.div`
  width: 90%;
  height: 3px;
  flex: 0 0 3px;
  margin: 5px 0 0;
  background: var(--elim2-divider);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
`;

const TeamName = styled.div`
  max-width: 185px;
  overflow: hidden;
  color: var(--elim2-surface-text);
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FinishCount = styled.div`
  flex: 0 0 auto;
  margin-left: 10px;
  color: var(--elim2-surface-text);
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
`;

const EliminatedText = styled.div`
  margin-top: 5px;
  color: var(--elim2-surface-text);
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.5px;
  line-height: 1.1;
`;

const PlayerStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  width: 100%;
  height: 98px;
  margin-top: 8px;
  padding: 3px;
  background: var(--elim2-line);
`;

const PlayerPortrait = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  background: var(--elim2-texture);
  filter: contrast(1.05);
`;

const PlayerPlaceholder = styled.div`
  height: 100%;
  background: linear-gradient(135deg, var(--elim2-texture), var(--elim2-line));
`;
