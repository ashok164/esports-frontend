import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { css } from "styled-components";
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
          "--result2-1": "#12161a",
          "--result2-2": "#ffffff",
          "--result2-3": "#ff1010",
          "--result2-4": "#08090b",
          "--result2-5": "#ff1010",
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

  if (loading) return null;

  return (
    <Overlay $style={style} data-style={style} style={colors}>
      <Heading>
        <Title>{title}</Title>
        <ColumnsLabel><span>TEAM</span><span>ELIMS</span><span>PTS</span></ColumnsLabel>
      </Heading>
      <Columns>
        <StandingColumn>{leftRows.map((row, index) => <StandingRow key={`${row.teamId}-${index}`} row={row} rank={index + 1} />)}</StandingColumn>
        <StandingColumn>{rightRows.map((row, index) => <StandingRow key={`${row.teamId}-${index + 6}`} row={row} rank={index + 7} />)}</StandingColumn>
      </Columns>
    </Overlay>
  );
};

const StandingRow: React.FC<{ row: ResultRow; rank: number }> = ({ row, rank }) => (
  <Row>
    <Rank>{String(rank).padStart(2, "0")}</Rank>
    <TeamCell>
      {row.teamLogo ? <Logo src={row.teamLogo} alt="" /> : null}
      <TeamName>{row.teamTag || row.teamName || "TEAM"}</TeamName>
    </TeamCell>
    <Stat>{Number(row.kills) || 0}</Stat>
    <Points>{Number(row.totalKills) || 0}</Points>
  </Row>
);

export default ResultStandingsBroadcast;

const Overlay = styled.section<{ $style: "theme1" | "theme2" | "theme3" }>`
  position: fixed;
  top: 22px;
  left: 50%;
  z-index: 9999;
  width: 900px;
  overflow: hidden;
  color: #fff;
  font-family: "Oswald", "Roboto Condensed", "Arial Narrow", sans-serif;
  text-transform: uppercase;
  transform: translateX(-50%);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.38);

  ${({ $style }) => $style === "theme1" && css`
    border: 3px solid var(--project-secondary, #ff003c);
    background: var(--project-surface, #111116);
  `}

  ${({ $style }) => $style === "theme2" && css`
    border: 1px solid var(--result2-4);
    background: var(--result2-1);
  `}

  ${({ $style }) => $style === "theme3" && css`
    border: 3px solid #ff1010;
    background: #12161a;
  `}

  @media (min-width: 2560px) {
    transform: translateX(-50%) scale(1.96);
    transform-origin: center top;
  }
`;

const Heading = styled.header`
  display: grid;
  grid-template-columns: 1fr 390px;
  min-height: 52px;
  align-items: center;
  padding: 0 16px;
  background: var(--result2-3);

  ${Overlay}[data-style="theme1"] & { background: var(--project-primary, #4a159d); }
  ${Overlay}[data-style="theme3"] & { background: #ff1010; }
`;

const Title = styled.h1`
  margin: 0;
  color: var(--result2-t3);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1;
`;

const ColumnsLabel = styled.div`
  display: grid;
  grid-template-columns: 1fr 58px 52px;
  gap: 10px;
  color: var(--result2-t3);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-align: center;
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  background: var(--result2-4);
`;

const StandingColumn = styled.div`
  display: grid;
  gap: 2px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 58px 52px;
  height: 42px;
  background: var(--result2-1);
`;

const Rank = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--result2-2);
  color: var(--result2-t2);
  font-size: 20px;
  font-style: italic;
  font-weight: 900;
`;

const TeamCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  background: var(--result2-2);
  color: var(--result2-t2);
`;

const Logo = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`;

const TeamName = styled.span`
  overflow: hidden;
  font-size: 18px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--result2-t1);
  font-size: 19px;
  font-weight: 800;
`;

const Points = styled(Stat)`
  background: var(--result2-5);
  color: var(--result2-t3);
`;
