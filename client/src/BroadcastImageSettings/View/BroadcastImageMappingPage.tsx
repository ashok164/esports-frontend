import React, { useMemo, useState } from "react";
import styled from "styled-components";
import http from "../../AxiosFile/axios";
import {
  BROADCAST_DISPLAY_SETTINGS,
  UPDATE_BROADCAST_DISPLAY_SETTINGS,
} from "../../Routes/ApiRoutes/apiRoutes";
import { getSelectedTournamentSlug } from "../../Tournaments/tournamentState";
import {
  BroadcastDisplaySettings,
  MatchNumberImageEntry,
  TeamEliminationImageEntry,
  getBroadcastDisplaySettings,
  setBroadcastDisplaySettings,
} from "../../Theme";

type MatchNumberRow = MatchNumberImageEntry;
type TeamEliminationRow = TeamEliminationImageEntry;

type BroadcastImageMappingPageProps =
  | {
      mode: "match-number";
      title: string;
      description: string;
      enabledKey: "matchNumberImageEnabled";
    }
  | {
      mode: "team-elimination";
      title: string;
      description: string;
      enabledKey: "teamEliminationImageEnabled";
    };

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createMatchNumberRow = (): MatchNumberRow => ({
  id: makeId("match-number"),
  gameNumber: "",
  name: "",
  imageUrl: "",
});

const createTeamEliminationRow = (): TeamEliminationRow => ({
  id: makeId("team-elimination"),
  teamId: "",
  teamName: "",
  imageUrl: "",
});

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });

const BroadcastImageMappingPage: React.FC<BroadcastImageMappingPageProps> = ({
  mode,
  title,
  description,
  enabledKey,
}) => {
  const [settings, setSettings] = useState<BroadcastDisplaySettings>(getBroadcastDisplaySettings);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isMatchNumberMode = mode === "match-number";
  const matchNumberRows = settings.matchNumberImageEntries;
  const teamEliminationRows = settings.teamEliminationImageEntries;
  const isEnabled = settings[enabledKey];

  const summary = useMemo(() => {
    const total = isMatchNumberMode ? matchNumberRows.length : teamEliminationRows.length;
    const ready = isMatchNumberMode
      ? matchNumberRows.filter((row) => row.imageUrl && row.gameNumber).length
      : teamEliminationRows.filter((row) => row.imageUrl && (row.teamId || row.teamName)).length;
    return `${ready}/${total} ready`;
  }, [isMatchNumberMode, matchNumberRows, teamEliminationRows]);

  const saveSettings = async (nextSettings: BroadcastDisplaySettings, successText: string) => {
    const selectedTournamentSlug = getSelectedTournamentSlug();
    setSettings(nextSettings);
    setBroadcastDisplaySettings(nextSettings);
    setStatus("");
    setError("");
    setIsSaving(true);

    try {
      await http.patch(
        BROADCAST_DISPLAY_SETTINGS(selectedTournamentSlug) || UPDATE_BROADCAST_DISPLAY_SETTINGS,
        { settings: nextSettings },
      );
      setStatus(successText);
    } catch {
      setStatus(`${successText} Saved locally; API sync fallback active.`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateRows = async (
    nextRows: MatchNumberImageEntry[] | TeamEliminationImageEntry[],
    successText = "Image mapping updated.",
    autoSave = false,
  ) => {
    const nextSettings: BroadcastDisplaySettings = isMatchNumberMode
      ? {
          ...settings,
          matchNumberImageEntries: nextRows as MatchNumberImageEntry[],
        }
      : {
          ...settings,
          teamEliminationImageEntries: nextRows as TeamEliminationImageEntry[],
        };

    setSettings(nextSettings);
    setBroadcastDisplaySettings(nextSettings);

    if (autoSave) {
      await saveSettings(nextSettings, successText);
    }
  };

  const handleToggle = async (checked: boolean) => {
    const nextSettings = { ...settings, [enabledKey]: checked };
    await saveSettings(
      nextSettings,
      checked ? `${title} image mode enabled.` : `${title} image mode disabled.`,
    );
  };

  const addRow = () => {
    const nextRows = isMatchNumberMode
      ? [...matchNumberRows, createMatchNumberRow()]
      : [...teamEliminationRows, createTeamEliminationRow()];

    void updateRows(nextRows);
  };

  const removeRow = (id: string) => {
    if (isMatchNumberMode) {
      void updateRows(matchNumberRows.filter((row) => row.id !== id));
      return;
    }

    void updateRows(teamEliminationRows.filter((row) => row.id !== id));
  };

  const updateMatchNumberRow = (id: string, patch: Partial<MatchNumberRow>) => {
    const nextRows = matchNumberRows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    void updateRows(nextRows);
  };

  const updateTeamEliminationRow = (id: string, patch: Partial<TeamEliminationRow>) => {
    const nextRows = teamEliminationRows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    void updateRows(nextRows);
  };

  const handleFileChange = async (rowId: string, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setStatus("Encoding image...");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (isMatchNumberMode) {
        updateMatchNumberRow(rowId, { imageUrl: dataUrl });
      } else {
        updateTeamEliminationRow(rowId, { imageUrl: dataUrl });
      }
      setStatus("Image added to row.");
    } catch {
      setError("Image upload could not be processed.");
      setStatus("");
    }
  };

  const handleSaveAll = async () => {
    if (isMatchNumberMode) {
      const filteredRows = matchNumberRows.filter(
        (row) => row.gameNumber.trim() && row.imageUrl.trim(),
      );
      await saveSettings(
        { ...settings, matchNumberImageEntries: filteredRows },
        `${title} table saved.`,
      );
      return;
    }

    const filteredRows = teamEliminationRows.filter(
      (row) => (row.teamId.trim() || row.teamName.trim()) && row.imageUrl.trim(),
    );
    await saveSettings(
      { ...settings, teamEliminationImageEntries: filteredRows },
      `${title} table saved.`,
    );
  };

  return (
    <Page>
      <Shell>
        <Header>
          <div>
            <Kicker>Broadcast Image Mapping</Kicker>
            <Title>{title}</Title>
            <Description>{description}</Description>
          </div>

          <HeaderSide>
            <MetaBadge>{summary}</MetaBadge>
            <SwitchLabel>
              <SwitchInput
                type="checkbox"
                checked={isEnabled}
                onChange={(event) => handleToggle(event.target.checked)}
              />
              <SwitchTrack aria-hidden="true" />
              <SwitchText>
                <strong>Enable image mode</strong>
                <span>Image shows when a matching row is found; otherwise coded style still appears.</span>
              </SwitchText>
            </SwitchLabel>
          </HeaderSide>
        </Header>

        {(status || error) && <StatusBar $error={!!error}>{error || status}</StatusBar>}

        <Panel>
          <PanelHead>
            <div>
              <PanelTitle>{isMatchNumberMode ? "Game Number Image Table" : "Team Elimination Image Table"}</PanelTitle>
              <PanelNote>
                {isMatchNumberMode
                  ? "Add one row per game number, like 1, 2, 3, 4, 5, 6, 7, 8, 9, 10."
                  : "Add one row per team id or team name. Matching checks team id first, then team name."}
              </PanelNote>
            </div>
            <PanelActions>
              <GhostButton type="button" onClick={addRow} disabled={isSaving}>
                Add Row
              </GhostButton>
              <SaveButton type="button" onClick={handleSaveAll} disabled={isSaving}>
                Save Table
              </SaveButton>
            </PanelActions>
          </PanelHead>

          <Rows>
            {(isMatchNumberMode ? matchNumberRows.length : teamEliminationRows.length) === 0 ? (
              <EmptyState>No rows yet. Add your first image row.</EmptyState>
            ) : isMatchNumberMode ? (
              matchNumberRows.map((row, index) => (
                <RowCard key={row.id}>
                  <RowIndex>{String(index + 1).padStart(2, "0")}</RowIndex>
                  <FieldsGrid>
                    <Field>
                      <Label>Game Number</Label>
                      <Input
                        value={row.gameNumber}
                        onChange={(event) => updateMatchNumberRow(row.id, { gameNumber: event.target.value })}
                        placeholder="1"
                        disabled={isSaving}
                      />
                    </Field>
                    <Field>
                      <Label>Name</Label>
                      <Input
                        value={row.name}
                        onChange={(event) => updateMatchNumberRow(row.id, { name: event.target.value })}
                        placeholder="Match 1 graphic"
                        disabled={isSaving}
                      />
                    </Field>
                    <Field>
                      <Label>Image Upload</Label>
                      <FileInput
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          void handleFileChange(row.id, event.target.files);
                          event.target.value = "";
                        }}
                        disabled={isSaving}
                      />
                    </Field>
                  </FieldsGrid>

                  <PreviewBlock>
                    {row.imageUrl ? (
                      <PreviewImage src={row.imageUrl} alt={row.name || `Game ${row.gameNumber}`} />
                    ) : (
                      <PreviewFallback>No image</PreviewFallback>
                    )}
                    <PreviewMeta>
                      <strong>{row.name || `Game ${row.gameNumber || "-"}`}</strong>
                      <span>{`Game Number: ${row.gameNumber || "-"}`}</span>
                    </PreviewMeta>
                  </PreviewBlock>

                  <RemoveButton type="button" onClick={() => removeRow(row.id)} disabled={isSaving}>
                    Remove
                  </RemoveButton>
                </RowCard>
              ))
            ) : (
              teamEliminationRows.map((row, index) => (
                <RowCard key={row.id}>
                  <RowIndex>{String(index + 1).padStart(2, "0")}</RowIndex>
                  <FieldsGrid>
                    <Field>
                      <Label>Team ID</Label>
                      <Input
                        value={row.teamId}
                        onChange={(event) => updateTeamEliminationRow(row.id, { teamId: event.target.value })}
                        placeholder="12"
                        disabled={isSaving}
                      />
                    </Field>
                    <Field>
                      <Label>Team Name</Label>
                      <Input
                        value={row.teamName}
                        onChange={(event) => updateTeamEliminationRow(row.id, { teamName: event.target.value })}
                        placeholder="JHUSE ESPORTS"
                        disabled={isSaving}
                      />
                    </Field>
                    <Field>
                      <Label>Image Upload</Label>
                      <FileInput
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          void handleFileChange(row.id, event.target.files);
                          event.target.value = "";
                        }}
                        disabled={isSaving}
                      />
                    </Field>
                  </FieldsGrid>

                  <PreviewBlock>
                    {row.imageUrl ? (
                      <PreviewImage src={row.imageUrl} alt={row.teamName || row.teamId || "Team elimination"} />
                    ) : (
                      <PreviewFallback>No image</PreviewFallback>
                    )}
                    <PreviewMeta>
                      <strong>{row.teamName || "Unnamed Team"}</strong>
                      <span>{`Team ID: ${row.teamId || "-"}`}</span>
                    </PreviewMeta>
                  </PreviewBlock>

                  <RemoveButton type="button" onClick={() => removeRow(row.id)} disabled={isSaving}>
                    Remove
                  </RemoveButton>
                </RowCard>
              ))
            )}
          </Rows>
        </Panel>
      </Shell>
    </Page>
  );
};

export default BroadcastImageMappingPage;

const Page = styled.main`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 30, 30, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 42%),
    var(--project-background, #0b0f19);
  color: var(--project-text-primary, #ffffff);
`;

const Shell = styled.div`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 42px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;

  @media (max-width: 980px) {
    flex-direction: column;
  }
`;

const HeaderSide = styled.div`
  display: grid;
  gap: 12px;
  min-width: 340px;
`;

const Kicker = styled.div`
  color: var(--project-accent, #bfff00);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 8px 0 10px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
`;

const Description = styled.p`
  max-width: 740px;
  margin: 0;
  color: var(--project-text-secondary, #94a3b8);
  line-height: 1.5;
`;

const MetaBadge = styled.div`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 999px;
  background: var(--project-surface, #111827);
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.78rem;
  font-weight: 800;
`;

const SwitchLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 10px;
  background: var(--project-surface, #111827);
  cursor: pointer;
`;

const SwitchInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;

  &:checked + span::after {
    transform: translateX(22px);
  }

  &:checked + span {
    background: var(--project-primary, #ef4444);
    border-color: var(--project-primary, #ef4444);
  }
`;

const SwitchTrack = styled.span`
  position: relative;
  flex: 0 0 48px;
  width: 48px;
  height: 26px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 999px;
  background: var(--project-surface-alt, #1f293d);

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #ffffff;
    transition: transform 160ms ease;
  }
`;

const SwitchText = styled.span`
  display: grid;
  gap: 4px;

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.86rem;
    line-height: 1.4;
  }
`;

const StatusBar = styled.div<{ $error: boolean }>`
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid ${({ $error }) => ($error ? "var(--project-danger, #ef4444)" : "var(--project-border, #334155)")};
  border-radius: 8px;
  background: ${({ $error }) => ($error ? "rgba(239, 68, 68, 0.12)" : "var(--project-surface, #111827)")};
  color: ${({ $error }) => ($error ? "var(--project-danger, #ef4444)" : "var(--project-text-primary, #fff)")};
`;

const Panel = styled.section`
  padding: 18px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 10px;
  background: var(--project-surface, #111827);
`;

const PanelHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const PanelTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 1.05rem;
`;

const PanelNote = styled.p`
  margin: 0;
  color: var(--project-text-secondary, #94a3b8);
  line-height: 1.5;
`;

const PanelActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const Rows = styled.div`
  display: grid;
  gap: 14px;
`;

const EmptyState = styled.div`
  padding: 24px;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 12px;
  color: var(--project-text-secondary, #94a3b8);
  text-align: center;
  font-weight: 800;
`;

const RowCard = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 260px auto;
  gap: 14px;
  align-items: stretch;
  padding: 14px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 12px;
  background: var(--project-surface-alt, #1f293d);

  @media (max-width: 1080px) {
    grid-template-columns: 56px 1fr;
  }
`;

const RowIndex = styled.div`
  display: grid;
  place-items: center;
  min-height: 100%;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--project-text-secondary, #94a3b8);
  font-weight: 900;
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
`;

const Label = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Input = styled.input`
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-background, #0b0f19);
  color: var(--project-text-primary, #ffffff);
`;

const FileInput = styled.input`
  color: var(--project-text-secondary, #94a3b8);

  &::file-selector-button {
    margin-right: 10px;
    border: 1px solid var(--project-primary, #ef4444);
    border-radius: 8px;
    background: var(--project-primary, #ef4444);
    color: #ffffff;
    padding: 10px 14px;
    cursor: pointer;
    font-weight: 900;
  }
`;

const PreviewBlock = styled.div`
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 10px;
  align-items: center;

  @media (max-width: 1080px) {
    grid-column: 2;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewImage = styled.img`
  width: 110px;
  height: 110px;
  border-radius: 10px;
  object-fit: cover;
  background: #050b12;

  @media (max-width: 620px) {
    width: 100%;
    height: 180px;
  }
`;

const PreviewFallback = styled.div`
  width: 110px;
  height: 110px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 10px;
  color: var(--project-text-secondary, #94a3b8);
  font-weight: 800;

  @media (max-width: 620px) {
    width: 100%;
    height: 180px;
  }
`;

const PreviewMeta = styled.div`
  display: grid;
  gap: 6px;

  strong {
    color: var(--project-text-primary, #ffffff);
  }

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.82rem;
  }
`;

const BaseButton = styled.button`
  min-height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SaveButton = styled(BaseButton)`
  border: 1px solid var(--project-primary, #ef4444);
  background: var(--project-primary, #ef4444);
  color: #ffffff;
`;

const GhostButton = styled(BaseButton)`
  border: 1px solid var(--project-border, #334155);
  background: var(--project-surface-alt, #1f293d);
  color: #ffffff;
`;

const RemoveButton = styled(BaseButton)`
  border: 1px solid var(--project-danger, #ef4444);
  background: rgba(239, 68, 68, 0.12);
  color: var(--project-danger, #ef4444);

  @media (max-width: 1080px) {
    grid-column: 2;
    width: fit-content;
  }
`;
