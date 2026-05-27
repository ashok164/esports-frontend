import React from "react";
import styled from "styled-components";
import { getResultRecordId } from "../../controller/controller";
import { ResultRow } from "../../repository/remote";

type ResultTableProps = {
  editingId: string | number | null;
  editingRow: ResultRow | null;
  isSaving: boolean;
  results: ResultRow[];
  onBeginEdit: (row: ResultRow) => void;
  onCancelEdit: () => void;
  onDelete: (row: ResultRow) => void;
  onSaveEdit: () => void;
  onUpdateEdit: (field: keyof ResultRow, value: string) => void;
};

const editableFields: Array<keyof ResultRow> = [
  "teamId",
  "teamLogo",
  "countryLogo",
  "teamName",
  "teamTag",
  "kills",
  "placement",
  "booyahCount",
  "totalKills",
];

const ResultTable: React.FC<ResultTableProps> = ({
  editingId,
  editingRow,
  isSaving,
  results,
  onBeginEdit,
  onCancelEdit,
  onDelete,
  onSaveEdit,
  onUpdateEdit,
}) => {
  return (
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 ? (
            <tr>
              <EmptyCell colSpan={11}>No result data loaded yet.</EmptyCell>
            </tr>
          ) : (
            results.map((row) => {
              const recordId = getResultRecordId(row) || "";
              const isEditing = String(editingId) === String(recordId);

              return (
                <tr key={String(recordId || `${row.teamId}-${row.teamName}`)}>
                  <td>
                    <Mono>{row.matchIds}</Mono>
                  </td>
                  {editableFields.map((field) => (
                    <td key={field}>
                      {isEditing ? (
                        <Input
                          value={String(editingRow?.[field] ?? "")}
                          onChange={(event) => onUpdateEdit(field, event.target.value)}
                        />
                      ) : field === "teamLogo" || field === "countryLogo" ? (
                        row[field] ? (
                          <LogoImage src={String(row[field])} alt={String(field)} />
                        ) : (
                          <Muted>Empty</Muted>
                        )
                      ) : field === "teamId" ? (
                        <Mono>{row[field]}</Mono>
                      ) : (
                        String(row[field] ?? "")
                      )}
                    </td>
                  ))}
                  <td>
                    <ActionRow>
                      {isEditing ? (
                        <>
                          <IconButton type="button" title="Save result" onClick={onSaveEdit} disabled={isSaving}>
                            <CheckIcon />
                          </IconButton>
                          <IconButton type="button" title="Cancel edit" onClick={onCancelEdit} disabled={isSaving}>
                            <CloseIcon />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton type="button" title="Edit result" onClick={() => onBeginEdit(row)} disabled={isSaving}>
                            <EditIcon />
                          </IconButton>
                          <IconButton type="button" title="Delete result" onClick={() => onDelete(row)} disabled={isSaving}>
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
    </TableWrap>
  );
};

export default ResultTable;

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

const EditIcon = () => <IconBase><path {...strokeProps} d="M12 20h9" /><path {...strokeProps} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></IconBase>;
const TrashIcon = () => <IconBase><path {...strokeProps} d="M3 6h18" /><path {...strokeProps} d="M8 6V4h8v2" /><path {...strokeProps} d="M6 6l1 15h10l1-15" /></IconBase>;
const CheckIcon = () => <IconBase><path {...strokeProps} d="m20 6-11 11-5-5" /></IconBase>;
const CloseIcon = () => <IconBase><path {...strokeProps} d="M18 6 6 18M6 6l12 12" /></IconBase>;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 1180px;
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

const Input = styled.input`
  width: 100%;
  min-height: 36px;
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #ffffff);
  padding: 0 10px;
  font: inherit;
`;

const LogoImage = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.08);
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
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
