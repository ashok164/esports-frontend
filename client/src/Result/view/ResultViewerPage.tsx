import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { getGameDetailsApi } from "../../GameDetails/Repository/remote";
import { GameDetail, normalizeGameDetail } from "../../GameDetails/gameDetailsState";
import {
  deleteResultsByMatchIdApi,
  getResultByMatchIdApi,
  getResultInventoryApi,
  ResultInventoryRow,
  ResultRow,
} from "../repository/remote";

const pickRows = (payload: any): ResultRow[] => {
  const data = payload?.data || payload;
  const rows = data?.results || data?.result || data?.standings || data;

  return Array.isArray(rows) ? rows : rows ? [rows] : [];
};

const getRowMatchId = (row: ResultRow, fallback: string) =>
  String(row.matchIds ?? row.match_id ?? row.matchId ?? fallback);

const getGameLabel = (game: GameDetail) =>
  [game.gameNumber && `Game ${game.gameNumber}`, game.roundName, game.phase]
    .filter(Boolean)
    .join(" / ") || game.matchId;

const getInventoryLabel = (row: ResultInventoryRow) => {
  const detail = row.gameDetail;
  if (!detail) return "Saved result only";

  return [
    detail.gameNumber && `Game ${detail.gameNumber}`,
    detail.roundName,
    detail.phase,
  ]
    .filter(Boolean)
    .join(" / ") || row.matchId;
};

const ResultViewerPage: React.FC = () => {
  const [games, setGames] = useState<GameDetail[]>([]);
  const [matchId, setMatchId] = useState("");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [inventory, setInventory] = useState<ResultInventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Select or enter a match ID to view saved results.");

  const matchOptions = useMemo(
    () => games.filter((game) => game.matchId.trim()),
    [games],
  );
  const knownMatchIds = useMemo(
    () => new Set(matchOptions.map((game) => game.matchId.trim()).filter(Boolean)),
    [matchOptions],
  );
  const staleMatches = useMemo(
    () => inventory.filter((item) => item.stale),
    [inventory],
  );

  const loadGames = useCallback(async () => {
    try {
      const response = await getGameDetailsApi();
      const nextGames = Array.isArray(response)
        ? response.map(normalizeGameDetail)
        : [];

      setGames(nextGames);
      setMatchId((current) => {
        if (current.trim()) return current;
        return (
          nextGames.find((game) => game.resultEnabled && game.matchId.trim())?.matchId ||
          nextGames.find((game) => game.matchId.trim())?.matchId ||
          ""
        );
      });
    } catch {
      setGames([]);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    setIsInventoryLoading(true);

    try {
      const response = await getResultInventoryApi();
      const nextInventory = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setInventory(nextInventory);
    } catch {
      setInventory([]);
    } finally {
      setIsInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
    loadInventory();
  }, [loadGames, loadInventory]);

  useEffect(() => {
    const refresh = () => {
      loadGames();
      loadInventory();
    };

    const intervalId = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
    };
  }, [loadGames, loadInventory]);

  const loadResults = useCallback(async () => {
    const selectedMatchId = matchId.trim();

    if (!selectedMatchId) {
      setRows([]);
      setStatus("No match ID selected.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getResultByMatchIdApi(selectedMatchId);
      const nextRows = pickRows(response);

      setRows(nextRows);
      setStatus(`Loaded ${nextRows.length} result rows for match ${selectedMatchId}.`);
    } catch (err: any) {
      setRows([]);
      setError(err?.response?.data?.message || err?.message || "Could not load result rows.");
      setStatus("Load failed.");
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId.trim()) {
      loadResults();
    }
  }, [loadResults, matchId]);

  const deleteMatchResults = async (targetMatchId: string, rowCount?: number) => {
    const selectedMatchId = targetMatchId.trim();
    if (!selectedMatchId) return;

    const countLabel = typeof rowCount === "number" ? ` (${rowCount} rows)` : "";
    if (!window.confirm(`Delete saved result data for ${selectedMatchId}${countLabel}?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteResultsByMatchIdApi(selectedMatchId);
      if (matchId.trim() === selectedMatchId) {
        setRows([]);
      }
      setStatus(`Deleted saved result data for ${selectedMatchId}.`);
      await Promise.all([loadInventory(), loadGames()]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not delete saved result data.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAllRows = async () => {
    if (rows.length === 0) return;
    await deleteMatchResults(matchId, rows.length);
  };

  return (
    <Page>
      <GlobalViewerStyles />
      <Shell>
        <Header>
          <div>
            <Kicker>Tournament Control</Kicker>
            <Title>Result Viewer</Title>
          </div>
          <HeaderActions>
            <Select value={matchId} onChange={(event) => setMatchId(event.target.value)}>
              <option value="">Select match ID</option>
              {matchOptions.map((game) => (
                <option key={`${game.matchId}-${game.gameNumber}`} value={game.matchId}>
                  {game.matchId} - {getGameLabel(game)}
                </option>
              ))}
            </Select>
            <Input
              value={matchId}
              onChange={(event) => setMatchId(event.target.value)}
              placeholder="Match ID"
            />
            <Button type="button" onClick={loadResults} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load"}
            </Button>
            <DangerButton type="button" onClick={deleteAllRows} disabled={isDeleting || rows.length === 0}>
              Delete All
            </DangerButton>
          </HeaderActions>
        </Header>

        {error && <Alert>{error}</Alert>}
        <Notice>{status}</Notice>

        <Panel>
          <PanelHeader>
            <PanelTitle>Saved Results</PanelTitle>
            <GhostText>{rows.length} rows</GhostText>
          </PanelHeader>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Team ID</th>
                  <th>Team</th>
                  <th>Tag</th>
                  <th>Kills</th>
                  <th>Placement</th>
                  <th>Booyah</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><EmptyCell colSpan={8}>No saved result rows for this match.</EmptyCell></tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${row.teamId}-${row.teamName}-${index}`}>
                      <td><Mono>{getRowMatchId(row, matchId)}</Mono></td>
                      <td><Mono>{row.teamId || row.permanentTeamId || "-"}</Mono></td>
                      <td>{row.teamName || row.team_name || "-"}</td>
                      <td>{row.teamTag || row.team_tag || "-"}</td>
                      <td>{row.kills ?? row.kill_score ?? 0}</td>
                      <td>{row.placement ?? row.survival_score ?? 0}</td>
                      <td>{row.booyahCount ?? row.booyah_count ?? 0}</td>
                      <td>{row.totalKills ?? row.total_score ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Saved Match Inventory</PanelTitle>
            <GhostText>
              {isInventoryLoading
                ? "Scanning..."
                : `${inventory.length} match IDs · ${staleMatches.length} garbage`}
            </GhostText>
          </PanelHeader>
          {staleMatches.length > 0 ? (
            <InventoryNotice>
              Garbage data found for {staleMatches.length} saved match ID{staleMatches.length === 1 ? "" : "s"} outside the current game details list.
            </InventoryNotice>
          ) : (
            <InventoryHint>No stale match IDs found outside game details.</InventoryHint>
          )}
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>Players</th>
                  <th>Total</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr><EmptyCell colSpan={8}>No saved result match IDs found.</EmptyCell></tr>
                ) : (
                  inventory.map((item) => {
                    const isCurrent = matchId.trim() === item.matchId;
                    const isListedGame = knownMatchIds.has(item.matchId);

                    return (
                      <tr key={item.matchId}>
                        <td><Mono>{item.matchId}</Mono></td>
                        <td>{getInventoryLabel(item)}</td>
                        <td>
                          <StatusPill $stale={item.stale}>
                            {item.stale ? "Garbage" : isListedGame ? "Game detail" : "Saved only"}
                          </StatusPill>
                        </td>
                        <td>{item.resultRowCount}</td>
                        <td>{item.playerRowCount}</td>
                        <td>{item.totalScore}</td>
                        <td>{item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : "-"}</td>
                        <td>
                          <ActionRow>
                            <Button type="button" onClick={() => setMatchId(item.matchId)} disabled={isLoading}>
                              {isCurrent ? "Viewing" : "View"}
                            </Button>
                            <DangerButton type="button" onClick={() => deleteMatchResults(item.matchId, item.resultRowCount)} disabled={isDeleting}>
                              Delete
                            </DangerButton>
                          </ActionRow>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>
      </Shell>
    </Page>
  );
};

export default ResultViewerPage;

const GlobalViewerStyles = createGlobalStyle`
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
  background: linear-gradient(180deg, var(--project-background, #0a0f18), var(--project-surface, #101722));
  color: var(--project-text-primary, #e5edf8);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.div`
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 16px;

  @media (max-width: 900px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const HeaderActions = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(220px, 320px) auto auto;
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
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

const inputStyles = `
  min-height: 42px;
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #ffffff);
  padding: 0 12px;
  font: inherit;
`;

const Input = styled.input`
  ${inputStyles}
`;

const Select = styled.select`
  ${inputStyles}
`;

const Button = styled.button`
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: var(--project-accent, #5eead4);
  color: #020617;
  padding: 0 16px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const DangerButton = styled(Button)`
  background: var(--project-danger, #dc2626);
  color: #ffffff;
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

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: 10px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    text-align: left;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }

  th {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.73rem;
    text-transform: uppercase;
  }
`;

const Notice = styled.div`
  padding: 12px 14px;
  border: 1px solid rgba(var(--project-accent-rgb, 94, 234, 212), 0.28);
  border-radius: 8px;
  background: rgba(var(--project-accent-rgb, 94, 234, 212), 0.1);
`;

const Alert = styled(Notice)`
  margin-bottom: 12px;
  border-color: rgba(var(--project-danger-rgb, 239, 68, 68), 0.34);
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
`;

const GhostText = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.86rem;
  font-weight: 700;
`;

const InventoryHint = styled.div`
  margin-bottom: 14px;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.94rem;
`;

const InventoryNotice = styled.div`
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(248, 113, 113, 0.34);
  border-radius: 8px;
  background: rgba(127, 29, 29, 0.26);
  color: #fecaca;
  font-size: 0.94rem;
`;

const Mono = styled.span`
  font-family: "SFMono-Regular", Consolas, monospace;
`;

const StatusPill = styled.span<{ $stale: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid ${({ $stale }) => ($stale ? "rgba(248, 113, 113, 0.34)" : "rgba(94, 234, 212, 0.28)")};
  background: ${({ $stale }) => ($stale ? "rgba(127, 29, 29, 0.26)" : "rgba(15, 118, 110, 0.18)")};
  color: ${({ $stale }) => ($stale ? "#fecaca" : "#ccfbf1")};
  font-size: 0.82rem;
  font-weight: 700;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const EmptyCell = styled.td`
  color: var(--project-text-secondary, #94a3b8);
  text-align: center !important;
`;
