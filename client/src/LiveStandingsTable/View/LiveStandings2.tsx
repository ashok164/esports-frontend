import React, { useEffect, useMemo, useState } from "react";
import styled, { css } from "styled-components";
import {
  BROADCAST_DISPLAY_SETTINGS_KEY,
  BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT,
  getBroadcastDisplaySettings,
} from "../../Theme/projectTheme";

type Player = {
  hp?: number;
  hpPercent?: number;
  isKnocked?: boolean;
  status?: "alive" | "knocked" | "recalled" | "dead";
  hasRecalled?: boolean;
  playerPic?: string;
};

type Team = {
  id: string | number;
  name: string;
  rank?: number;
  teamTag?: string;
  shortName?: string;
  tag?: string;
  logoUrl?: string;
  countryUrl?: string;
  kills?: number;
  totalPoints?: number;
  rankingScore?: number;
  placementPoints?: number;
  playersAlive?: number;
  isEliminated?: boolean;
  is_eliminated?: boolean;
  players?: Player[];
};

const PANEL_WIDTH = 296;
const RANK_WIDTH = 42;
const FLAG_WIDTH = 26;
const STATUS_WIDTH = 77;
const FIN_WIDTH = 32;
const PTS_WIDTH = 45;
const STATUS_BAR_WIDTH = 5;
const STATUS_BAR_GAP = 3;
const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 34;
const FOOTER_HEIGHT = 28;
const MAX_ROWS = 16;
const ELIMINATION_SWAP_DELAY_MS = 700;
const ELIMINATION_BANNER_MS = 1800;
const HEADER_BG = "var(--live2-color-3)";
const PANEL_BG = "transparent";
const ROW_BG = "var(--live2-color-2)";
const RANK_BG = "var(--live2-color-2)";

type LayoutProps = { $showFlags: boolean; $showPoints: boolean };

const gridTemplate = ({ $showFlags, $showPoints }: LayoutProps) =>
  [
    `${RANK_WIDTH}px`,
    $showFlags ? `${FLAG_WIDTH}px` : "",
    "100px",
    `${STATUS_WIDTH}px`,
    `${FIN_WIDTH}px`,
    $showPoints ? `${PTS_WIDTH}px` : "",
  ]
    .filter(Boolean)
    .join(" ");

const panelWidth = ({ $showFlags, $showPoints }: LayoutProps) =>
  RANK_WIDTH + 100 + STATUS_WIDTH + FIN_WIDTH + ($showFlags ? FLAG_WIDTH : 0) + ($showPoints ? PTS_WIDTH : 0);

const Panel = styled.div<LayoutProps>`
  position: fixed;
  top: 50%;
  right: 26px;
  transform: translateY(-50%);
  width: ${panelWidth}px;
  color: #ffffff;
  font-family: "Oswald", "Arial Narrow", sans-serif;
  text-transform: uppercase;
  overflow: hidden;
  background: ${PANEL_BG};
  border: 1px solid var(--live2-color-4);
  box-shadow: none;

  /* The compact reference design expands to Style 1's broadcast footprint at 2K. */
  @media (min-width: 2560px) {
    right: 26px;
    transform: translateY(-50%) scale(1.96);
    transform-origin: right center;
  }
`;

const Header = styled.div<LayoutProps>`
  display: grid;
  grid-template-columns: ${gridTemplate};
  align-items: center;
  height: ${HEADER_HEIGHT}px;
  background: ${HEADER_BG};
  border-bottom: 1px solid #000000;
  color: var(--live2-text-color-3);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const HeaderCell = styled.div<{ $rank?: boolean; $center?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $center }) => ($center ? "center" : "flex-start")};
  height: 100%;
  padding: 0;

  ${({ $rank }) =>
    $rank &&
    css`
      justify-content: center;
      background: transparent;
      border: 0;
    `}
`;

const TableBody = styled.div`
  background: ${PANEL_BG};
`;

const Row = styled.div<{ $highlighted: boolean; $eliminated: boolean } & LayoutProps>`
  display: grid;
  grid-template-columns: ${gridTemplate};
  align-items: center;
  height: ${ROW_HEIGHT}px;
  border-bottom: 1px solid #000000;
  background: var(--live2-color-1-70);
  transition: opacity 220ms ease;
`;

const RowShell = styled.div`
  position: relative;
  height: ${ROW_HEIGHT}px;
  overflow: hidden;
`;

const RankCell = styled.div<{ $highlighted: boolean; $eliminated: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--live2-color-2);
  color: var(--live2-text-color-2);
  font-family: "Roboto Condensed", "Arial Narrow", sans-serif;
  font-size: 19px;
  font-style: italic;
  font-weight: 700;
  border-right: 1px solid #000000;
`;

const TeamCell = styled.div<{ $highlighted: boolean; $eliminated: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  min-width: 0;
  padding: 0 0 0 8px;
  background: var(--live2-color-2);
  color: var(--live2-text-color-2);
  border-right: 1px solid #000000;
`;

const FlagCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--live2-color-2);
`;

const Flag = styled.img`
  width: 16px;
  height: 12px;
  object-fit: cover;
`;

const LogoWrap = styled.div<{ $eliminated: boolean }>`
  width: 16px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  opacity: 0.8;
`;

const Logo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const TeamName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-shadow: none;
`;

const StatusCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: ${STATUS_BAR_GAP}px;
  background: transparent;
`;

const StatusBar = styled.i<{ $state: "alive" | "knocked" | "dead" }>`
  display: block;
  width: ${STATUS_BAR_WIDTH}px;
  height: 20px;
  background: ${({ $state }) =>
    $state === "alive"
      ? "#24fe5b"
      : $state === "knocked"
        ? "#ff3c14"
        : "#ffffff"};
`;

const NumberCell = styled.div<{ $highlighted: boolean; $eliminated: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: transparent;
  color: var(--live2-text-color-1);
  font-size: 18px;
  font-weight: 700;
`;

const FlashOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 60, 20, 0.9), transparent);
  z-index: 6;
`;

const RosterOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px 8px;
  background: rgba(8, 8, 8, 0.96);
  z-index: 4;
`;

const PortraitFrame = styled.div`
  position: relative;
  overflow: hidden;
  background: #121212;
  border: 1px solid rgba(255, 60, 20, 0.65);
`;

const Portrait = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) brightness(0.36);
`;

const Skull = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff3c14;
  font-size: 14px;
  font-weight: 700;
`;

const ElimBannerWrap = styled.div`
  position: absolute;
  inset: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const ElimBanner = styled.div`
  padding: 4px 14px;
  background: rgba(255, 60, 20, 0.94);
  color: #ffffff;
  font-family: "Oswald", "Arial Narrow", sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: ${FOOTER_HEIGHT}px;
  background: var(--live2-color-4);
  border: 0;
  font-size: 10px;
  font-weight: 800;
  color: var(--live2-text-color-4);
  letter-spacing: 0.5px;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const LegendSwatch = styled.i<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  background: ${({ $color }) => $color};
`;

const numberOf = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const withOpacity = (color: string, opacity: number) => {
  const normalized = color.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return color;

  const value = Number.parseInt(normalized, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
};

const pointsOf = (team: Team) =>
  numberOf(team.totalPoints ?? team.rankingScore ?? team.placementPoints) + numberOf(team.kills);

const tagOf = (team: Team) => team.teamTag || team.shortName || team.tag || team.name;

const hideBrokenLogo = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.style.display = "none";
};

const statusOf = (player?: Player): "alive" | "knocked" | "dead" => {
  if (!player || player.status === "dead" || player.hasRecalled || numberOf(player.hpPercent ?? player.hp) <= 0) {
    return "dead";
  }

  if (player.status === "knocked" || player.isKnocked) {
    return "knocked";
  }

  return "alive";
};

// The live feed can report zero players before a roster update, so only an
// explicit elimination flag is allowed to remove the white team background.
const isEliminated = (team: Team) => Boolean(team.isEliminated || team.is_eliminated);

const LiveStandings2Row: React.FC<{
  team: Team;
  rank: number;
  showFlags: boolean;
  showPoints: boolean;
}> = ({ team, rank, showFlags, showPoints }) => {
  const eliminated = isEliminated(team);
  const players = Array.from({ length: 4 }, (_, playerIndex) => team.players?.[playerIndex]);
  const [phase, setPhase] = useState<"idle" | "flash_wipe">("idle");
  const [showElimText, setShowElimText] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(eliminated);

  useEffect(() => {
    if (eliminated && !hasTriggered) {
      setHasTriggered(true);
      setPhase("flash_wipe");
      const timer1 = window.setTimeout(() => setShowElimText(true), ELIMINATION_SWAP_DELAY_MS);
      const timer2 = window.setTimeout(() => {
        setPhase("idle");
        setShowElimText(false);
      }, ELIMINATION_BANNER_MS);
      return () => {
        window.clearTimeout(timer1);
        window.clearTimeout(timer2);
      };
    }

    if (!eliminated) {
      setPhase("idle");
      setShowElimText(false);
      setHasTriggered(false);
    }
  }, [eliminated, hasTriggered]);

  return (
    <RowShell>
      {phase === "flash_wipe" && (
        <>
          <RosterOverlay>
            {players.map((player, playerIndex) => (
              <PortraitFrame key={playerIndex}>
                {player?.playerPic ? <Portrait src={player.playerPic} alt="" /> : null}
                <Skull>☠</Skull>
              </PortraitFrame>
            ))}
          </RosterOverlay>
          <FlashOverlay />
          {showElimText && (
            <ElimBannerWrap>
              <ElimBanner>Eliminated</ElimBanner>
            </ElimBannerWrap>
          )}
        </>
      )}

      <Row
        $highlighted={false}
        $eliminated={eliminated}
        $showFlags={showFlags}
        $showPoints={showPoints}
        style={phase === "flash_wipe" ? { opacity: 0 } : undefined}
      >
        <RankCell $highlighted={false} $eliminated={eliminated}>{rank}</RankCell>

        {showFlags && (
          <FlagCell>
            {team.countryUrl ? <Flag src={team.countryUrl} alt="" onError={hideBrokenLogo} /> : null}
          </FlagCell>
        )}

        <TeamCell $highlighted={false} $eliminated={eliminated}>
          <LogoWrap $eliminated={eliminated}>
            {team.logoUrl ? <Logo src={team.logoUrl} alt="" onError={hideBrokenLogo} /> : null}
          </LogoWrap>
          <TeamName>{tagOf(team)}</TeamName>
        </TeamCell>

        <StatusCell>
          {players.map((player, playerIndex) => (
            <StatusBar key={playerIndex} $state={statusOf(player)} />
          ))}
        </StatusCell>

        <NumberCell $highlighted={false} $eliminated={eliminated}>{numberOf(team.kills)}</NumberCell>
        {showPoints && (
          <NumberCell $highlighted={false} $eliminated={eliminated}>{pointsOf(team)}</NumberCell>
        )}
      </Row>
    </RowShell>
  );
};

const LiveStandings2: React.FC<{ teams?: Team[] }> = ({ teams = [] }) => {
  const [displaySettings, setDisplaySettings] = useState(getBroadcastDisplaySettings);

  useEffect(() => {
    const syncSettings = () => setDisplaySettings(getBroadcastDisplaySettings());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BROADCAST_DISPLAY_SETTINGS_KEY) syncSettings();
    };

    window.addEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const showFlags = displaySettings.showCountryFlags;
  const showPoints = displaySettings.showLiveStandingsPoints;
  const overlayColors = {
    "--live2-color-1": displaySettings.liveStandings2Color1,
    "--live2-color-1-70": withOpacity(displaySettings.liveStandings2Color1, 0.7),
    "--live2-color-2": displaySettings.liveStandings2Color2,
    "--live2-color-3": displaySettings.liveStandings2Color3,
    "--live2-color-4": displaySettings.liveStandings2Color4,
    "--live2-text-color-1": displaySettings.liveStandings2TextColor1,
    "--live2-text-color-2": displaySettings.liveStandings2TextColor2,
    "--live2-text-color-3": displaySettings.liveStandings2TextColor3,
    "--live2-text-color-4": displaySettings.liveStandings2TextColor4,
  } as React.CSSProperties;
  const rankedTeams = useMemo(
    () =>
      [...teams]
        .sort((left, right) => {
          const pointDiff = pointsOf(right) - pointsOf(left);
          if (pointDiff !== 0) return pointDiff;
          return numberOf(right.kills) - numberOf(left.kills);
        })
        .slice(0, MAX_ROWS),
    [teams],
  );

  return (
    <Panel $showFlags={showFlags} $showPoints={showPoints} style={overlayColors}>
      <Header $showFlags={showFlags} $showPoints={showPoints}>
        <HeaderCell $rank>#</HeaderCell>
        {showFlags && <HeaderCell $center />}
        <HeaderCell>Teams</HeaderCell>
        <HeaderCell $center>Status</HeaderCell>
        <HeaderCell $center>ELIM</HeaderCell>
        {showPoints && <HeaderCell $center>Pts</HeaderCell>}
      </Header>

      <TableBody>
        {rankedTeams.map((team, index) => {
          const rank = index + 1;
          return <LiveStandings2Row key={team.id} team={team} rank={rank} showFlags={showFlags} showPoints={showPoints} />;
        })}
      </TableBody>

      <Footer>
        <LegendItem>
          <LegendSwatch $color="#24fe5b" />
          Alive
        </LegendItem>
        <LegendItem>
          <LegendSwatch $color="#ff3c14" />
          Knocked
        </LegendItem>
        <LegendItem>
          <LegendSwatch $color="#4b5d60" />
          Eliminated
        </LegendItem>
      </Footer>
    </Panel>
  );
};

export default LiveStandings2;
