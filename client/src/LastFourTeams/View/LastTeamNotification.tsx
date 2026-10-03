import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { TeamData } from "./Components/LastFourTeam1";
import EndgameTopFourHUD from "./Components/LastFourTeam1";
import StyleTwoTopFourHUD from "./Components/LastFourTeam2";
import StyleFourTopFourHUD from "./Components/LastFourTeam4";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";

const isTrue = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";

const isTeamAlive = (team: any) =>
  Number(team?.playersAlive ?? 0) > 0 && !isTrue(team?.is_eliminated) && !isTrue(team?.isEliminated);

const LiveLastTeamNotification = () => {
  const { standings, loading } = useLiveStandingsController({
    forceLiveMatchStandings: true,
  });
  const { isLoading: isThemeLoading, broadcastSettings } = useProjectTheme();

  const aliveTeamsCount = useMemo(
    () =>
      Array.isArray(standings)
        ? standings.filter(isTeamAlive).length
        : 0,
    [standings],
  );

  const shouldShowFinalTeamsOverlay =
    aliveTeamsCount > 0 && aliveTeamsCount <= 4;

  if (loading || isThemeLoading || !shouldShowFinalTeamsOverlay) return null;
  return (
    <>
      {broadcastSettings.selectedBroadcastStyle === "theme4" ? (
        <StyleFourTopFourHUD teams={standings} />
      ) : broadcastSettings.selectedBroadcastStyle === "theme2" ? (
        <StyleTwoTopFourHUD teams={standings} />
      ) : (
        <EndgameTopFourHUD teams={standings} />
      )}
    </>
  );
};

const LastFourPreview = () => {
  const [stage, setStage] = useState(0);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const timers = [5000, 10000, 15000].map((delay, index) =>
      window.setTimeout(() => setStage(index + 1), delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [replay]);

  const teams: TeamData[] = ["JE", "HORAA", "CME", "HC"].map((name, index) => {
    const eliminated = index >= 4 - stage;
    return {
      id: `preview-${index}`,
      name,
      shortName: name,
      rank: index + 1,
      playersAlive: eliminated ? 0 : 4,
      isEliminated: eliminated,
      winRate: Math.round(100 / (4 - stage)),
      players: Array.from({ length: 4 }, (_, playerIndex) => ({
        status: eliminated ? "dead" : "alive",
        hpPercent: eliminated ? 0 : [100, 85, 65, 100][playerIndex],
        isKnocked: false,
        hasRecalled: false,
      })),
    };
  });

  return <PreviewScene>
    <StyleFourTopFourHUD teams={teams} />
    <PreviewControls>
      <strong>THEME 4 · LAST TEAMS PREVIEW</strong>
      <span>4 → 3 → 2 → 1 · One elimination every 5 seconds</span>
      <span aria-live="polite">{4 - stage} {stage === 3 ? "team remaining · JE wins" : "teams remaining"}</span>
      <button onClick={() => { setStage(0); setReplay((value) => value + 1); }}>Replay sequence</button>
    </PreviewControls>
  </PreviewScene>;
};

const PreviewScene = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, #354237 0%, #17231d 55%, #0b1210 100%);
`;

const PreviewControls = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: max-content;
  max-width: calc(100vw - 32px);
  color: #fff8e8;
  font-family: sans-serif;
  text-align: center;

  strong { color: #f5c84f; }
  button {
    padding: 10px 20px;
    border: 0;
    border-radius: 4px;
    background: #f5c84f;
    color: #090909;
    font-weight: 700;
    cursor: pointer;
  }
`;

const LastTeamNotification = () =>
  new URLSearchParams(window.location.search).get("preview") === "theme4"
    ? <LastFourPreview />
    : <LiveLastTeamNotification />;

export default LastTeamNotification;
