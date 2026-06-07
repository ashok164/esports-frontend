import React, { useCallback, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { getTodaysPlayingTeamsApi, TodaysPlayingTeam } from "../../TeamRecordTable/Repositary/remote";
import { useProjectTheme } from "../../Theme";

const REFRESH_MS = 15000;

const TodaysPlayingBroadcastView: React.FC = () => {
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [teams, setTeams] = useState<TodaysPlayingTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    try {
      const rows = await getTodaysPlayingTeamsApi();
      setTeams(rows);
    } catch (err) {
      console.warn("Failed to load today's playing teams.", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
    const timer = window.setInterval(loadTeams, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadTeams]);

  if (isThemeLoading || isLoading) return null;

  return (
    <Page>
      <TeamGrid>
        {teams.map((team, index) => (
          <TeamCard key={`${team.teamId}-${index}`} $index={index}>
            <Rank>{String(index + 1).padStart(2, "0")}</Rank>
            {team.countryLogo && (
              <CountryLogo src={team.countryLogo} alt={`${team.name || "Team"} nation`} />
            )}
            <LogoFrame>
              {team.teamLogo ? <TeamLogo src={team.teamLogo} alt={team.name} /> : <LogoFallback>{team.tag || "-"}</LogoFallback>}
            </LogoFrame>
            <TeamInfo>
              <BottomBand>
                <TeamName>{team.name || "Unknown Team"}</TeamName>
              </BottomBand>
            </TeamInfo>
          </TeamCard>
        ))}
      </TeamGrid>
    </Page>
  );
};

export default TodaysPlayingBroadcastView;

const cardIn = keyframes`
  0% {
    opacity: 0;
    filter: blur(8px);
    transform: translateY(38px) scale(0.92);
  }
  72% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(-5px) scale(1.02);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0) scale(1);
  }
`;

const logoPulse = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.035);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  width: 100%;
  padding: clamp(26px, 3.6vw, 58px);
  background: transparent;
  color: var(--project-text-primary, #ffffff);
  overflow: hidden;
  font-family: "Montserrat", "Arial Black", sans-serif;
`;

const TeamGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(14px, 1.5vw, 26px);
  align-items: stretch;

  @media (max-width: 1500px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 980px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const TeamCard = styled.article<{ $index: number }>`
  position: relative;
  min-width: 0;
  aspect-ratio: 1;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 0;
  padding: clamp(12px, 1.1vw, 18px) clamp(12px, 1.1vw, 18px) clamp(48px, 3.8vw, 62px);
  border: 1px solid rgba(var(--project-secondary-rgb, 56, 189, 248), 0.28);
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 70%, rgba(var(--project-secondary-rgb, 56, 189, 248), 0.16), transparent 42%),
    linear-gradient(145deg, rgba(var(--project-surface-rgb, 17, 24, 39), 0.94), rgba(var(--project-background-rgb, 7, 11, 19), 0.9)),
    var(--project-surface, #111827);
  box-shadow: none;
  overflow: hidden;
  opacity: 0;
  animation: ${cardIn} 560ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  animation-delay: ${({ $index }) => `${120 + ($index % 12) * 70}ms`};

  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: linear-gradient(90deg, var(--project-primary, #ef4444), var(--project-accent, #bfff00));
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(140deg, rgba(255, 255, 255, 0.05), transparent 44%);
    pointer-events: none;
  }
`;

const Rank = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--project-primary, #ef4444);
  color: var(--project-text-primary, #ffffff);
  font-size: 0.84rem;
  font-weight: 1000;
`;

const LogoFrame = styled.div`
  position: relative;
  z-index: 1;
  align-self: center;
  justify-self: center;
  display: grid;
  place-items: center;
  width: min(100%, 142px);
  aspect-ratio: 1;
  animation: ${logoPulse} 3.2s ease-in-out infinite;
`;

const TeamLogo = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.38));
`;

const LogoFallback = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: rgba(var(--project-secondary-rgb, 56, 189, 248), 0.16);
  color: var(--project-secondary, #38bdf8);
  font-size: clamp(1.2rem, 2vw, 2rem);
  font-weight: 1000;
`;

const TeamInfo = styled.div`
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  bottom: 12px;
  min-width: 0;
  display: block;
`;

const TeamName = styled.h2`
  position: absolute;
  inset: 0 18px 0 0;
  display: grid;
  place-items: center;
  width: auto;
  height: 100%;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: inherit;
  font-size: clamp(0.72rem, 0.86vw, 1rem);
  font-weight: 1000;
  letter-spacing: 0;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  padding: 0 24px;
`;

const BottomBand = styled.div`
  position: relative;
  width: calc(100% - 20px);
  height: clamp(36px, 3vw, 48px);
  margin: 0 10px;
  background: linear-gradient(
    135deg,
    rgba(var(--project-accent-rgb, 191, 255, 0), 0.94),
    var(--project-accent, #bfff00),
    rgba(var(--project-accent-rgb, 191, 255, 0), 0.9)
  );
  color: var(--project-background, #070b13);
  border-bottom: 2px solid rgba(0, 0, 0, 0.28);

  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: -1px;
    width: 18px;
    height: 100%;
    background: var(--project-surface, #111827);
    clip-path: polygon(100% 0, 28% 18%, 100% 34%, 28% 50%, 100% 66%, 28% 100%, 100% 100%);
  }
`;

const CountryLogo = styled.img`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: clamp(28px, 2.2vw, 40px);
  height: clamp(20px, 1.55vw, 28px);
  border-radius: 4px;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.22);
`;
