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
import { getBroadcastTeamRosterApi, RosterTeam } from "../Repository/remote";

const REFRESH_MS = 15000;
const SETTINGS_REFRESH_MS = 1500;
const TEAMS_PER_PAGE = 6;
const PLAYERS_PER_TEAM = 5;
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

  return (
    <Page>
      <RosterGrid key={`roster-page-${pageIndex}`}>
        {visibleTeams.map((team, index) => (
          <TeamPanel key={`${team.teamId}-${team.teamName}-${index}`} $index={index}>
            <PaintBack aria-hidden="true" />
            <GreenStrip aria-hidden="true" />
            <PlayerPhotoRow>
              {team.players.slice(0, PLAYERS_PER_TEAM).map((player, playerIndex) => (
                <PlayerCutout key={`${player.uid || player.name}-photo-${playerIndex}`} $index={playerIndex}>
                  {player.playerPic ? (
                    <PlayerPhoto src={player.playerPic} alt={player.name} />
                  ) : (
                    <PlayerInitial>{player.name.slice(0, 1) || "P"}</PlayerInitial>
                  )}
                </PlayerCutout>
              ))}
            </PlayerPhotoRow>
            <TeamHeader>
              {settings.showRosterTeamLogos && (
                <TeamLogoSlot>
                  {team.teamLogo ? <TeamLogo src={team.teamLogo} alt={`${team.teamName} Team Logo`} /> : <LogoFallback>{team.tag || team.teamName.slice(0, 2)}</LogoFallback>}
                </TeamLogoSlot>
              )}
              <TeamName>{team.teamName}</TeamName>
              {team.countryLogo && <CountryLogo src={team.countryLogo} alt={`${team.teamName} Country Flag`} />}
            </TeamHeader>
            <PlayerStrip>
              {team.players.slice(0, PLAYERS_PER_TEAM).map((player, playerIndex) => (
                <PlayerCell key={`${player.uid || player.name}-${playerIndex}`} $index={playerIndex}>
                  <PlayerName>{player.name}</PlayerName>
                </PlayerCell>
              ))}
            </PlayerStrip>
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
    transform: translateX(44px);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
`;

const panelIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(28px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const photoRise = keyframes`
  0% {
    opacity: 0;
    transform: translateY(14px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Page = styled.main`
  width: 100%;
  min-height: 100vh;
  padding: clamp(18px, 2.6vw, 52px);
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 34px),
    #111;
  color: var(--project-text-primary, #ffffff);
  font-family: "Montserrat", "Arial Black", Impact, sans-serif;
`;

const RosterGrid = styled.section`
  width: min(1840px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 1.8vw, 34px) clamp(14px, 1.6vw, 30px);
  animation: ${pageIn} 420ms cubic-bezier(0.2, 0.9, 0.25, 1) both;

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const TeamPanel = styled.article<{ $index: number }>`
  position: relative;
  min-width: 0;
  aspect-ratio: 2.18 / 1;
  min-height: 0;
  display: grid;
  grid-template-rows: 62% 20% 18%;
  padding: 0;
  overflow: visible;
  isolation: isolate;
  opacity: 0;
  animation: ${panelIn} 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  animation-delay: ${({ $index }) => `${90 + $index * 80}ms`};
`;

const PaintBack = styled.div`
  position: absolute;
  inset: 11% 0 18%;
  z-index: -3;
  height: auto;
  background:
    linear-gradient(178deg, transparent 0 6%, rgba(255, 255, 255, 0.96) 7% 82%, transparent 83%),
    repeating-linear-gradient(176deg, rgba(255, 255, 255, 0.98) 0 13px, rgba(238, 238, 238, 0.96) 14px 20px, rgba(255, 255, 255, 0.92) 21px 32px);
  clip-path: polygon(0 15%, 5% 8%, 14% 10%, 25% 6%, 39% 9%, 52% 5%, 67% 10%, 82% 6%, 100% 12%, 97% 92%, 86% 88%, 75% 95%, 58% 90%, 43% 97%, 27% 91%, 12% 96%, 0 91%);
  filter: drop-shadow(0 8px 0 rgba(0, 0, 0, 0.52));
`;

const GreenStrip = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -2;
  height: 18%;
  background: var(--project-accent, #56f04f);
  clip-path: polygon(0 0, 100% 0, 98% 100%, 0 100%);
`;

const PlayerPhotoRow = styled.div`
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: end;
  padding: 0 1.6%;
  overflow: hidden;
`;

const PlayerCutout = styled.div<{ $index: number }>`
  align-self: end;
  justify-self: center;
  position: relative;
  z-index: ${({ $index }) => ($index === 2 ? 5 : $index === 1 || $index === 3 ? 4 : 3)};
  width: 134%;
  height: 108%;
  display: grid;
  place-items: end center;
  overflow: hidden;
  opacity: 0;
  animation: ${photoRise} 420ms ease both;
  animation-delay: ${({ $index }) => `${180 + $index * 55}ms`};
  transform: ${({ $index }) =>
    $index === 0
      ? "translateX(10%)"
      : $index === 1
        ? "translateX(4%)"
        : $index === 3
          ? "translateX(-4%)"
          : $index === 4
            ? "translateX(-10%)"
            : "translateY(-5%)"};

  &:nth-child(3) {
    width: 152%;
    height: 124%;
  }

  img {
    width: 100%;
    height: 105%;
    display: block;
    object-fit: contain;
    object-position: center bottom;
  }
`;

const TeamHeader = styled.header`
  position: relative;
  z-index: 8;
  width: 100%;
  height: 100%;
  margin: 0;
  margin-top: 0;
  display: grid;
  grid-template-columns: 16% minmax(0, 1fr) 13%;
  align-items: center;
  background: var(--project-surface, #050505);
  color: var(--project-text-primary, #ffffff);
  box-shadow: none;

  body[data-show-roster-team-logos="false"] & {
    grid-template-columns: minmax(0, 1fr) 13%;
  }
`;

const TeamLogoSlot = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  border-right: 3px solid var(--project-accent, #56f04f);
  background: var(--project-surface, #050505);
`;

const TeamLogo = styled.img.attrs({
  loading: "eager",
  decoding: "async",
  fetchPriority: "low",
})`
  width: 70%;
  height: 76%;
  display: block;
  object-fit: contain;
`;

const LogoFallback = styled.div`
  width: 70%;
  height: 76%;
  display: grid;
  place-items: center;
  color: var(--project-accent, #b7ff00);
  font-size: clamp(0.84rem, 1.2vw, 1.55rem);
  font-weight: 1000;
  text-transform: uppercase;
`;

const TeamName = styled.h2`
  min-width: 0;
  height: 100%;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0 4%;
  overflow: hidden;
  background: var(--project-surface, #050505);
  color: inherit;
  font-size: clamp(0.86rem, 1.22vw, 1.8rem);
  font-weight: 1000;
  letter-spacing: 0;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

const CountryLogo = styled.img.attrs({
  loading: "eager",
  decoding: "async",
  fetchPriority: "low",
})`
  justify-self: center;
  width: 62%;
  height: 58%;
  display: block;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.28);
`;

const PlayerStrip = styled.div`
  position: relative;
  z-index: 8;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  height: 100%;
  margin: 0;
  padding: 0 1.4%;
  gap: 0;
  background: var(--project-accent, #56f04f);
  clip-path: polygon(0 0, 100% 0, 98% 100%, 0 100%);
`;

const PlayerCell = styled.div<{ $index: number }>`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-items: center;
  min-height: 0;
  padding: 0 4%;
  border-right: 2px solid rgba(0, 0, 0, 0.46);
  opacity: 0;
  animation: ${photoRise} 420ms ease both;
  animation-delay: ${({ $index }) => `${260 + $index * 70}ms`};

  &:last-child {
    border-right: 0;
  }
`;

const PlayerPhoto = styled.img.attrs({
  loading: "eager",
  decoding: "async",
  fetchPriority: "high",
})`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center bottom;
`;

const PlayerInitial = styled.span`
  color: var(--project-text-inverse, #050505);
  font-size: 1.25rem;
  font-weight: 1000;
`;

const PlayerName = styled.div`
  width: 100%;
  min-width: 0;
  overflow: hidden;
  color: var(--project-text-inverse, #050505);
  display: grid;
  align-items: center;
  font-size: clamp(0.42rem, 0.5vw, 0.76rem);
  font-weight: 1000;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  word-break: normal;
`;
