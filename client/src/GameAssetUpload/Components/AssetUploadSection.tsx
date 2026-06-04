import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { AssetGalleryRecord, AssetUploadRow } from "../Repository/remote";
import useGameAssetGalleryController from "../Controller/useGameAssetGalleryController";
import useGameAssetUploadController from "../Controller/useGameAssetUploadController";

type AssetUploadSectionProps = {
  title: string;
  note: string;
  nameLabel: string;
  codeLabel: string;
  createUrl: string;
  getUrl: string;
  updateUrl: (id: string | number) => string;
  deleteUrl: (id: string | number) => string;
  bulk?: boolean;
};

const emptyRow = (): AssetUploadRow => ({
  operation: "create",
  recordId: "",
  name: "",
  code: "",
  description: "",
  image: null,
});

const rowFromFile = (file: File): AssetUploadRow => ({
  operation: "create",
  recordId: "",
  name: "",
  code: "",
  description: "",
  image: file,
});

const rowFromRecord = (record: AssetGalleryRecord): AssetUploadRow => ({
  operation: "update",
  recordId: record.id || record._id || "",
  name: record.name === "Unnamed" ? "" : record.name,
  code: record.assetId || "",
  description: record.description || "",
  existingImageUrl: record.imageUrl || "",
  image: null,
});

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </svg>
);

const getFileName = (fileField: any) => {
  if (!fileField) return "";
  if (fileField instanceof File) return fileField.name;
  if (fileField instanceof FileList && fileField[0]) return fileField[0].name;
  if (Array.isArray(fileField) && fileField[0]) return fileField[0].name;
  if (typeof fileField === "object" && fileField[0]) return fileField[0].name;
  return "";
};

const getCreatedRecordId = (response: any) => {
  const data =
    response?.data?.data ||
    response?.data?.record ||
    response?.data?.item ||
    response?.data ||
    response;
  const record = Array.isArray(data) ? data[0] : data;

  return record?.id || record?._id || record?.recordId || record?.record_id || "";
};

const isRowEmpty = (row: AssetUploadRow) =>
  !row.recordId &&
  !row.name.trim() &&
  !row.code.trim() &&
  !row.description?.trim() &&
  !getFileName(row.image) &&
  !row.existingImageUrl;

const AssetUploadSection = ({
  title,
  note,
  nameLabel,
  codeLabel,
  createUrl,
  getUrl,
  updateUrl,
  deleteUrl,
  bulk = true,
}: AssetUploadSectionProps) => {
  const [rows, setRows] = useState<AssetUploadRow[]>([emptyRow()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const { deleteAsset, error, isSaving, saveAsset, saveAssets, successMessage, uploadProgress } =
    useGameAssetUploadController({ createUrl, updateUrl, deleteUrl });
  const {
    error: loadError,
    isLoading,
    records,
    refreshRecords,
  } = useGameAssetGalleryController(getUrl);

  useEffect(() => {
    const recordRows = records.map(rowFromRecord);
    setRows(recordRows.length ? recordRows : [emptyRow()]);
  }, [records]);

  const previewUrls = useMemo(
    () =>
      rows.map((row) => {
        const fileField = row.image;
        const file =
          fileField instanceof File
            ? fileField
            : fileField instanceof FileList && fileField[0]
              ? fileField[0]
              : Array.isArray(fileField) && fileField[0] instanceof File
                ? fileField[0]
                : null;

        return file ? URL.createObjectURL(file) : row.existingImageUrl || "";
      }),
    [rows],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const rowSummary = useMemo(() => {
    const createCount = rows.filter((row) => row.operation !== "update").length;
    const updateCount = rows.filter((row) => row.operation === "update").length;
    const imageCount = rows.filter((row) => getFileName(row.image) || row.existingImageUrl).length;
    return `${imageCount} images, ${createCount} create, ${updateCount} update`;
  }, [rows]);

  const updateRow = (index: number, nextRow: Partial<AssetUploadRow>) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...nextRow } : row,
      ),
    );
  };

  const addRow = () => {
    setRows((currentRows) => [...currentRows, emptyRow()]);
  };

  const addFiles = (files: FileList | File[]) => {
    const imageRows = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map(rowFromFile);

    if (imageRows.length === 0) return;

    setRows((currentRows) => {
      const hasOnlyEmptyRow =
        currentRows.length === 1 &&
        !currentRows[0].recordId &&
        !currentRows[0].name &&
        !currentRows[0].code &&
        !currentRows[0].description &&
        !getFileName(currentRows[0].image);

      const nextRows = hasOnlyEmptyRow ? imageRows : [...currentRows, ...imageRows];

      return nextRows;
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    addFiles(event.dataTransfer.files);
  };

  const removeRowLocally = (index: number) => {
    setRows((currentRows) =>
      currentRows.length === 1
        ? [emptyRow()]
        : currentRows.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const deleteRow = async (index: number) => {
    const row = rows[index];

    if (row.operation === "update" && row.recordId) {
      await deleteAsset(row.recordId);
      await refreshRecords();
      return;
    }

    removeRowLocally(index);
  };

  const handleDeleteRow = (index: number) => {
    setPendingDeleteIndex(index);
  };

  const confirmDeleteRow = async () => {
    if (pendingDeleteIndex === null) return;
    await deleteRow(pendingDeleteIndex);
    setPendingDeleteIndex(null);
  };

  const pendingDeleteRow =
    pendingDeleteIndex === null ? null : rows[pendingDeleteIndex] || null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const activeRows = rows.filter((row) => !isRowEmpty(row));
    const invalidRows = activeRows.filter((row) => {
      if (row.operation === "update") return !row.recordId || !row.name.trim() || !row.code.trim();
      return !getFileName(row.image) || !row.name.trim() || !row.code.trim();
    });

    if (activeRows.length === 0) {
      setFormError("Drop or select at least one image before saving.");
      return;
    }

    if (invalidRows.length > 0) {
      setFormError("Create rows need image, name, and ID. Update rows need record ID, name, and ID.");
      return;
    }

    setFormError(null);
    const result = await saveAssets(activeRows);

    const createdRecords =
      result?.createResponse?.data?.data ||
      result?.createResponse?.data?.items ||
      result?.createResponse?.data?.records ||
      [];

    if (Array.isArray(createdRecords) && createdRecords.length > 0) {
      let createRecordIndex = 0;
      setRows((currentRows) =>
        currentRows.map((row) => {
          if (row.operation === "update" || !getFileName(row.image)) return row;
          const createdRecord = createdRecords[createRecordIndex];
          createRecordIndex += 1;
          return {
            ...row,
            recordId:
              createdRecord?.id ||
              createdRecord?._id ||
              createdRecord?.recordId ||
              row.recordId,
            operation: "update",
          };
        }),
      );
    }

    await refreshRecords();
  };

  const handleSaveRow = async (index: number) => {
    const row = rows[index];

    if (row.operation === "update" && !row.recordId) {
      setFormError("Update rows need a record ID before saving.");
      return;
    }

    if (!row.name.trim() || !row.code.trim()) {
      setFormError("Name and ID are required before saving.");
      return;
    }

    if (row.operation !== "update" && !getFileName(row.image)) {
      setFormError("Create rows need an image before saving.");
      return;
    }

    setFormError(null);
    const response = await saveAsset(row);
    const createdRecordId = row.recordId ? "" : getCreatedRecordId(response);

    if (createdRecordId) {
      updateRow(index, { recordId: createdRecordId, operation: "update" });
    }

    await refreshRecords();
  };

  return (
    <Section>
      <SectionTop>
        <div>
          <SectionTitle>{title}</SectionTitle>
          <SectionNote>{note}</SectionNote>
        </div>
        <SectionTopActions>
          <SectionMeta>{rowSummary}</SectionMeta>
          <CollapseButton
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? "Hide Upload" : "Show Upload"}
          </CollapseButton>
        </SectionTopActions>
      </SectionTop>

      {isExpanded && (
        <>
          {(formError || error || loadError) && <Status $tone="error">{formError || error || loadError}</Status>}
          {successMessage && <Status>{successMessage}</Status>}
          {isLoading && <Status>Loading uploaded list...</Status>}

          <Form onSubmit={handleSubmit} noValidate>
        <DropZone
          $isDragOver={isDragOver}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <DropCopy>
            <strong>Drop images here</strong>
            <span>Select or drag many images from your computer. ID and name can be filled later.</span>
          </DropCopy>
          <BulkFileInput
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </DropZone>

        {(isSaving || uploadProgress > 0 || successMessage) && (
          <ProgressWrap>
            <ProgressTop>
              <span>Upload process</span>
              <strong>{uploadProgress}%</strong>
            </ProgressTop>
            <ProgressTrack>
              <ProgressFill style={{ width: `${uploadProgress}%` }} />
            </ProgressTrack>
          </ProgressWrap>
        )}

        <Rows>
          {rows.map((row, index) => {
            return (
            <UploadRow key={index}>
              <RowMedia>
                <IndexCell>{String(index + 1).padStart(2, "0")}</IndexCell>
                {previewUrls[index] ? (
                  <PreviewImage src={previewUrls[index]} alt={getFileName(row.image) || row.name} />
                ) : (
                  <PreviewFallback>No image</PreviewFallback>
                )}
                <FileInput
                  type="file"
                  accept="image/*"
                  disabled={isSaving}
                  onChange={(event) => updateRow(index, { image: event.target.files })}
                />
                <FileName>{getFileName(row.image) || (row.existingImageUrl ? "Uploaded image" : "No image selected")}</FileName>
              </RowMedia>

              <RowFields>
                <CompactFields>
                  <FieldGroup>
                    <Label>Mode</Label>
                    <Select
                      value={row.operation || "create"}
                      disabled={isSaving}
                      onChange={(event) =>
                        updateRow(index, {
                          operation: event.target.value as "create" | "update",
                        })
                      }
                    >
                      <option value="create">Create</option>
                      <option value="update">Update</option>
                    </Select>
                  </FieldGroup>

                  <FieldGroup>
                    <Label>Record ID</Label>
                    <Input
                      value={row.recordId || ""}
                      placeholder="Only for update"
                      disabled={isSaving || row.operation !== "update"}
                      onChange={(event) => updateRow(index, { recordId: event.target.value })}
                    />
                  </FieldGroup>
                </CompactFields>

                <MainFields>
                  <FieldGroup>
                    <Label>{nameLabel} *</Label>
                    <Input
                      value={row.name}
                      placeholder={nameLabel}
                      disabled={isSaving}
                      onChange={(event) => updateRow(index, { name: event.target.value })}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Label>{codeLabel} *</Label>
                    <Input
                      value={row.code}
                      placeholder={codeLabel}
                      disabled={isSaving}
                      onChange={(event) => updateRow(index, { code: event.target.value })}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Label>Description</Label>
                    <Input
                      value={row.description || ""}
                      placeholder="Optional"
                      disabled={isSaving}
                      onChange={(event) => updateRow(index, { description: event.target.value })}
                    />
                  </FieldGroup>
                </MainFields>
              </RowFields>

              <RowSide>
                <StatusCell>
                  {successMessage
                    ? "Uploaded"
                    : isSaving
                      ? "Uploading"
                      : getFileName(row.image) || row.existingImageUrl
                        ? "Ready"
                        : "Waiting"}
                </StatusCell>
                <RowActions>
                  <IconButton
                    type="button"
                    $variant="success"
                    onClick={() => handleSaveRow(index)}
                    disabled={isSaving}
                    title="Save row"
                    aria-label={`Save ${row.name || getFileName(row.image) || "asset"} row`}
                  >
                    <SaveIcon />
                  </IconButton>
                  <IconButton
                    type="button"
                    $variant="danger"
                    onClick={() => handleDeleteRow(index)}
                    disabled={isSaving}
                    title="Delete row"
                    aria-label={`Delete ${row.name || getFileName(row.image) || "asset"} row`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </RowActions>
              </RowSide>
            </UploadRow>
          );
          })}
        </Rows>

        <Actions>
          {bulk && (
            <GhostButton type="button" onClick={addRow} disabled={isSaving}>
              Add Row
            </GhostButton>
          )}
          <SaveButton type="submit" disabled={isSaving}>
            {isSaving ? `Uploading ${uploadProgress}%` : "Save Upload"}
          </SaveButton>
        </Actions>
          </Form>
        </>
      )}

      {pendingDeleteRow && (
        <DialogOverlay>
          <DialogCard role="dialog" aria-modal="true" aria-labelledby={`${title}-delete-title`}>
            <DialogTitle id={`${title}-delete-title`}>Delete row?</DialogTitle>
            <DialogText>
              {pendingDeleteRow.operation === "update"
                ? "This saved upload will be deleted from the server."
                : "This unsaved upload row will be removed from the list."}
            </DialogText>
            <DialogPreview>
              {pendingDeleteRow.existingImageUrl || getFileName(pendingDeleteRow.image) ? (
                <DialogThumb
                  src={
                    pendingDeleteRow.existingImageUrl ||
                    previewUrls[pendingDeleteIndex ?? 0]
                  }
                  alt={pendingDeleteRow.name || "Delete preview"}
                />
              ) : (
                <DialogThumbFallback>No image</DialogThumbFallback>
              )}
              <div>
                <DialogAssetName>{pendingDeleteRow.name || "Unnamed"}</DialogAssetName>
                <DialogMeta>ID: {pendingDeleteRow.code || "-"}</DialogMeta>
              </div>
            </DialogPreview>
            <DialogActions>
              <GhostButton
                type="button"
                onClick={() => setPendingDeleteIndex(null)}
                disabled={isSaving}
              >
                Cancel
              </GhostButton>
              <DangerButton
                type="button"
                onClick={confirmDeleteRow}
                disabled={isSaving}
              >
                Delete
              </DangerButton>
            </DialogActions>
          </DialogCard>
        </DialogOverlay>
      )}
    </Section>
  );
};

export default AssetUploadSection;

const Section = styled.section`
  border: 1px solid var(--project-border, #263244);
  border-radius: 0.5rem;
  background: var(--project-surface, #101722);
  overflow: hidden;
`;

const SectionTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--project-border, #263244);
  background: var(--project-surface-alt, #0d1320);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0;
`;

const SectionNote = styled.p`
  margin: 0.35rem 0 0;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.82rem;
`;

const SectionMeta = styled.div`
  flex: 0 0 auto;
  color: var(--project-text-secondary, #94a3b8);
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.35rem;
  padding: 0.35rem 0.55rem;
  font-size: 0.74rem;
  font-weight: 800;
`;

const SectionTopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const CollapseButton = styled.button`
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.35rem;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #f8fafc);
  cursor: pointer;
  padding: 0.35rem 0.55rem;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Status = styled.div<{ $tone?: "error" }>`
  margin: 1rem 1rem 0;
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "var(--project-danger, #ef4444)" : "var(--project-success, #15803d)")};
  border-radius: 0.35rem;
  background: ${({ $tone }) =>
    $tone === "error" ? "rgba(239, 68, 68, 0.12)" : "rgba(22, 163, 74, 0.12)"};
  color: ${({ $tone }) => ($tone === "error" ? "#fecaca" : "#bbf7d0")};
  padding: 0.65rem 0.75rem;
  font-size: 0.82rem;
`;

const Form = styled.form`
  display: grid;
  gap: 1rem;
  padding: 1rem;
`;

const DropZone = styled.div<{ $isDragOver: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 7rem;
  padding: 1rem;
  border: 1px dashed ${({ $isDragOver }) => ($isDragOver ? "#22c55e" : "var(--project-border, #334155)")};
  border-radius: 0.5rem;
  background: ${({ $isDragOver }) =>
    $isDragOver ? "rgba(34, 197, 94, 0.12)" : "rgba(15, 23, 42, 0.72)"};

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const DropCopy = styled.div`
  display: grid;
  gap: 0.35rem;

  strong {
    color: var(--project-text-primary, #ffffff);
    font-size: 1rem;
  }

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.82rem;
  }
`;

const BulkFileInput = styled.input`
  max-width: 21rem;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.76rem;

  &::file-selector-button {
    margin-right: 0.6rem;
    border: 1px solid var(--project-primary, #ef4444);
    border-radius: 0.35rem;
    background: var(--project-primary, #ef4444);
    color: var(--project-text-primary, #ffffff);
    padding: 0.62rem 0.75rem;
    cursor: pointer;
    font-weight: 900;
    text-transform: uppercase;
  }
`;

const ProgressWrap = styled.div`
  display: grid;
  gap: 0.45rem;
  padding: 0.75rem;
  border: 1px solid var(--project-border, #263244);
  border-radius: 0.45rem;
  background: rgba(15, 23, 42, 0.56);
`;

const ProgressTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;

  strong {
    color: var(--project-text-primary, #ffffff);
  }
`;

const ProgressTrack = styled.div`
  height: 0.55rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--project-background, #020617);
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: var(--project-primary, #ef4444);
  transition: width 0.18s ease;
`;

const Rows = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const UploadRow = styled.div`
  display: grid;
  grid-template-columns: minmax(9rem, 12rem) minmax(0, 1fr) 7rem;
  align-items: stretch;
  gap: 0.85rem;
  padding: 0.9rem;
  border: 1px solid var(--project-border, #263244);
  border-radius: 0.45rem;
  background: rgba(15, 23, 42, 0.64);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const RowMedia = styled.div`
  display: grid;
  gap: 0.45rem;
  align-content: start;
  min-width: 0;
`;

const RowFields = styled.div`
  display: grid;
  gap: 0.75rem;
  min-width: 0;
`;

const CompactFields = styled.div`
  display: grid;
  grid-template-columns: minmax(8rem, 10rem) minmax(8rem, 1fr);
  gap: 0.65rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MainFields = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const RowSide = styled.div`
  display: grid;
  align-content: space-between;
  gap: 0.65rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
`;

const IndexCell = styled.div`
  min-height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--project-text-secondary, #94a3b8);
  font-weight: 900;

  &::before {
    content: "Row";
    color: var(--project-text-secondary, #64748b);
    font-size: 0.68rem;
    text-transform: uppercase;
  }
`;

const FieldGroup = styled.label`
  display: grid;
  gap: 0.35rem;
  min-width: 0;
`;

const Label = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.35rem;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #f8fafc);
  padding: 0.62rem 0.7rem;
  font-size: 0.82rem;

  &:focus {
    outline: none;
    border-color: var(--project-accent, #ffffff);
  }

  &:disabled {
    color: var(--project-text-secondary, #64748b);
    cursor: not-allowed;
    opacity: 0.75;
  }
`;

const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.35rem;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #f8fafc);
  padding: 0.62rem 0.7rem;
  font-size: 0.82rem;

  &:focus {
    outline: none;
    border-color: var(--project-accent, #ffffff);
  }

  &:disabled {
    color: var(--project-text-secondary, #64748b);
    cursor: not-allowed;
    opacity: 0.75;
  }
`;

const FileInput = styled.input`
  width: 100%;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.72rem;

  &::file-selector-button {
    margin-right: 0.5rem;
    border: 1px solid var(--project-border, #334155);
    border-radius: 0.35rem;
    background: var(--project-surface, #111827);
    color: var(--project-text-primary, #f8fafc);
    padding: 0.45rem 0.55rem;
    cursor: pointer;
    font-weight: 800;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }
`;

const FileName = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.72rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PreviewImage = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.35rem;
  object-fit: cover;
  background: var(--project-background, #020617);
`;

const PreviewFallback = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 0.35rem;
  color: var(--project-text-secondary, #64748b);
  background: var(--project-background, #020617);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const StatusCell = styled.div`
  min-height: 2.3rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.35rem;
  color: var(--project-text-secondary, #94a3b8);
  background: var(--project-background, #0f172a);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const RowActions = styled.div`
  align-self: end;
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
`;

const IconButton = styled.button<{ $variant?: "danger" | "success" }>`
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid ${({ $variant }) =>
    $variant === "danger"
      ? "var(--project-danger, #ef4444)"
      : $variant === "success"
        ? "var(--project-success, #16a34a)"
        : "var(--project-border, #334155)"};
  border-radius: 0.35rem;
  display: inline-grid;
  place-items: center;
  background: ${({ $variant }) =>
    $variant === "danger"
      ? "rgba(220, 38, 38, 0.88)"
      : $variant === "success"
        ? "rgba(22, 163, 74, 0.88)"
        : "var(--project-background, #0f172a)"};
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;
  padding: 0;

  svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover:not(:disabled) {
    border-color: var(--project-text-primary, #ffffff);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const GhostButton = styled.button`
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.35rem;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #f8fafc);
  cursor: pointer;
  padding: 0.65rem 0.9rem;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const SaveButton = styled(GhostButton)`
  border-color: var(--project-primary, #ef4444);
  background: var(--project-primary, #ef4444);
`;

const DangerButton = styled(GhostButton)`
  border-color: var(--project-danger, #ef4444);
  background: var(--project-danger, #dc2626);
`;

const DialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: start center;
  padding: 6rem 1rem 1rem;
  background: rgba(2, 6, 23, 0.58);
  backdrop-filter: blur(8px);
`;

const DialogCard = styled.div`
  width: min(100%, 28rem);
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.5rem;
  background: var(--project-surface, #101722);
  color: var(--project-text-primary, #f8fafc);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
  padding: 1rem;
`;

const DialogTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
`;

const DialogText = styled.p`
  margin: 0.5rem 0 0;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.86rem;
`;

const DialogPreview = styled.div`
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--project-border, #263244);
  border-radius: 0.45rem;
  background: var(--project-background, #0f172a);
`;

const DialogThumb = styled.img`
  width: 4rem;
  height: 4rem;
  border-radius: 0.35rem;
  object-fit: cover;
  background: var(--project-background, #020617);
`;

const DialogThumbFallback = styled.div`
  width: 4rem;
  height: 4rem;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 0.35rem;
  display: grid;
  place-items: center;
  color: var(--project-text-secondary, #64748b);
  font-size: 0.7rem;
  font-weight: 900;
`;

const DialogAssetName = styled.div`
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DialogMeta = styled.div`
  margin-top: 0.25rem;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.8rem;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 1rem;
`;

const RemoveButton = styled(GhostButton)`
  align-self: end;
  padding: 0.58rem 0.65rem;
`;
