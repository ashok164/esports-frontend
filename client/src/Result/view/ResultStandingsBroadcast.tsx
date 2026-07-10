import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { css, createGlobalStyle } from "styled-components";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getActiveGameDetails,
  getLeagueStageResultGameDetails,
  getResultGameDetails,
} from "../../GameDetails/gameDetailsState";
import useSyncGameDetails from "../../GameDetails/useSyncGameDetails";
import { useProjectTheme } from "../../Theme";
import { getResultByMatchIdApi, getResultsByMatchIdsApi, ResultRow } from "../repository/remote";

type ResultStandingsBroadcastProps = { mode: "game" | "overall" };

const splitMatchIds = (value: string) =>
  String(value || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

const first = (row: any, keys: string[]) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const normalizeRow = (row: any, fallbackMatchIds: string): ResultRow => ({
  id: row?.id,
  matchIds: String(first(row, ["matchIds", "match_ids", "match_id"]) || fallbackMatchIds),
  teamId: String(first(row, ["permanentTeamId", "permanent_team_id", "teamId", "team_id"])),
  teamLogo: String(first(row, ["teamLogo", "team_logo", "logo"])),
  countryLogo: String(first(row, ["countryLogo", "country_logo", "flag"])),
  teamName: String(first(row, ["teamName", "team_name", "name"])),
  teamTag: String(first(row, ["teamTag", "team_tag", "shortTag", "short_tag", "tag"])),
  kills: first(row, ["kills", "kill_score", "kill", "totalKills", "total_kills"]) || 0,
  placement: first(row, ["placement", "rank", "match_rank", "survival_score"]) || 0,
  booyahCount: first(row, ["booyahCount", "booyah_count", "booyah", "winCount"]) || 0,
  totalKills: first(row, ["totalPoints", "total_points", "totalScore", "total_score", "overallScore", "overall_score"]) || 0,
});

const collectRows = (payload: any) => {
  const data = payload?.data || payload;
  const rows =
    data?.results ||
    data?.result ||
    data?.totalResults ||
    data?.total_results ||
    data?.overallLeaderboard ||
    data?.standings ||
    data;
  return Array.isArray(rows) ? rows : [];
};

const ResultStandingsBroadcast: React.FC<ResultStandingsBroadcastProps> = ({ mode }) => {
  useSyncGameDetails();
  const { broadcastSettings } = useProjectTheme();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRows = useCallback(async () => {
    const gameMatchIds = splitMatchIds(getResultGameDetails().matchIds);
    const activeMatchIds = splitMatchIds(getActiveGameDetails().matchIds);
    const matchIds = mode === "game"
      ? (gameMatchIds.length > 0 ? gameMatchIds : activeMatchIds).slice(0, 1)
      : Array.from(new Set(splitMatchIds(getLeagueStageResultGameDetails().matchIds)));

    if (matchIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      const payload = mode === "game"
        ? await getResultByMatchIdApi(matchIds[0])
        : await getResultsByMatchIdsApi(matchIds);
      const source = mode === "overall"
        ? payload?.overall || payload?.data?.overall || collectRows(payload)
        : collectRows(payload);
      const normalized = (Array.isArray(source) ? source : [])
        .map((row) => normalizeRow(row, matchIds.join(",")))
        .sort((left, right) => Number(right.totalKills) - Number(left.totalKills));
      setRows(normalized);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadRows();
    const refresh = () => loadRows();
    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    const interval = window.setInterval(loadRows, 10000);
    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.clearInterval(interval);
    };
  }, [loadRows]);

  const displayRows = useMemo(() => rows.slice(0, 12), [rows]);
  const leftRows = displayRows.slice(0, 6);
  const rightRows = displayRows.slice(6, 12);
  const title = mode === "game" ? "GAME STANDINGS" : "OVERALL STANDINGS";
  const style = broadcastSettings.selectedBroadcastStyle;
  const colors = (style === "theme1"
    ? {
        "--result2-1": "var(--project-surface, #111116)",
        "--result2-2": "var(--project-secondary, #ff003c)",
        "--result2-3": "var(--project-primary, #4a159d)",
        "--result2-4": "var(--project-background, #08080c)",
        "--result2-5": "var(--project-accent, #bfff00)",
        "--result2-t1": "var(--project-text-primary, #ffffff)",
        "--result2-t2": "var(--project-text-primary, #ffffff)",
        "--result2-t3": "var(--project-text-primary, #ffffff)",
      }
    : style === "theme3"
      ? {
          "--result2-1": "#111417",
          "--result2-2": "#f4f6f8",
          "--result2-3": "#d71920",
          "--result2-4": "#050607",
          "--result2-5": "#c99a2e",
          "--result2-t1": "#ffffff",
          "--result2-t2": "#111111",
          "--result2-t3": "#ffffff",
        }
      : {
          "--result2-1": broadcastSettings.liveStandings2Color1,
          "--result2-2": broadcastSettings.liveStandings2Color2,
          "--result2-3": broadcastSettings.liveStandings2Color3,
          "--result2-4": broadcastSettings.liveStandings2Color4,
          "--result2-5": broadcastSettings.liveStandings2Color5,
          "--result2-t1": broadcastSettings.liveStandings2TextColor1,
          "--result2-t2": broadcastSettings.liveStandings2TextColor2,
          "--result2-t3": broadcastSettings.liveStandings2TextColor3,
        }) as React.CSSProperties;

  if (loading || !broadcastSettings.showResultStandings) return null;

  return (
    <>
      <ResultBroadcastFont />
      <Board $style={style} data-style={style} style={colors}>
        <BoardHeader>
          <Title $order={0}>{title}</Title>
        </BoardHeader>

        <Standings>
          <Panel>
            <ColumnHeader order={1} />
            {leftRows.map((row, index) => (
              <StandingRow key={`${row.teamId}-${index}`} row={row} rank={index + 1} order={index + 3} />
            ))}
          </Panel>

          <Panel>
            <ColumnHeader order={2} />
            {rightRows.map((row, index) => (
              <StandingRow key={`${row.teamId}-${index + 6}`} row={row} rank={index + 7} order={index + 9} />
            ))}
          </Panel>
        </Standings>
      </Board>
    </>
  );
};

const ColumnHeader: React.FC<{ order: number }> = ({ order }) => (
  <HeaderStrip $order={order}>
    <span />
    <span />
    <b>Teams</b>
    <span>Elims</span>
    <span>Place</span>
    <span>Total</span>
  </HeaderStrip>
);

const StandingRow: React.FC<{ row: ResultRow; rank: number; order: number }> = ({ row, rank, order }) => (
  <Row $highlight={rank === 1 || Number(row.booyahCount) > 0} $order={order}>
    <Rank>#{rank}</Rank>
    <LogoCell>
      {row.countryLogo ? <Flag src={row.countryLogo} alt="" /> : null}
      {row.teamLogo ? <Logo src={row.teamLogo} alt="" /> : <LogoFallback>{(row.teamTag || row.teamName || "T").slice(0, 2)}</LogoFallback>}
    </LogoCell>
    <TeamCell>
      <TeamName>{row.teamTag || row.teamName || "TEAM"}</TeamName>
    </TeamCell>
    <Stat>{Number(row.kills) || 0}</Stat>
    <Stat>{Number(row.placement) || 0}</Stat>
    <Points>{Number(row.totalKills) || 0}</Points>
  </Row>
);

export default ResultStandingsBroadcast;

const ResultBroadcastFont = createGlobalStyle`
  @import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&display=swap");
`;

const animationState = css<{ $order: number }>`
  opacity: 0;
  transform: translateY(20px);
  animation: result-board-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  animation-delay: ${({ $order }) => $order * 45}ms;

  @keyframes result-board-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Board = styled.section<{ $style: "theme1" | "theme2" | "theme3" }>`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 9999;
  width: min(1400px, calc(100vw - 40px));
  padding: 30px;
  color: #111111;
  font-family: "Rajdhani", "Oswald", "Roboto Condensed", sans-serif;
  text-transform: uppercase;
  transform: translate(-50%, -50%) scale(0.92);
  transform-origin: center center;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--result2-2), var(--result2-5));
  box-shadow: 0 0 60px color-mix(in srgb, var(--result2-5) 38%, transparent);

  ${({ $style }) => $style === "theme1" && css`
    background: linear-gradient(135deg, var(--project-accent, #bfff00), var(--project-secondary, #ff003c));
  `}

  ${({ $style }) => $style === "theme2" && css`
    background: linear-gradient(135deg, var(--result2-2), var(--result2-5));
  `}

  ${({ $style }) => $style === "theme3" && css`
    background: linear-gradient(135deg, #f4f6f8, #c99a2e);
  `}

  @media (min-width: 2560px) {
    transform: translate(-50%, -50%) scale(1.32);
  }

  @media (max-width: 950px) {
    padding: 15px;
    transform: translate(-50%, -50%) scale(0.9);
  }
`;

const BoardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 30px;
`;

const Title = styled.h1<{ $order: number }>`
  ${animationState}
  margin: 0;
  color: var(--result2-t2);
  font-size: 46px;
  font-weight: 800;
  letter-spacing: 4px;
  line-height: 1;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.2);

  @media (max-width: 950px) {
    width: 100%;
    text-align: center;
    font-size: 36px;
  }
`;

const Standings = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;

  @media (max-width: 950px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const rowGrid = css`
  display: grid;
  grid-template-columns: 60px 100px minmax(0, 1fr) 80px 80px 90px;
  align-items: center;

  @media (max-width: 1200px) {
    grid-template-columns: 50px 90px minmax(0, 1fr) 70px 70px 75px;
  }

  @media (max-width: 500px) {
    grid-template-columns: 45px 45px minmax(0, 1fr) 50px 50px 55px;
  }
`;

const HeaderStrip = styled.div<{ $order: number }>`
  ${animationState}
  ${rowGrid}
  height: 40px;
  background: var(--result2-4);
  color: var(--result2-t3);
  clip-path: polygon(3% 0, 100% 0, 97% 100%, 0 100%);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 1px;

  b {
    padding-left: 15px;
    text-align: left;
  }

  span {
    text-align: center;
  }

  @media (max-width: 500px) {
    font-size: 11px;
  }
`;

const Row = styled.div<{ $highlight: boolean; $order: number }>`
  ${animationState}
  ${rowGrid}
  height: 60px;
  overflow: hidden;
  background: ${({ $highlight }) =>
    $highlight
      ? "linear-gradient(90deg, var(--result2-2), var(--result2-5))"
      : "linear-gradient(90deg, var(--result2-2), var(--result2-1))"};
  clip-path: polygon(2% 0, 100% 0, 98% 100%, 0 100%);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, filter 0.2s ease;

  &:hover {
    transform: scale(1.01) translateY(-2px);
    filter: brightness(1.05);
  }
`;

const Rank = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--result2-t2);
  font-size: 26px;
  font-style: italic;
  font-weight: 800;

  @media (max-width: 1200px) {
    font-size: 22px;
  }

  @media (max-width: 500px) {
    font-size: 16px;
  }
`;

const LogoCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  background: var(--result2-4);
  color: var(--result2-t3);
  clip-path: polygon(14% 0, 100% 0, 86% 100%, 0 100%);

  @media (max-width: 500px) {
    background: transparent;
    clip-path: none;
  }
`;

const TeamCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  padding-left: 15px;
  color: var(--result2-t2);

  @media (max-width: 500px) {
    padding-left: 8px;
  }
`;

const Flag = styled.img`
  width: 24px;
  height: 17px;
  object-fit: cover;

  @media (max-width: 500px) {
    display: none;
  }
`;

const Logo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: contain;

  @media (max-width: 500px) {
    width: 28px;
    height: 28px;
  }
`;

const LogoFallback = styled.span`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--result2-2), var(--result2-5));
  color: var(--result2-t2);
  font-size: 11px;
  font-weight: 800;
`;

const TeamName = styled.span`
  overflow: hidden;
  font-size: 22px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 1200px) {
    font-size: 18px;
  }

  @media (max-width: 500px) {
    font-size: 15px;
  }
`;

const Stat = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--result2-t1);
  height: 100%;
  font-size: 24px;
  font-weight: 800;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 20%;
    width: 1px;
    height: 60%;
    background: rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 1200px) {
    font-size: 20px;
  }

  @media (max-width: 500px) {
    font-size: 16px;
  }
`;

const Points = styled(Stat)`
  color: var(--result2-t2);
  font-size: 26px;

  @media (max-width: 1200px) {
    font-size: 22px;
  }

  @media (max-width: 500px) {
    font-size: 18px;
  }
`;
