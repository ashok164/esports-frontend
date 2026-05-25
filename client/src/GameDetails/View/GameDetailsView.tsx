import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  createGameDetailApi,
  deleteGameDetailApi,
  getGameDetailsApi,
  updateGameDetailApi,
} from "../Repository/remote";
import {
  GameDetail,
  getGameRecordId,
  normalizeGameDetail,
  publishActiveGameDetails,
  readStoredGameDetails,
} from "../gameDetailsState";

const emptyRow = (): GameDetail => ({
  gameNumber: "",
  roundName: "",
  phase: "",
  matchId: "",
  enabled: false,
});

const isValidRow = (row: GameDetail) =>
  row.gameNumber.trim() &&
  row.roundName.trim() &&
  row.phase.trim() &&
  row.matchId.trim();

const makeLocalId = () => `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const GameDetailsView: React.FC = () => {
  const [draftRows, setDraftRows] = useState<GameDetail[]>([emptyRow()]);
  const [games, setGames] = useState<GameDetail[]>(() => readStoredGameDetails());
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingRow, setEditingRow] = useState<GameDetail>(emptyRow());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMatchIds = useMemo(
    () => games.filter((game) => game.enabled).map((game) => game.matchId).join(","),
    [games],
  );

  const syncGames = useCallback((nextGames: GameDetail[]) => {
    setGames(nextGames);
    publishActiveGameDetails(nextGames);
  }, []);

  const loadGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getGameDetailsApi();
      const rows = Array.isArray(result) ? result.map(normalizeGameDetail) : [];

      if (rows.length > 0) {
        syncGames(rows);
      } else {
        syncGames(readStoredGameDetails());
      }
    } catch (err: any) {
      setError(err?.message || "Could not load saved game details");
      syncGames(readStoredGameDetails());
    } finally {
      setIsLoading(false);
    }
  }, [syncGames]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const updateDraftRow = (index: number, field: keyof GameDetail, value: string) => {
    setDraftRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const removeDraftRow = (index: number) => {
    setDraftRows((rows) =>
      rows.length === 1 ? [emptyRow()] : rows.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const handleSubmitRows = async () => {
    const rowsToSave = draftRows.filter(isValidRow);

    if (rowsToSave.length === 0) {
      setError("Add at least one complete game row before inserting.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const savedRows: GameDetail[] = [];

      for (const row of rowsToSave) {
        const result = await createGameDetailApi(row);
        savedRows.push(normalizeGameDetail(result?.data || result || row));
      }

      syncGames([...games, ...savedRows.map((row) => ({ ...row, id: getGameRecordId(row) || makeLocalId() }))]);
      setDraftRows([emptyRow()]);
    } catch (err: any) {
      const fallbackRows = rowsToSave.map((row) => ({ ...row, id: makeLocalId() }));
      syncGames([...games, ...fallbackRows]);
      setDraftRows([emptyRow()]);
      setError(err?.message || "API request failed. Rows were kept locally for the broadcast pages.");
    } finally {
      setIsSaving(false);
    }
  };

  const beginEdit = (game: GameDetail) => {
    setEditingId(getGameRecordId(game) || null);
    setEditingRow({ ...game });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingRow(emptyRow());
  };

  const saveEdit = async () => {
    if (!editingId || !isValidRow(editingRow)) {
      setError("Complete every field before saving the edit.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const isLocal = String(editingId).startsWith("local-");
      if (!isLocal) {
        await updateGameDetailApi(editingId, editingRow);
      }

      syncGames(
        games.map((game) =>
          String(getGameRecordId(game)) === String(editingId)
            ? { ...editingRow, id: game.id, _id: game._id }
            : game,
        ),
      );
      cancelEdit();
    } catch (err: any) {
      setError(err?.message || "Failed to update game details");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGame = async (game: GameDetail) => {
    const recordId = getGameRecordId(game);
    if (!recordId) return;

    setIsSaving(true);
    setError(null);

    try {
      if (!String(recordId).startsWith("local-")) {
        await deleteGameDetailApi(recordId);
      }

      syncGames(games.filter((row) => String(getGameRecordId(row)) !== String(recordId)));
    } catch (err: any) {
      setError(err?.message || "Failed to delete game details");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEnabled = async (game: GameDetail) => {
    const recordId = getGameRecordId(game);
    const nextGame = { ...game, enabled: !game.enabled };
    const nextGames = games.map((row) =>
      String(getGameRecordId(row)) === String(recordId) ? nextGame : row,
    );

    syncGames(nextGames);

    if (!recordId || String(recordId).startsWith("local-")) return;

    try {
      await updateGameDetailApi(recordId, nextGame);
    } catch (err: any) {
      setError(err?.message || "Switch changed locally, but API update failed.");
    }
  };

  return (
    <Page>
      <GlobalGameDetailsStyles />
      <Shell>
        <Header>
          <div>
            <Kicker>Tournament Control</Kicker>
            <Title>Game Details</Title>
          </div>
          <ActivePanel>
            <ActiveLabel>Enabled websocket match ids</ActiveLabel>
            <ActiveValue>{activeMatchIds || "No match enabled"}</ActiveValue>
          </ActivePanel>
        </Header>

        {error && <Alert>{error}</Alert>}

        <Panel>
          <PanelHeader>
            <PanelTitle>Insert rows</PanelTitle>
            <IconButton type="button" title="Add row" onClick={() => setDraftRows((rows) => [...rows, emptyRow()])}>
              <PlusIcon />
            </IconButton>
          </PanelHeader>

          <Table>
            <thead>
              <tr>
                <th>Game Number</th>
                <th>Round Name</th>
                <th>Phase</th>
                <th>Match ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {draftRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <Input value={row.gameNumber} onChange={(event) => updateDraftRow(index, "gameNumber", event.target.value)} />
                  </td>
                  <td>
                    <Input value={row.roundName} onChange={(event) => updateDraftRow(index, "roundName", event.target.value)} />
                  </td>
                  <td>
                    <Input value={row.phase} onChange={(event) => updateDraftRow(index, "phase", event.target.value)} />
                  </td>
                  <td>
                    <Input value={row.matchId} onChange={(event) => updateDraftRow(index, "matchId", event.target.value)} />
                  </td>
                  <td>
                    <ActionRow>
                      <IconButton type="button" title="Delete row" onClick={() => removeDraftRow(index)}>
                        <TrashIcon />
                      </IconButton>
                    </ActionRow>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Toolbar>
            <Button type="button" onClick={handleSubmitRows} disabled={isSaving}>
              {isSaving ? "Saving..." : "Insert Game Details"}
            </Button>
          </Toolbar>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Saved games</PanelTitle>
            <GhostText>{isLoading ? "Loading..." : `${games.length} rows`}</GhostText>
          </PanelHeader>

          <Table>
            <thead>
              <tr>
                <th>Enable</th>
                <th>Game Number</th>
                <th>Round Name</th>
                <th>Phase</th>
                <th>Match ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.length === 0 ? (
                <tr>
                  <EmptyCell colSpan={6}>No game details inserted yet.</EmptyCell>
                </tr>
              ) : (
                games.map((game) => {
                  const recordId = getGameRecordId(game) || "";
                  const isEditing = String(editingId) === String(recordId);

                  return (
                    <tr key={String(recordId)}>
                      <td>
                        <Switch>
                          <input type="checkbox" checked={Boolean(game.enabled)} onChange={() => toggleEnabled(game)} />
                          <span />
                        </Switch>
                      </td>
                      <td>
                        {isEditing ? (
                          <Input value={editingRow.gameNumber} onChange={(event) => setEditingRow((row) => ({ ...row, gameNumber: event.target.value }))} />
                        ) : (
                          game.gameNumber
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <Input value={editingRow.roundName} onChange={(event) => setEditingRow((row) => ({ ...row, roundName: event.target.value }))} />
                        ) : (
                          game.roundName
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <Input value={editingRow.phase} onChange={(event) => setEditingRow((row) => ({ ...row, phase: event.target.value }))} />
                        ) : (
                          game.phase
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <Input value={editingRow.matchId} onChange={(event) => setEditingRow((row) => ({ ...row, matchId: event.target.value }))} />
                        ) : (
                          <Mono>{game.matchId}</Mono>
                        )}
                      </td>
                      <td>
                        <ActionRow>
                          {isEditing ? (
                            <>
                              <IconButton type="button" title="Save edit" onClick={saveEdit}>
                                <CheckIcon />
                              </IconButton>
                              <IconButton type="button" title="Cancel edit" onClick={cancelEdit}>
                                <CloseIcon />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton type="button" title="Edit game" onClick={() => beginEdit(game)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton type="button" title="Delete game" onClick={() => deleteGame(game)}>
                                <TrashIcon />
                              </IconButton>
                            </>
                          )}
                        </ActionRow>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Panel>
      </Shell>
    </Page>
  );
};

export default GameDetailsView;

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

const PlusIcon = () => <IconBase><path {...strokeProps} d="M12 5v14M5 12h14" /></IconBase>;
const EditIcon = () => <IconBase><path {...strokeProps} d="M12 20h9" /><path {...strokeProps} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></IconBase>;
const TrashIcon = () => <IconBase><path {...strokeProps} d="M3 6h18" /><path {...strokeProps} d="M8 6V4h8v2" /><path {...strokeProps} d="M6 6l1 15h10l1-15" /></IconBase>;
const CheckIcon = () => <IconBase><path {...strokeProps} d="m20 6-11 11-5-5" /></IconBase>;
const CloseIcon = () => <IconBase><path {...strokeProps} d="M18 6 6 18M6 6l12 12" /></IconBase>;

const GlobalGameDetailsStyles = createGlobalStyle`
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
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;

  @media (max-width: 760px) {
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

const ActivePanel = styled.div`
  min-width: min(430px, 100%);
  padding: 14px 16px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
`;

const ActiveLabel = styled.div`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const ActiveValue = styled.div`
  margin-top: 6px;
  color: var(--project-text-primary, #ffffff);
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

const Table = styled.table`
  width: 100%;
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
    font-size: 0.75rem;
    text-transform: uppercase;
  }

  @media (max-width: 840px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const Input = styled.input`
  width: 100%;
  min-height: 38px;
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #ffffff);
  padding: 0 10px;
  font: inherit;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
`;

const Button = styled.button`
  min-height: 40px;
  border: 0;
  border-radius: 6px;
  background: var(--project-primary, #ef4444);
  color: #ffffff;
  padding: 0 16px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
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
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
`;

const Switch = styled.label`
  position: relative;
  display: inline-flex;
  width: 46px;
  height: 26px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: rgba(71, 85, 105, 0.8);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  span::before {
    content: "";
    position: absolute;
    width: 20px;
    height: 20px;
    left: 3px;
    top: 3px;
    border-radius: 50%;
    background: #ffffff;
    transition: transform 0.15s ease;
  }

  input:checked + span {
    background: var(--project-accent, #22c55e);
  }

  input:checked + span::before {
    transform: translateX(20px);
  }
`;

const Mono = styled.span`
  font-family: "SFMono-Regular", Consolas, monospace;
  overflow-wrap: anywhere;
`;

const EmptyCell = styled.td`
  color: var(--project-text-secondary, #94a3b8);
  text-align: center !important;
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
