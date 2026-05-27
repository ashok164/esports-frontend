import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getLeagueStageResultGameDetails,
  getResultGameDetails,
  getTodaysResultGameDetails,
} from "../../GameDetails/gameDetailsState";
import {
  getResultByMatchIdApi,
  getResultsByMatchIdsApi,
  ResultRow,
} from "../repository/remote";

type ResultTab = "result" | "today" | "league";

type ResultBroadcastViewProps = {
  initialTab?: ResultTab;
};

type TabConfig = {
  key: ResultTab;
  title: string;
  kicker: string;
  panelTitle: string;
  emptyText: string;
};

const tabs: TabConfig[] = [
  {
    key: "result",
    title: "Result",
    kicker: "Last Match Standing",
    panelTitle: "Result DB",
    emptyText: "No result data loaded yet.",
  },
  {
    key: "today",
    title: "Today's Result",
    kicker: "Enabled Match Standing",
    panelTitle: "Today's Result DB",
    emptyText: "No today's result data loaded yet.",
  },
  {
    key: "league",
    title: "League Stage Result",
    kicker: "League Standing",
    panelTitle: "League Stage Result DB",
    emptyText: "No league stage result data loaded yet.",
  },
];

const pick = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return "";
};

const normalizeResultRow = (row: any, fallbackMatchIds = ""): ResultRow => ({
  id: row?.id,
  _id: row?._id,
  matchIds: String(row?.matchIds ?? row?.match_ids ?? row?.match_id ?? fallbackMatchIds),
  teamId: String(pick(row, ["teamId", "team_id", "teamID", "teamid"])),
  teamLogo: String(pick(row, ["teamLogo", "team_logo", "logo"])),
  countryLogo: String(pick(row, ["countryLogo", "country_logo", "flag"])),
  teamName: String(pick(row, ["teamName", "team_name", "name"])),
  teamTag: String(pick(row, ["teamTag", "team_tag", "shortTag", "short_tag", "tag"])),
  kills: pick(row, ["kills", "kill_score", "kill", "totalKills", "total_kills"]) || 0,
  placement: pick(row, ["placement", "rank", "match_rank", "survival_score"]) || 0,
  booyahCount: pick(row, ["booyahCount", "booyah_count", "booyah", "winCount"]) || 0,
  totalKills: pick(row, ["totalScore", "total_score", "totalKills", "overallScore", "overall_score"]) || 0,
});

const collectRows = (payload: any): any[] => {
  const data = payload?.data || payload;
  const rows =
    data?.results ||
    data?.result ||
    data?.totalResults ||
    data?.total_results ||
    data?.standings ||
    data;

  return Array.isArray(rows) ? rows : rows ? [rows] : [];
};

const sortRows = (rows: ResultRow[]) =>
  [...rows].sort((left, right) => {
    const leftScore = Number(left.totalKills);
    const rightScore = Number(right.totalKills);

    if (Number.isFinite(leftScore) && Number.isFinite(rightScore) && leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return String(left.teamName).localeCompare(String(right.teamName));
  });

const splitMatchIds = (matchIds: string) =>
  matchIds
    .split(",")
    .map((matchId) => matchId.trim())
    .filter(Boolean);

const uniqueMatchIds = (matchIds: string[]) => Array.from(new Set(matchIds.filter(Boolean)));

const getTodaysMatchIds = () => splitMatchIds(getTodaysResultGameDetails().matchIds);

const getLeagueStageMatchIds = () => uniqueMatchIds(splitMatchIds(getLeagueStageResultGameDetails().matchIds));

const resultDownloadHeaders = [
  "Match ID",
  "Team ID",
  "Team Logo URL",
  "Country Logo URL",
  "Team Name",
  "Team Tag",
  "Kills",
  "Placement",
  "Booyah Count",
  "Total Score",
];

const escapeCsvValue = (value: unknown) => {
  const rawValue = String(value ?? "");
  const safeValue = /^[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue;

  return `"${safeValue.replace(/"/g, '""')}"`;
};

const downloadResultCsv = (rows: ResultRow[], filename: string) => {
  const csvRows = [
    resultDownloadHeaders,
    ...sortRows(rows).map((row) => [
      row.matchIds,
      row.teamId,
      row.teamLogo,
      row.countryLogo,
      row.teamName,
      row.teamTag,
      row.kills,
      row.placement,
      row.booyahCount,
      row.totalKills,
    ]),
  ];
  const csvContent = csvRows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const ResultBroadcastView: React.FC<ResultBroadcastViewProps> = ({ initialTab = "result" }) => {
  const [activeTab, setActiveTab] = useState<ResultTab>(initialTab);
  const [resultMatchId, setResultMatchId] = useState(getResultGameDetails().matchIds.split(",")[0]?.trim() || "");
  const [todayMatchIds, setTodayMatchIds] = useState(getTodaysMatchIds());
  const [leagueMatchIds, setLeagueMatchIds] = useState(getLeagueStageMatchIds());
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const lastAutoLoadedKey = useRef<string | null>(null);

  const activeConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];
  const activeMatchIds = useMemo(() => {
    if (activeTab === "result") return resultMatchId ? [resultMatchId] : [];
    if (activeTab === "today") return todayMatchIds;
    return leagueMatchIds;
  }, [activeTab, leagueMatchIds, resultMatchId, todayMatchIds]);
  const activeMatchKey = activeMatchIds.join(",");

  useEffect(() => {
    const updateMatchIds = () => {
      setResultMatchId(getResultGameDetails().matchIds.split(",")[0]?.trim() || "");

      setTodayMatchIds(getTodaysMatchIds());
      setLeagueMatchIds(getLeagueStageMatchIds());
    };

    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, updateMatchIds);
    window.addEventListener("storage", updateMatchIds);

    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, updateMatchIds);
      window.removeEventListener("storage", updateMatchIds);
    };
  }, []);

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (activeMatchIds.length === 0) {
        setRows([]);
        setStatus("No match IDs are available for this result tab.");
        return;
      }

      if (activeTab === "result") {
        const matchId = activeMatchIds[0];
        const payload = await getResultByMatchIdApi(matchId);
        setRows(sortRows(collectRows(payload).map((row) => normalizeResultRow(row, matchId))));
        setStatus(`Loaded result from match ID ${matchId}.`);
        return;
      }

      const payload = await getResultsByMatchIdsApi(activeMatchIds);
      setRows(sortRows(collectRows(payload).map((row) => normalizeResultRow(row, activeMatchKey))));
      setStatus(`Loaded ${activeConfig.title.toLowerCase()} from ${activeMatchIds.length} match IDs.`);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || "Failed to load result");
    } finally {
      setIsLoading(false);
    }
  }, [activeConfig.title, activeMatchIds, activeMatchKey, activeTab]);

  useEffect(() => {
    const loadKey = `${activeTab}:${activeMatchKey}`;

    if (lastAutoLoadedKey.current === loadKey) return;

    lastAutoLoadedKey.current = loadKey;
    loadResults();
  }, [activeMatchKey, activeTab, loadResults]);

  const downloadResults = () => {
    if (rows.length === 0) return;

    const filenamePrefix =
      activeTab === "league" ? "league-stage-result" : activeTab === "today" ? "todays-result" : "result";
    const timestamp = new Date().toISOString().slice(0, 10);

    downloadResultCsv(sortRows(rows), `${filenamePrefix}-${timestamp}.csv`);
    setStatus(`Downloaded ${rows.length} rows.`);
  };

  return (
    <Page>
      <GlobalStyles />
      <Shell>
        <Header>
          <div>
            <Kicker>{activeConfig.kicker}</Kicker>
            <Title>{activeConfig.title}</Title>
            <Meta>{activeMatchKey || "No match selected"}</Meta>
          </div>
          <HeaderActions>
            <Tabs aria-label="Result type">
              {tabs.map((tab) => (
                <TabButton key={tab.key} type="button" $active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                  {tab.title}
                </TabButton>
              ))}
            </Tabs>
            <IconButton type="button" title="Download result sheet" onClick={downloadResults} disabled={rows.length === 0}>
              <DownloadIcon />
            </IconButton>
          </HeaderActions>
        </Header>

        {error && <Alert>{error}</Alert>}

        <Panel>
          <PanelHeader>
            <PanelTitle>{activeConfig.panelTitle}</PanelTitle>
            <GhostText>{isLoading ? "Loading..." : status || `${rows.length} rows`}</GhostText>
          </PanelHeader>

          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Team ID</th>
                  <th>Team Logo</th>
                  <th>Country Logo</th>
                  <th>Team Name</th>
                  <th>Team Tag</th>
                  <th>Kills</th>
                  <th>Placement</th>
                  <th>Booyah Count</th>
                  <th>Total Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <EmptyCell colSpan={10}>{activeConfig.emptyText}</EmptyCell>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${row.matchIds}-${row.teamId}-${row.teamName}-${index}`}>
                      <td><Mono>{row.matchIds}</Mono></td>
                      <td><Mono>{row.teamId}</Mono></td>
                      <td>{row.teamLogo ? <LogoImage src={String(row.teamLogo)} alt="Team logo" /> : <Muted>Empty</Muted>}</td>
                      <td>{row.countryLogo ? <LogoImage src={String(row.countryLogo)} alt="Country logo" /> : <Muted>Empty</Muted>}</td>
                      <td>{row.teamName}</td>
                      <td>{row.teamTag}</td>
                      <td>{row.kills}</td>
                      <td>{row.placement}</td>
                      <td>{row.booyahCount}</td>
                      <td>{row.totalKills}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>
      </Shell>
    </Page>
  );
};

export default ResultBroadcastView;

const IconBase = ({ children }: { children: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {children}
  </svg>
);

const strokeProps = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const DownloadIcon = () => <IconBase><path {...strokeProps} d="M12 3v12" /><path {...strokeProps} d="m7 10 5 5 5-5" /><path {...strokeProps} d="M5 21h14" /></IconBase>;

const GlobalStyles = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #0a0f18);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  background:
    linear-gradient(180deg, var(--project-background, #0a0f18), var(--project-surface, #101722));
  color: var(--project-text-primary, #e5edf8);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.div`
  width: min(1320px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;

  @media (max-width: 980px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Kicker = styled.div`
  color: var(--project-accent, #5eead4);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 6px 0 0;
  color: var(--project-text-primary, #ffffff);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: stretch;
  gap: 10px;

  @media (max-width: 680px) {
    flex-direction: column;
  }
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.62);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  min-height: 42px;
  padding: 0 14px;
  border: 0;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  background: ${({ $active }) => ($active ? "rgba(var(--project-accent-rgb, 94, 234, 212), 0.18)" : "transparent")};
  color: ${({ $active }) => ($active ? "var(--project-text-primary, #ffffff)" : "var(--project-text-secondary, #94a3b8)")};
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;

  &:last-child {
    border-right: 0;
  }

  &:hover {
    color: var(--project-text-primary, #ffffff);
  }

  @media (max-width: 680px) {
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);

    &:last-child {
      border-bottom: 0;
    }
  }
`;

const IconButton = styled.button`
  width: 42px;
  min-width: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.62);
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;

  &:hover {
    border-color: var(--project-accent, #5eead4);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 680px) {
    width: 100%;
  }
`;

const Meta = styled.div`
  margin-top: 10px;
  color: var(--project-text-secondary, #94a3b8);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
`;

const Panel = styled.section`
  margin-top: 16px;
  padding: 18px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const GhostText = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.86rem;
  font-weight: 700;
`;

const Alert = styled.div`
  padding: 12px 14px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.34);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  color: var(--project-text-primary, #ffffff);
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: 10px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.73rem;
    text-transform: uppercase;
  }
`;

const LogoImage = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.08);
`;

const Mono = styled.span`
  font-family: "SFMono-Regular", Consolas, monospace;
  overflow-wrap: anywhere;
`;

const Muted = styled.span`
  color: var(--project-text-secondary, #94a3b8);
`;

const EmptyCell = styled.td`
  color: var(--project-text-secondary, #94a3b8);
  text-align: center !important;
`;
