import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import styled from "styled-components";
import { teamValidationSchema } from "../Schema/schema";
import { TeamRecord } from "../Controller/useTeamRecordController";

type TeamRow = {
  recordId?: string | number;
  teamId: string;
  teamName: string;
  tag: string;
  teamLogo?: any;
  countryLogo?: any;
  existingTeamLogo?: string;
  existingCountryLogo?: string;
};

type TeamFormValues = {
  teams: TeamRow[];
};

type TeamFormTableProps = {
  createTeamTable: (data: TeamFormValues) => Promise<void>;
  updateTeamTable: (id: string | number, data: TeamRow) => Promise<void>;
  reorderTeamTable: (rows: TeamRow[]) => Promise<void>;
  deleteTeamTable: (id: string | number) => Promise<void>;
  openTeamLogos: (team?: TeamRecord) => void;
  teams?: TeamRecord[];
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
};

const mapApiTeamToRow = (team: TeamRecord): TeamRow => ({
  recordId: team.id || team._id,
  teamId: String(team.team_id || team.teamId || ""),
  teamName: team.team_name || team.teamName || "",
  tag: team.short_tag || team.shortTag || team.tag || "",
  teamLogo: null,
  countryLogo: null,
  existingTeamLogo: team.team_logo || team.teamLogo || "",
  existingCountryLogo: team.country_logo || team.countryLogo || "",
});

const getFileName = (fileField: any) => {
  if (!fileField) return "";
  if (fileField instanceof File) return fileField.name;
  if (fileField instanceof FileList && fileField[0]) return fileField[0].name;
  if (Array.isArray(fileField) && fileField[0]) return fileField[0].name;
  if (typeof fileField === "object" && fileField[0]) return fileField[0].name;
  return "";
};

const toTeamRecord = (row: TeamRow): TeamRecord => ({
  id: row.recordId,
  team_id: row.teamId,
  team_name: row.teamName,
  short_tag: row.tag,
  team_logo: row.existingTeamLogo,
  country_logo: row.existingCountryLogo,
});

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.9 3.6a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.2 19.3 4 20l.7-4.2L16.9 3.6Z" />
    <path d="m15.5 5 3.5 3.5" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
  </svg>
);

const DragIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 5h.01" />
    <path d="M15 5h.01" />
    <path d="M9 12h.01" />
    <path d="M15 12h.01" />
    <path d="M9 19h.01" />
    <path d="M15 19h.01" />
  </svg>
);

const reorderRows = (rows: TeamRow[], fromIndex: number, toIndex: number) => {
  const nextRows = [...rows];
  const [movedRow] = nextRows.splice(fromIndex, 1);
  nextRows.splice(toIndex, 0, movedRow);

  return nextRows.map((row, index) => ({
    ...row,
    teamId: String(index + 1),
  }));
};

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  padding: 2rem 1.25rem;
  background:
    linear-gradient(180deg, rgba(var(--project-primary-rgb, 17, 24, 39), 0.08), var(--project-background, rgba(8, 13, 21, 0.98))),
    linear-gradient(90deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.08), rgba(var(--project-secondary-rgb, 20, 184, 166), 0.05));
  color: var(--project-text-primary, #f8fafc);
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Container = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto;
`;

const HeaderPanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  h2 {
    margin: 0;
    font-size: clamp(1.45rem, 3vw, 2.35rem);
    letter-spacing: 0;
    line-height: 1.05;
  }

  p {
    margin: 0.55rem 0 0;
    color: var(--project-text-secondary, #94a3b8);
    max-width: 680px;
    font-size: 0.92rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: "danger" | "ghost" | "primary" }>`
  min-height: 2.35rem;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "danger" ? "var(--project-danger, #ef4444)" : $variant === "ghost" ? "var(--project-border, #334155)" : "var(--project-primary, #ef4444)"};
  border-radius: 0.45rem;
  padding: 0.55rem 0.85rem;
  color: var(--project-text-primary, #ffffff);
  background: ${({ $variant }) =>
    $variant === "danger"
      ? "var(--project-danger, #dc2626)"
      : $variant === "ghost"
        ? "var(--project-surface, rgba(15, 23, 42, 0.82))"
        : "var(--project-primary, #ef4444)"};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: var(--project-accent, #ffffff);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const StatusBar = styled.div<{ $tone?: "error" | "info" }>`
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "var(--project-danger, #7f1d1d)" : "var(--project-secondary, #1e3a8a)")};
  background: ${({ $tone }) =>
    $tone === "error" ? "rgba(var(--project-danger-rgb, 127, 29, 29), 0.32)" : "rgba(var(--project-secondary-rgb, 30, 58, 138), 0.22)"};
  color: ${({ $tone }) => ($tone === "error" ? "var(--project-danger, #fecaca)" : "var(--project-secondary, #bfdbfe)")};
  border-radius: 0.45rem;
  padding: 0.7rem 0.85rem;
  margin-bottom: 1rem;
  font-size: 0.86rem;
`;

const TableShell = styled.div`
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid #243244;
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.88);
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.28);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const TableHead = styled.thead`
  background: #101827;

  th {
    padding: 0.9rem 0.8rem;
    color: #94a3b8;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0;
    text-align: left;
    border-bottom: 1px solid #243244;
  }
`;

const TableRow = styled.tr<{ $isEditing?: boolean; $isDragging?: boolean; $isDragOver?: boolean }>`
  border-bottom: 1px solid #1e293b;
  background: ${({ $isEditing, $isDragging, $isDragOver }) =>
    $isDragging
      ? "rgba(148, 163, 184, 0.12)"
      : $isDragOver
        ? "rgba(20, 184, 166, 0.12)"
        : $isEditing
          ? "rgba(239, 68, 68, 0.07)"
          : "transparent"};
  outline: ${({ $isDragOver }) => ($isDragOver ? "1px dashed #14b8a6" : "none")};
  outline-offset: -1px;
  transition: background 0.15s ease;
  opacity: ${({ $isDragging }) => ($isDragging ? 0.72 : 1)};

  &:hover {
    background: ${({ $isEditing, $isDragOver }) =>
      $isDragOver
        ? "rgba(20, 184, 166, 0.12)"
        : $isEditing
          ? "rgba(239, 68, 68, 0.1)"
          : "rgba(148, 163, 184, 0.06)"};
  }
`;

const TableCell = styled.td`
  padding: 0.7rem 0.65rem;
  vertical-align: middle;
  min-width: 0;
`;

const TextInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${({ $hasError }) => ($hasError ? "#ef4444" : "#334155")};
  border-radius: 0.38rem;
  padding: 0.62rem 0.7rem;
  background: #0f172a;
  color: #f8fafc;
  font-size: 0.86rem;

  &:focus {
    outline: none;
    border-color: #f8fafc;
  }
`;

const FileInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  max-width: 100%;
  color: #94a3b8;
  font-size: 0.7rem;

  &::file-selector-button {
    margin-right: 0.6rem;
    border: 1px solid ${({ $hasError }) => ($hasError ? "#ef4444" : "#334155")};
    border-radius: 0.38rem;
    padding: 0.42rem 0.5rem;
    background: ${({ $hasError }) => ($hasError ? "rgba(239, 68, 68, 0.14)" : "#111827")};
    color: #f8fafc;
    cursor: pointer;
    font-weight: 700;
  }
`;

const LogoPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
`;

const LogoImage = styled.img<{ $small?: boolean }>`
  width: ${({ $small }) => ($small ? "1.8rem" : "2.35rem")};
  height: ${({ $small }) => ($small ? "1.8rem" : "2.35rem")};
  border-radius: ${({ $small }) => ($small ? "999px" : "0.45rem")};
  object-fit: cover;
  background: #020617;
  border: 1px solid #334155;
`;

const PlaceholderLogo = styled.div<{ $small?: boolean }>`
  width: ${({ $small }) => ($small ? "1.8rem" : "2.35rem")};
  height: ${({ $small }) => ($small ? "1.8rem" : "2.35rem")};
  border-radius: ${({ $small }) => ($small ? "999px" : "0.45rem")};
  display: grid;
  place-items: center;
  background: #111827;
  border: 1px solid #334155;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
`;

const Muted = styled.span`
  color: #94a3b8;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TeamName = styled.button`
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  font-weight: 800;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: #fca5a5;
  }
`;

const ErrorText = styled.p`
  margin: 0.35rem 0 0;
  color: #fca5a5;
  font-size: 0.72rem;
`;

const ActionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
`;

const OrderCell = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
`;

const DragButton = styled.button`
  width: 1.85rem;
  height: 1.85rem;
  border: 1px solid #334155;
  border-radius: 0.35rem;
  display: inline-grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.82);
  color: #94a3b8;
  cursor: grab;
  padding: 0;

  svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:active {
    cursor: grabbing;
  }

  &:hover:not(:disabled) {
    border-color: #ffffff;
    color: #ffffff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const IconButton = styled.button<{ $variant?: "danger" | "ghost" }>`
  width: 2.15rem;
  height: 2.15rem;
  border: 1px solid ${({ $variant }) => ($variant === "danger" ? "#ef4444" : "#334155")};
  border-radius: 0.4rem;
  display: inline-grid;
  place-items: center;
  background: ${({ $variant }) =>
    $variant === "danger" ? "rgba(220, 38, 38, 0.92)" : "rgba(15, 23, 42, 0.82)"};
  color: #ffffff;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;

  svg {
    width: 1.05rem;
    height: 1.05rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: #ffffff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const EmptyState = styled.div`
  display: grid;
  place-items: center;
  min-height: 260px;
  color: #94a3b8;
  font-weight: 700;
`;

const ResponsiveTableStyles = styled.div`
  @media (max-width: 860px) {
    ${TableShell} {
      overflow: visible;
      border: 0;
      background: transparent;
      box-shadow: none;
    }

    ${Table},
    tbody,
    tr,
    td {
      display: block;
      width: 100%;
    }

    ${TableHead} {
      display: none;
    }

    ${TableRow} {
      border: 1px solid #243244;
      border-radius: 0.5rem;
      margin-bottom: 0.85rem;
      overflow: hidden;
      background: rgba(15, 23, 42, 0.9);
    }

    ${TableCell} {
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 7.25rem minmax(0, 1fr);
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #1e293b;
    }

    ${TableCell}::before {
      content: attr(data-label);
      color: #94a3b8;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    ${ActionWrapper} {
      justify-content: flex-start;
    }
  }
`;

export default function TeamFormTable({
  createTeamTable,
  updateTeamTable,
  reorderTeamTable,
  deleteTeamTable,
  openTeamLogos,
  teams = [],
  isLoading = false,
  isSaving = false,
  error,
}: TeamFormTableProps) {
  const [editingRows, setEditingRows] = useState<Record<number, boolean>>({});
  const [rowSnapshots, setRowSnapshots] = useState<Record<number, TeamRow>>({});
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  const apiRows = useMemo(() => teams.map(mapApiTeamToRow), [teams]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    reset,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: yupResolver(teamValidationSchema) as any,
    defaultValues: { teams: [] },
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control,
    name: "teams",
  });

  useEffect(() => {
    replace(apiRows);
    setEditingRows({});
    setRowSnapshots({});
  }, [apiRows, replace]);

  const handleAddNewRow = () => {
    append({
      teamId: "",
      teamName: "",
      tag: "",
      teamLogo: null,
      countryLogo: null,
      existingTeamLogo: "",
      existingCountryLogo: "",
    });
    setEditingRows((prev) => ({ ...prev, [fields.length]: true }));
  };

  const handleEditRow = (index: number) => {
    setRowSnapshots((prev) => ({ ...prev, [index]: getValues(`teams.${index}`) }));
    setEditingRows((prev) => ({ ...prev, [index]: true }));
  };

  const handleCancelRow = (index: number) => {
    const snapshot = rowSnapshots[index];

    if (snapshot) {
      setValue(`teams.${index}`, snapshot);
      setEditingRows((prev) => ({ ...prev, [index]: false }));
      return;
    }

    remove(index);
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleSaveRow = async (index: number) => {
    const isRowValid = await trigger(`teams.${index}`);
    const row = getValues(`teams.${index}`);
    const hasExistingLogo = Boolean(row.existingTeamLogo);
    const hasNewLogo = Boolean(getFileName(row.teamLogo));

    if (!hasExistingLogo && !hasNewLogo) {
      return;
    }

    if (!isRowValid && !hasExistingLogo) {
      return;
    }

    if (row.recordId) {
      await updateTeamTable(row.recordId, row);
      return;
    }

    await createTeamTable({ teams: [row] });
    reset({ teams: [] });
  };

  const handleDeleteRow = async (index: number) => {
    const row = getValues(`teams.${index}`);

    if (!row.recordId) {
      remove(index);
      return;
    }

    await deleteTeamTable(row.recordId);
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    index: number,
  ) => {
    setDraggedRowIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverRowIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLTableRowElement>,
    dropIndex: number,
  ) => {
    event.preventDefault();

    const sourceIndex =
      draggedRowIndex ?? Number(event.dataTransfer.getData("text/plain"));

    handleDragEnd();

    if (!Number.isInteger(sourceIndex) || sourceIndex === dropIndex) {
      return;
    }

    const rowsBeforeMove = getValues("teams");
    const nextRows = reorderRows(rowsBeforeMove, sourceIndex, dropIndex);
    const changedSavedRows = nextRows.filter((row, index) => {
      const previousRow = rowsBeforeMove.find(
        (candidate) => candidate.recordId && candidate.recordId === row.recordId,
      );

      return row.recordId && previousRow && previousRow.teamId !== String(index + 1);
    });

    move(sourceIndex, dropIndex);
    nextRows.forEach((row, index) => {
      setValue(`teams.${index}.teamId`, row.teamId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
    setEditingRows({});
    setRowSnapshots({});

    if (changedSavedRows.length > 0) {
      await reorderTeamTable(changedSavedRows);
    }
  };

  const onSubmit = async (data: TeamFormValues) => {
    const newRows = data.teams.filter((team) => !team.recordId);
    if (newRows.length === 0) return;
    await createTeamTable({ teams: newRows });
    reset({ teams: [] });
  };

  return (
    <PageWrapper>
      <ResponsiveTableStyles>
        <Container>
          <HeaderPanel>
            <TitleBlock>
              <h2>Team Record Table</h2>
              <p>
                Upload team id, team name, tag, team logo, and country logo. Click a
                saved team name to open the logo gallery.
              </p>
            </TitleBlock>

            <HeaderActions>
              <Button type="button" $variant="ghost" onClick={() => openTeamLogos()}>
                Logo Gallery
              </Button>
              <Button type="button" onClick={handleAddNewRow} disabled={isSaving}>
                Add Team
              </Button>
            </HeaderActions>
          </HeaderPanel>

          {error && <StatusBar $tone="error">{error}</StatusBar>}
          {isLoading && <StatusBar>Loading team records...</StatusBar>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TableShell>
              {fields.length === 0 && !isLoading ? (
                <EmptyState>No team records yet. Add your first team to start.</EmptyState>
              ) : (
                <Table>
                  <TableHead>
                    <tr>
                      <th style={{ width: "7%", textAlign: "center" }}>Drag</th>
                      <th style={{ width: "11%" }}>Team ID</th>
                      <th style={{ width: "20%" }}>Team Name</th>
                      <th style={{ width: "8%" }}>Tag</th>
                      <th style={{ width: "22%" }}>Team Logo</th>
                      <th style={{ width: "22%" }}>Country Logo</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Actions</th>
                    </tr>
                  </TableHead>

                <tbody>
                  {fields.map((field, index) => {
                    const row = getValues(`teams.${index}`);
                    const rowErrors = (errors.teams as any)?.[index];
                    const isEditing = Boolean(editingRows[index] || !row.recordId);
                    const teamLogoFile = getFileName(row.teamLogo);
                    const countryLogoFile = getFileName(row.countryLogo);

                    return (
                      <TableRow
                        key={field.id}
                        $isEditing={isEditing}
                        $isDragging={draggedRowIndex === index}
                        $isDragOver={dragOverRowIndex === index && draggedRowIndex !== index}
                        draggable={!isSaving && fields.length >= 2}
                        onDragStart={(event) => handleDragStart(event, index)}
                        onDragOver={(event) => handleDragOver(event, index)}
                        onDragLeave={() => setDragOverRowIndex(null)}
                        onDragEnd={handleDragEnd}
                        onDrop={(event) => handleDrop(event, index)}
                      >
                        <TableCell data-label="Drag" style={{ textAlign: "center", color: "#94a3b8" }}>
                          <OrderCell>
                            <DragButton
                              type="button"
                              draggable={!isSaving}
                              disabled={isSaving || fields.length < 2}
                              onDragStart={(event) => handleDragStart(event, index)}
                              onDragEnd={handleDragEnd}
                              aria-label={`Move ${row.teamName || "team"} row`}
                              title="Drag to reorder"
                            >
                              <DragIcon />
                            </DragButton>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                          </OrderCell>
                        </TableCell>

                        <TableCell data-label="Team ID">
                          {isEditing ? (
                            <>
                              <TextInput
                                $hasError={!!rowErrors?.teamId}
                                placeholder="1"
                                {...register(`teams.${index}.teamId`)}
                              />
                              {rowErrors?.teamId && <ErrorText>{rowErrors.teamId.message}</ErrorText>}
                            </>
                          ) : (
                            <Muted>{row.teamId || "-"}</Muted>
                          )}
                        </TableCell>

                        <TableCell data-label="Team Name">
                          {isEditing ? (
                            <>
                              <TextInput
                                $hasError={!!rowErrors?.teamName}
                                placeholder="Team Falcons"
                                {...register(`teams.${index}.teamName`)}
                              />
                              {rowErrors?.teamName && (
                                <ErrorText>{rowErrors.teamName.message}</ErrorText>
                              )}
                            </>
                          ) : (
                            <TeamName type="button" onClick={() => openTeamLogos(toTeamRecord(row))}>
                              {row.teamName || "Unknown Team"}
                            </TeamName>
                          )}
                        </TableCell>

                        <TableCell data-label="Tag">
                          {isEditing ? (
                            <>
                              <TextInput
                                $hasError={!!rowErrors?.tag}
                                placeholder="TFS"
                                {...register(`teams.${index}.tag`)}
                              />
                              {rowErrors?.tag && <ErrorText>{rowErrors.tag.message}</ErrorText>}
                            </>
                          ) : (
                            <Muted>{row.tag || "-"}</Muted>
                          )}
                        </TableCell>

                        <TableCell data-label="Team Logo">
                          {isEditing ? (
                            <>
                              <FileInput
                                type="file"
                                accept="image/*"
                                $hasError={!!rowErrors?.teamLogo && !row.existingTeamLogo}
                                {...register(`teams.${index}.teamLogo`)}
                              />
                              <Muted>
                                {teamLogoFile || (row.existingTeamLogo ? "Current logo kept" : "Required")}
                              </Muted>
                            </>
                          ) : (
                            <LogoPreview>
                              {row.existingTeamLogo ? (
                                <LogoImage src={row.existingTeamLogo} alt={`${row.teamName} logo`} />
                              ) : (
                                <PlaceholderLogo>{row.tag || "NA"}</PlaceholderLogo>
                              )}
                              <Muted>{row.existingTeamLogo ? "Uploaded" : "No logo"}</Muted>
                            </LogoPreview>
                          )}
                        </TableCell>

                        <TableCell data-label="Country Logo">
                          {isEditing ? (
                            <>
                              <FileInput
                                type="file"
                                accept="image/*"
                                {...register(`teams.${index}.countryLogo`)}
                              />
                              <Muted>
                                {countryLogoFile ||
                                  (row.existingCountryLogo ? "Current flag kept" : "Optional")}
                              </Muted>
                            </>
                          ) : (
                            <LogoPreview>
                              {row.existingCountryLogo ? (
                                <LogoImage
                                  $small
                                  src={row.existingCountryLogo}
                                  alt={`${row.teamName} country logo`}
                                />
                              ) : (
                                <PlaceholderLogo $small>NA</PlaceholderLogo>
                              )}
                              <Muted>{row.existingCountryLogo ? "Uploaded" : "No flag"}</Muted>
                            </LogoPreview>
                          )}
                        </TableCell>

                        <TableCell data-label="Actions">
                          <ActionWrapper>
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  onClick={() => handleSaveRow(index)}
                                  disabled={isSaving}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  $variant="ghost"
                                  onClick={() => handleCancelRow(index)}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <IconButton
                                  type="button"
                                  $variant="ghost"
                                  onClick={() => handleEditRow(index)}
                                  disabled={isSaving}
                                  aria-label={`Edit ${row.teamName || "team"}`}
                                  title="Edit"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  type="button"
                                  $variant="danger"
                                  onClick={() => handleDeleteRow(index)}
                                  disabled={isSaving}
                                  aria-label={`Delete ${row.teamName || "team"}`}
                                  title="Delete"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </>
                            )}
                          </ActionWrapper>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            )}
            </TableShell>

            <HeaderActions style={{ justifyContent: "flex-end", marginTop: "1rem" }}>
              <Button type="submit" disabled={isSaving}>
                Save New Rows
              </Button>
            </HeaderActions>
          </form>
        </Container>
      </ResponsiveTableStyles>
    </PageWrapper>
  );
}
