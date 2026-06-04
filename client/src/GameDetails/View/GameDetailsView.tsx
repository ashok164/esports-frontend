import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  createMatchTeamMappingsApi,
  createMappingTemplateApi,
  createGameDetailApi,
  deleteGameDetailApi,
  deleteMappingTemplateApi,
  getGameDetailsApi,
  getMappingTemplatesApi,
  updateGameDetailApi,
} from "../Repository/remote";
import { getTeamTableApi } from "../../TeamRecordTable/Repositary/remote";
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
  mappingTemplateId: "",
  enabled: false,
  resultEnabled: false,
  todaysResultEnabled: false,
  leagueStageResultEnabled: false,
});

const isValidRow = (row: GameDetail) =>
  row.gameNumber.trim() &&
  row.roundName.trim() &&
  row.phase.trim() &&
  row.matchId.trim();

const makeLocalId = () => `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type TeamOption = {
  teamId: string;
  teamName: string;
  teamTag: string;
};

type MappingRow = {
  roomTeamId: string;
  permanentTeamId: string;
  teamName: string;
  teamTag: string;
};

type MappingTemplate = {
  id: string;
  _id?: string;
  name: string;
  mappings: Array<MappingRow & { slotNumber?: number }>;
  updatedAt: string;
};

const emptyMappingRows = (): MappingRow[] =>
  Array.from({ length: 12 }, (_, index) => ({
    roomTeamId: String(index + 1),
    permanentTeamId: "",
    teamName: "",
    teamTag: "",
  }));

const mergeResultSwitches = (game: GameDetail, fallback?: GameDetail): GameDetail => ({
  ...game,
  mappingTemplateId: game.mappingTemplateId || "",
  resultEnabled: Boolean(game.resultEnabled || fallback?.resultEnabled),
  todaysResultEnabled: Boolean(game.todaysResultEnabled || fallback?.todaysResultEnabled),
  leagueStageResultEnabled: Boolean(game.leagueStageResultEnabled || fallback?.leagueStageResultEnabled),
});

const normalizeMappingTemplate = (template: any): MappingTemplate => ({
  id: String(template?.id || template?._id || ""),
  _id: template?._id,
  name: String(template?.name || template?.mappingName || template?.mapping_name || "Saved mapping"),
  updatedAt: String(template?.updatedAt || template?.updated_at || new Date().toISOString()),
  mappings: (Array.isArray(template?.mappings) ? template.mappings : [])
    .map((mapping: any, index: number) => ({
      roomTeamId: String(mapping?.roomTeamId ?? mapping?.room_team_id ?? index + 1),
      permanentTeamId: String(mapping?.permanentTeamId ?? mapping?.permanent_team_id ?? ""),
      teamName: String(mapping?.teamName ?? mapping?.team_name ?? ""),
      teamTag: String(mapping?.teamTag ?? mapping?.team_tag ?? ""),
      slotNumber: Number(mapping?.slotNumber ?? mapping?.slot_number ?? index + 1),
    }))
    .filter((mapping: MappingRow) => mapping.roomTeamId && mapping.permanentTeamId),
});

const GameDetailsView: React.FC = () => {
  const [draftRows, setDraftRows] = useState<GameDetail[]>([emptyRow()]);
  const [games, setGames] = useState<GameDetail[]>(() => readStoredGameDetails());
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingRow, setEditingRow] = useState<GameDetail>(emptyRow());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappingTemplateName, setMappingTemplateName] = useState("");
  const [mappingTemplates, setMappingTemplates] = useState<MappingTemplate[]>([]);
  const [mappingRows, setMappingRows] = useState<MappingRow[]>(emptyMappingRows);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [isMappingLoading, setIsMappingLoading] = useState(false);
  const [isMappingSaving, setIsMappingSaving] = useState(false);

  const activeMatchIds = useMemo(
    () => games.filter((game) => game.enabled).map((game) => game.matchId).join(","),
    [games],
  );
  const resultMatchIds = useMemo(
    () => games.filter((game) => game.resultEnabled).map((game) => game.matchId).join(","),
    [games],
  );
  const todaysResultMatchIds = useMemo(
    () => games.filter((game) => game.todaysResultEnabled).map((game) => game.matchId).join(","),
    [games],
  );
  const leagueStageResultMatchIds = useMemo(
    () => games.filter((game) => game.leagueStageResultEnabled).map((game) => game.matchId).join(","),
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
      const storedRows = readStoredGameDetails();
      const rows = Array.isArray(result)
        ? result.map((item) => {
            const normalized = normalizeGameDetail(item);
            const storedMatch = storedRows.find((row) =>
              String(getGameRecordId(row)) === String(getGameRecordId(normalized)) ||
              (row.matchId && row.matchId === normalized.matchId),
            );

            return mergeResultSwitches(normalized, storedMatch);
          })
        : [];

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

  const loadMappingTemplates = useCallback(async () => {
    setIsMappingLoading(true);
    setError(null);

    try {
      const response = await getMappingTemplatesApi();
      const templates = (Array.isArray(response) ? response : []).map(normalizeMappingTemplate);
      setMappingTemplates(templates);
    } catch (err: any) {
      setError(err?.message || "Could not load saved mapping templates.");
    } finally {
      setIsMappingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMappingTemplates();
  }, [loadMappingTemplates]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await getTeamTableApi();
        setTeamOptions(
          (Array.isArray(teams) ? teams : []).map((team: any) => ({
            teamId: String(team.team_id || team.teamId || ""),
            teamName: String(team.team_name || team.teamName || ""),
            teamTag: String(team.short_tag || team.teamTag || team.shortTag || ""),
          })).filter((team: TeamOption) => team.teamId),
        );
      } catch (err: any) {
        setError(err?.message || "Could not load tournament teams for mapping.");
      }
    };

    loadTeams();
  }, []);

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

  const applyTemplateToMatch = async (matchId: string, templateId?: string) => {
    const template = mappingTemplates.find((item) => item.id === templateId);
    if (!template || !matchId.trim()) return;

    const mappings = template.mappings.map((mapping) => {
      const selectedTeam = teamOptions.find(
        (team) => String(team.teamId) === String(mapping.permanentTeamId),
      );

      return {
        matchId: matchId.trim(),
        roomTeamId: mapping.roomTeamId,
        permanentTeamId: mapping.permanentTeamId,
        teamName: mapping.teamName || selectedTeam?.teamName || "",
        teamTag: mapping.teamTag || selectedTeam?.teamTag || "",
      };
    });

    await createMatchTeamMappingsApi(mappings);
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
        await applyTemplateToMatch(row.matchId, row.mappingTemplateId);
        savedRows.push(mergeResultSwitches(normalizeGameDetail(result?.data || result || row), row));
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
      await applyTemplateToMatch(editingRow.matchId, editingRow.mappingTemplateId);

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
    await toggleGameFlag(game, "enabled");
  };

  const toggleGameFlag = async (game: GameDetail, field: keyof Pick<GameDetail, "enabled" | "resultEnabled" | "todaysResultEnabled" | "leagueStageResultEnabled">) => {
    const recordId = getGameRecordId(game);
    const nextGame = { ...game, [field]: !game[field] };
    const nextGames = games.map((row) =>
      String(getGameRecordId(row)) === String(recordId)
        ? nextGame
        : row,
    );

    syncGames(nextGames);

    if (!recordId || String(recordId).startsWith("local-")) return;

    try {
      await updateGameDetailApi(recordId, nextGame);
    } catch (err: any) {
      setError(err?.message || "Switch changed locally, but API update failed.");
    }
  };

  const updateMappingRow = (index: number, field: keyof MappingRow, value: string) => {
    setMappingRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addMappingRow = () => {
    setMappingRows((rows) => [
      ...rows,
      {
        roomTeamId: String(rows.length + 1),
        permanentTeamId: "",
        teamName: "",
        teamTag: "",
      },
    ]);
  };

  const removeMappingRow = (index: number) => {
    setMappingRows((rows) =>
      rows.length === 1
        ? [{ roomTeamId: "1", permanentTeamId: "", teamName: "", teamTag: "" }]
        : rows.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const saveMappings = async () => {
    if (!mappingTemplateName.trim()) {
      setError("Enter a mapping name before saving.");
      return;
    }

    const mappings = mappingRows
      .filter((row) => row.roomTeamId.trim() && row.permanentTeamId.trim())
      .map((row, index) => ({
        roomTeamId: row.roomTeamId.trim(),
        permanentTeamId: row.permanentTeamId.trim(),
        teamName: row.teamName.trim(),
        teamTag: row.teamTag.trim(),
        slotNumber: index + 1,
      }));

    if (mappings.length === 0) {
      setError("Map at least one room team before saving.");
      return;
    }

    setIsMappingSaving(true);
    setError(null);

    try {
      const payload = {
        name: mappingTemplateName.trim(),
        mappings,
      };
      const savedTemplate = await createMappingTemplateApi(payload);
      const normalized = normalizeMappingTemplate(savedTemplate);
      await loadMappingTemplates();
      setDraftRows((rows) =>
        rows.map((row) =>
          row.mappingTemplateId
            ? row
            : { ...row, mappingTemplateId: normalized.id || row.mappingTemplateId },
        ),
      );
      setMappingTemplateName("");
      setMappingRows(emptyMappingRows());
    } catch (err: any) {
      setError(err?.message || "Could not save mapping template.");
    } finally {
      setIsMappingSaving(false);
    }
  };

  const deleteMappingTemplate = async (template: MappingTemplate) => {
    if (!window.confirm(`Delete mapping template "${template.name}"?`)) {
      return;
    }

    setIsMappingSaving(true);
    setError(null);

    try {
      await deleteMappingTemplateApi(template.id);
      const clearTemplate = (row: GameDetail) =>
        row.mappingTemplateId === template.id ? { ...row, mappingTemplateId: "" } : row;

      syncGames(games.map(clearTemplate));
      setDraftRows((rows) => rows.map(clearTemplate));
      setEditingRow((row) => clearTemplate(row));
      await loadMappingTemplates();
    } catch (err: any) {
      setError(err?.message || "Could not delete mapping template.");
    } finally {
      setIsMappingSaving(false);
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
            <ActiveGrid>
              <div>
                <ActiveLabel>Result</ActiveLabel>
                <ActiveValue>{resultMatchIds || "No match selected"}</ActiveValue>
              </div>
              <div>
                <ActiveLabel>Today</ActiveLabel>
                <ActiveValue>{todaysResultMatchIds || "No match selected"}</ActiveValue>
              </div>
              <div>
                <ActiveLabel>League</ActiveLabel>
                <ActiveValue>{leagueStageResultMatchIds || "No match selected"}</ActiveValue>
              </div>
            </ActiveGrid>
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
                <th>Mapping</th>
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
                    <Select
                      value={row.mappingTemplateId || ""}
                      onChange={(event) => updateDraftRow(index, "mappingTemplateId", event.target.value)}
                    >
                      <option value="">No mapping</option>
                      {mappingTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.mappings.length})
                        </option>
                      ))}
                    </Select>
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
                <th>Websocket</th>
                <th>Result</th>
                <th>Today</th>
                <th>League</th>
                <th>Game Number</th>
                <th>Round Name</th>
                <th>Phase</th>
                <th>Match ID</th>
                <th>Mapping</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.length === 0 ? (
                <tr>
                  <EmptyCell colSpan={10}>No game details inserted yet.</EmptyCell>
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
                        <Switch title="Use this row for Result">
                          <input type="checkbox" checked={Boolean(game.resultEnabled)} onChange={() => toggleGameFlag(game, "resultEnabled")} />
                          <span />
                        </Switch>
                      </td>
                      <td>
                        <Switch title="Use this row for Today's Result">
                          <input type="checkbox" checked={Boolean(game.todaysResultEnabled)} onChange={() => toggleGameFlag(game, "todaysResultEnabled")} />
                          <span />
                        </Switch>
                      </td>
                      <td>
                        <Switch title="Use this row for League Stage Result">
                          <input type="checkbox" checked={Boolean(game.leagueStageResultEnabled)} onChange={() => toggleGameFlag(game, "leagueStageResultEnabled")} />
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
                        {isEditing ? (
                          <Select
                            value={editingRow.mappingTemplateId || ""}
                            onChange={(event) => setEditingRow((row) => ({ ...row, mappingTemplateId: event.target.value }))}
                          >
                            <option value="">No mapping</option>
                            {mappingTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.mappings.length})
                              </option>
                            ))}
                          </Select>
                        ) : (
                          mappingTemplates.find((template) => template.id === game.mappingTemplateId)?.name || "-"
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

        <Panel>
          <PanelHeader>
            <PanelTitle>Create reusable room mapping</PanelTitle>
            <GhostText>{isMappingLoading ? "Loading mappings..." : `${mappingTemplates.length} saved mappings / ${teamOptions.length} tournament teams`}</GhostText>
          </PanelHeader>

          <MappingToolbar>
            <Input
              value={mappingTemplateName}
              onChange={(event) => setMappingTemplateName(event.target.value)}
              placeholder="Mapping name"
            />
            <Button type="button" onClick={loadMappingTemplates} disabled={isMappingLoading || isMappingSaving}>
              Refresh
            </Button>
            <Button type="button" onClick={addMappingRow} disabled={isMappingSaving}>
              Add Room
            </Button>
            <Button type="button" onClick={saveMappings} disabled={isMappingSaving}>
              {isMappingSaving ? "Saving..." : "Save Mapping"}
            </Button>
          </MappingToolbar>

          <SavedMappingList>
            {mappingTemplates.map((template) => (
              <SavedMappingItem key={template.id}>
                <span>{template.name} ({template.mappings.length})</span>
                <IconButton
                  type="button"
                  title="Delete saved mapping template"
                  onClick={() => deleteMappingTemplate(template)}
                  disabled={isMappingSaving}
                >
                  <TrashIcon />
                </IconButton>
              </SavedMappingItem>
            ))}
          </SavedMappingList>

          <Table>
            <thead>
              <tr>
                <th>Room Team ID</th>
                <th>Permanent Team</th>
                <th>Team Tag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappingRows.map((row, index) => (
                <tr key={`${row.roomTeamId}-${index}`}>
                  <td>
                    <Input
                      value={row.roomTeamId}
                      onChange={(event) => updateMappingRow(index, "roomTeamId", event.target.value)}
                    />
                  </td>
                  <td>
                    <Select
                      value={row.permanentTeamId}
                      onChange={(event) => {
                        const permanentTeamId = event.target.value;
                        const selectedTeam = teamOptions.find((team) => team.teamId === permanentTeamId);
                        setMappingRows((rows) =>
                          rows.map((mapping, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...mapping,
                                  permanentTeamId,
                                  teamName: selectedTeam?.teamName || "",
                                  teamTag: selectedTeam?.teamTag || "",
                                }
                              : mapping,
                          ),
                        );
                      }}
                    >
                      <option value="">Select team</option>
                      {teamOptions.map((team) => (
                        <option key={team.teamId} value={team.teamId}>
                          {team.teamId} - {team.teamName || team.teamTag || "Unnamed"}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <TeamTagValue>{row.teamTag || "-"}</TeamTagValue>
                  </td>
                  <td>
                    <ActionRow>
                      <IconButton type="button" title="Delete mapping row" onClick={() => removeMappingRow(index)}>
                        <TrashIcon />
                      </IconButton>
                    </ActionRow>
                  </td>
                </tr>
              ))}
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
  width: min(1360px, calc(100% - 32px));
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

const ActiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
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

const Select = styled.select`
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

const TeamTagValue = styled.span`
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.48);
  color: var(--project-accent, #bfff00);
  font-weight: 900;
`;

const MappingToolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto auto;
  gap: 10px;
  margin-bottom: 14px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const SavedMappingList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
`;

const SavedMappingItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  max-width: 100%;
  padding: 6px 8px 6px 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.42);

  span {
    overflow-wrap: anywhere;
  }
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
