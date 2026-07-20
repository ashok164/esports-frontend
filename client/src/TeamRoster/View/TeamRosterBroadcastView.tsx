import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { isImageWarm, warmImageUrls } from "../../BroadcastImageCache/imageCache";
import {
  BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT,
  DEFAULT_BROADCAST_DISPLAY_SETTINGS,
  getBroadcastDisplaySettings,
  setBroadcastDisplaySettings,
  useProjectTheme,
} from "../../Theme";
import http from "../../AxiosFile/axios";
import { BROADCAST_DISPLAY_SETTINGS } from "../../Routes/ApiRoutes/apiRoutes";
import { getSelectedTournamentSlug } from "../../Tournaments/tournamentState";
import LiveStandingsFont, {
  GFF_LATIN_EXTRA_BOLD_FONT_FAMILY,
  LIVE_STANDINGS_FONT_FAMILY,
} from "../../LiveStandingsTable/View/LiveStandingsFont";
import { getBroadcastTeamRosterApi, RosterTeam } from "../Repository/remote";

const REFRESH_MS = 15000;
const SETTINGS_REFRESH_MS = 1500;
const TEAMS_PER_PAGE = 6;
const PLAYERS_PER_TEAM = 5;
const getPlayerSlots = (team: RosterTeam) =>
  Array.from({ length: PLAYERS_PER_TEAM }, (_, index) => team.players[index] || {
    uid: `empty-${team.teamId}-${index}`,
    name: `Player ${index + 1}`,
    playerPic: "",
  });

const collectRosterUrls = (teams: RosterTeam[]) => {
  const urls = new Set<string>();

  teams.forEach((team) => {
    if (team.teamLogo) urls.add(team.teamLogo);
    if (team.countryLogo) urls.add(team.countryLogo);
    team.players.slice(0, PLAYERS_PER_TEAM).forEach((player) => {
      if (player.playerPic) urls.add(player.playerPic);
    });
  });

  return Array.from(urls);
};

const chunkTeams = (teams: RosterTeam[]) => {
  const pages: RosterTeam[][] = [];
  for (let index = 0; index < teams.length; index += TEAMS_PER_PAGE) {
    pages.push(teams.slice(index, index + TEAMS_PER_PAGE));
  }
  return pages.length ? pages : [[]];
};

const TeamRosterBroadcastView: React.FC = () => {
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [teams, setTeams] = useState<RosterTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageReady, setIsPageReady] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [settings, setSettings] = useState(getBroadcastDisplaySettings);

  const pages = useMemo(() => chunkTeams(teams), [teams]);
  const visibleTeams = pages[pageIndex % pages.length] || [];

  const loadRosters = useCallback(async () => {
    try {
      const rows = await getBroadcastTeamRosterApi();
      setTeams(rows);
    } catch (error) {
      console.warn("Failed to load broadcast team roster.", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRosters();
    const timer = window.setInterval(loadRosters, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadRosters]);

  useEffect(() => {
    const applyNextSettings = (nextSettings: ReturnType<typeof getBroadcastDisplaySettings>) => {
      setSettings((currentSettings) => {
        if (currentSettings.rosterPageSwitch !== nextSettings.rosterPageSwitch) {
          setPageIndex((currentPage) => currentPage + 1);
        }
        return nextSettings;
      });
    };
    const syncSettings = () => applyNextSettings(getBroadcastDisplaySettings());
    const fetchRemoteSettings = async () => {
      try {
        const selectedTournamentSlug = getSelectedTournamentSlug();
        const response = await http.get(BROADCAST_DISPLAY_SETTINGS(selectedTournamentSlug), {
          params: { _t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });
        const nextSettings = {
          ...DEFAULT_BROADCAST_DISPLAY_SETTINGS,
          ...(response.data?.settings || response.data || {}),
        };
        setBroadcastDisplaySettings(nextSettings);
        applyNextSettings(nextSettings);
      } catch {
        syncSettings();
      }
    };

    window.addEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
    window.addEventListener("storage", syncSettings);
    syncSettings();
    fetchRemoteSettings();
    const timer = window.setInterval(fetchRemoteSettings, SETTINGS_REFRESH_MS);
    return () => {
      window.removeEventListener(BROADCAST_DISPLAY_SETTINGS_UPDATED_EVENT, syncSettings);
      window.removeEventListener("storage", syncSettings);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (pageIndex >= pages.length) {
      setPageIndex(0);
    }
  }, [pageIndex, pages.length]);

  useEffect(() => {
    let cancelled = false;

    const preparePage = async () => {
      const nextTeams = pages[pageIndex % pages.length] || [];
      const nextUrls = collectRosterUrls(nextTeams);

      if (nextUrls.length > 0 && nextUrls.every(isImageWarm)) {
        setIsPageReady(true);
        return;
      }

      setIsPageReady(false);
      await warmImageUrls(nextUrls);
      if (!cancelled) {
        setIsPageReady(true);
      }
    };

    preparePage().catch(() => {
      if (!cancelled) {
        setIsPageReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pageIndex, pages]);

  useEffect(() => {
    if (teams.length === 0) return;

    warmImageUrls(collectRosterUrls(teams)).catch(() => undefined);
  }, [teams]);

  if (isThemeLoading || isLoading || !isPageReady) return null;

  const rosterColors = {
    "--roster-color-1": settings.liveStandings2Color1,
    "--roster-color-2": settings.liveStandings2Color2,
    "--roster-color-5": settings.liveStandings2Color5,
    "--roster-text-color-1": settings.liveStandings2TextColor1,
    "--roster-text-color-2": settings.liveStandings2TextColor2,
  } as React.CSSProperties;

  return (
    <Page style={rosterColors}>
      <LiveStandingsFont />
      <RosterGrid key={`roster-page-${pageIndex}`}>
        {visibleTeams.map((team, index) => (
          <TeamPanel key={`${team.teamId}-${team.teamName}-${index}`} $index={index}>
            <PlayersContainer>
              {getPlayerSlots(team).map((player, playerIndex) => (
                <PlayerBox key={`${player.uid || player.name}-photo-${playerIndex}`} $index={playerIndex}>
                  <GroupHeader>
                    <StripText>{team.tag || `TEAM ${team.teamId || index + 1}`}</StripText>
                  </GroupHeader>
                  <PlayerImageWrapper>
                  {player.playerPic ? (
                    <PlayerPhoto src={player.playerPic} alt={player.name} />
                  ) : (
                    <PlayerInitial>{player.name.slice(0, 1) || "P"}</PlayerInitial>
                  )}
                  </PlayerImageWrapper>
                  <PlayerName title={player.name}>
                    <StripText>{player.name}</StripText>
                  </PlayerName>
                </PlayerBox>
              ))}
            </PlayersContainer>
            <TeamBanner $index={index}>
              <BrandBox>
              {settings.showRosterTeamLogos && (
                <TeamLogoSlot>
                  {team.teamLogo ? <TeamLogo src={team.teamLogo} alt={`${team.teamName} Team Logo`} /> : <LogoFallback>{team.tag || team.teamName.slice(0, 2)}</LogoFallback>}
                </TeamLogoSlot>
              )}
              {team.countryLogo && <CountryLogo src={team.countryLogo} alt={`${team.teamName} Country Flag`} />}
              </BrandBox>
              <TeamName title={team.teamName}>{team.teamName}</TeamName>
            </TeamBanner>
          </TeamPanel>
        ))}
      </RosterGrid>
    </Page>
  );
};

export default TeamRosterBroadcastView;

const pageIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const panelIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(26px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const photoRise = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const photoSettle = keyframes`
  0% {
    opacity: 0;
    transform: scale(1.08) translateY(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1.18) translateY(0);
  }
`;

const stripDrop = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const nameLift = keyframes`
  0% {
    opacity: 0;
    transform: translateY(100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const bannerIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const logoPop = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  100% {
    opacity: 1;
    transform: scale(1.22);
  }
`;

const Page = styled.main`
  width: 100%;
  min-height: 100vh;
  padding: clamp(12px, 1.55vw, 30px);
  overflow: hidden;
  background: transparent;
  color: var(--project-text-primary, #ffffff);
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", "Arial Black", Impact, sans-serif;
`;

const RosterGrid = styled.section`
  width: min(1840px, 100%);
  min-height: calc(100vh - clamp(24px, 3.1vw, 60px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 1.35vw, 24px);
  align-items: stretch;
  animation: ${pageIn} 360ms ease-out both;

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const TeamPanel = styled.article<{ $index: number }>`
  position: relative;
  min-width: 0;
  min-height: clamp(292px, 44vh, 448px);
  display: flex;
  flex-direction: column;
  gap: clamp(5px, 0.45vw, 8px);
  padding: clamp(7px, 0.7vw, 12px);
  border: 0;
  border-radius: 6px;
  background: transparent;
  box-shadow: none;
  overflow: visible;
  isolation: isolate;
  opacity: 0;
  animation: ${panelIn} 420ms ease-out both;
  animation-delay: ${({ $index }) => `${70 + $index * 45}ms`};
`;

const PlayersContainer = styled.div`
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(4px, 0.45vw, 7px);
  align-items: stretch;
`;

const PlayerBox = styled.div<{ $index: number }>`
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: clamp(22px, 1.75vw, 32px) minmax(0, 1fr) clamp(22px, 1.7vw, 30px);
  border: 0;
  border-radius: 4px;
  background: var(--project-surface, #111827);
  box-shadow: 0 5px 9px rgba(0, 0, 0, 0.32);
  overflow: hidden;
  opacity: 0;
  animation: ${photoRise} 360ms ease-out both;
  animation-delay: ${({ $index }) => `${120 + $index * 45}ms`};

`;

const GroupHeader = styled.div`
  width: 100%;
  height: clamp(22px, 1.75vw, 32px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-bottom: 1px solid rgba(var(--project-secondary-rgb, 56, 189, 248), 0.32);
  background: var(--roster-color-1, var(--project-surface-alt, #1f293d));
  color: var(--roster-text-color-1, var(--project-text-primary, #ffffff));
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", Arial, sans-serif;
  font-size: clamp(0.7rem, 1vw, 1.18rem);
  font-weight: 1000;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  animation: ${stripDrop} 260ms ease-out both;
`;

const PlayerImageWrapper = styled.div`
  width: 100%;
  min-height: 0;
  position: relative;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 48%),
    var(--roster-color-2, var(--project-surface-alt, #1f293d));
  overflow: hidden;
`;

const PlayerPhoto = styled.img.attrs({
  loading: "eager",
  decoding: "async",
  fetchPriority: "high",
})`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: top center;
  transform: scale(1.18);
  transform-origin: top center;
  animation: ${photoSettle} 440ms ease-out both;
`;

const TeamBanner = styled.div<{ $index: number }>`
  position: relative;
  display: flex;
  align-items: center;
  min-height: clamp(34px, 3vw, 48px);
  border: 1px solid rgba(var(--project-secondary-rgb, 56, 189, 248), 0.3);
  border-radius: 4px;
  background: var(--roster-color-1, var(--project-surface, #111827));
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.36);
  clip-path: polygon(0 0, 97% 0, 100% 100%, 0 100%);
  opacity: 0;
  animation: ${bannerIn} 360ms ease-out both;
  animation-delay: ${({ $index }) => `${220 + $index * 45}ms`};
`;

const BrandBox = styled.div`
  align-self: stretch;
  flex: 0 0 clamp(62px, 5.2vw, 90px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(5px, 0.55vw, 9px);
  padding: 4px clamp(16px, 1.35vw, 22px) 4px clamp(7px, 0.75vw, 11px);
  border-right: 2px solid var(--roster-color-5, var(--project-accent, #bfff00));
  background: var(--roster-color-5, var(--project-surface-alt, #1f293d));
  clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%);

  body[data-show-roster-team-logos="false"] & {
    padding-right: clamp(8px, 0.9vw, 14px);
  }
`;

const TeamLogoSlot = styled.div`
  width: clamp(30px, 2.6vw, 44px);
  height: clamp(30px, 2.6vw, 44px);
  display: grid;
  place-items: center;
`;

const TeamLogo = styled.img.attrs({
  loading: "eager",
  decoding: "async",
  fetchPriority: "low",
})`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  transform: scale(1.22);
  transform-origin: center;
  animation: ${logoPop} 320ms ease-out both;
`;

const LogoFallback = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--project-accent, #bfff00);
  font-size: clamp(0.58rem, 0.76vw, 0.9rem);
  font-weight: 1000;
  text-transform: uppercase;
`;

const CountryLogo = styled.img.attrs({
  loading: "eager",
  decoding: "async",
  fetchPriority: "low",
})`
  width: clamp(22px, 1.75vw, 30px);
  height: clamp(14px, 1.1vw, 20px);
  display: block;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.28);
`;

const PlayerInitial = styled.span`
  align-self: center;
  color: var(--project-text-secondary, #94a3b8);
  font-size: clamp(1rem, 1.6vw, 2rem);
  font-weight: 1000;
`;

const PlayerName = styled.div`
  width: 100%;
  height: clamp(30px, 2.15vw, 38px);
  min-width: 0;
  overflow: hidden;
  padding: 0 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--roster-color-1, var(--project-background, #0b0f19));
  color: var(--roster-text-color-1, var(--project-text-primary, #ffffff));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "${LIVE_STANDINGS_FONT_FAMILY}", Arial, sans-serif;
  font-size: clamp(0.48rem, 0.62vw, 0.78rem);
  font-weight: 700;
  line-height: 1;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.72);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  word-break: normal;
  animation: ${nameLift} 260ms ease-out both;

  > span {
    transform: translateY(-5px);
  }
`;

const StripText = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  line-height: 1;
  text-overflow: ellipsis;
  transform: translateY(-1px);
  white-space: nowrap;
`;

const TeamName = styled.h2`
  flex: 1 1 auto;
  min-width: 0;
  margin: 0 clamp(16px, 1.8vw, 32px) 0 clamp(8px, 0.75vw, 12px);
  overflow: hidden;
  color: var(--roster-text-color-1, var(--project-text-primary, #ffffff));
  font-size: clamp(0.68rem, 1vw, 1.22rem);
  font-style: italic;
  font-weight: 1000;
  font-family: "${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}", "${LIVE_STANDINGS_FONT_FAMILY}", "Arial Black", sans-serif;
  letter-spacing: 0;
  line-height: 1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;
