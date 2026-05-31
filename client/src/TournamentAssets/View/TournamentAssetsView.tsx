import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  TournamentAsset,
  createTournamentAssetApi,
  deleteTournamentAssetApi,
  getTournamentAssetId,
  getTournamentAssetName,
  getTournamentAssetUrl,
  getTournamentAssetsApi,
  isTournamentAssetActive,
  updateTournamentAssetApi,
} from "../Repository/remote";

const getFileName = (file: File | null) => file?.name || "";

const TournamentAssetsView: React.FC = () => {
  const [assets, setAssets] = useState<TournamentAsset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingAssetId, setEditingAssetId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingActive, setEditingActive] = useState(true);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedAssets = useMemo(
    () => [...assets].sort((left, right) => getTournamentAssetId(left).localeCompare(getTournamentAssetId(right))),
    [assets],
  );

  const loadAssets = async () => {
    setIsLoading(true);
    setError("");
    try {
      setAssets(await getTournamentAssetsApi());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load tournament assets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const resetCreateForm = () => {
    setAssetId("");
    setName("");
    setDescription("");
    setActive(true);
    setFile(null);
    const input = document.getElementById("tournament-asset-image") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const buildFormData = (
    nextAssetId: string,
    nextName: string,
    nextDescription: string,
    nextActive: boolean,
    nextFile: File | null,
  ) => {
    const formData = new FormData();
    formData.append("asset_id", nextAssetId.trim());
    formData.append("name", nextName.trim());
    formData.append("description", nextDescription.trim());
    formData.append("active", String(nextActive));
    if (nextFile) formData.append("image", nextFile);
    return formData;
  };

  const validate = (nextAssetId: string, nextName: string, requireFile: boolean, nextFile: File | null) => {
    if (!nextAssetId.trim()) return "Asset ID is required";
    if (!nextName.trim()) return "Name is required";
    if (requireFile && !nextFile) return "Image is required";
    return "";
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate(assetId, name, true, file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await createTournamentAssetApi(buildFormData(assetId, name, description, active, file));
      setMessage("Tournament asset uploaded");
      resetCreateForm();
      await loadAssets();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload tournament asset");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (asset: TournamentAsset) => {
    setEditingId(asset.id);
    setEditingAssetId(getTournamentAssetId(asset));
    setEditingName(getTournamentAssetName(asset));
    setEditingDescription(String(asset.description || ""));
    setEditingActive(isTournamentAssetActive(asset));
    setEditingFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingAssetId("");
    setEditingName("");
    setEditingDescription("");
    setEditingActive(true);
    setEditingFile(null);
  };

  const handleUpdate = async (asset: TournamentAsset) => {
    const validationError = validate(editingAssetId, editingName, false, editingFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await updateTournamentAssetApi(
        asset.id,
        buildFormData(editingAssetId, editingName, editingDescription, editingActive, editingFile),
      );
      setMessage("Tournament asset updated");
      cancelEdit();
      await loadAssets();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update tournament asset");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (asset: TournamentAsset) => {
    if (!window.confirm(`Delete ${getTournamentAssetName(asset)}?`)) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteTournamentAssetApi(asset.id);
      setMessage("Tournament asset deleted");
      await loadAssets();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete tournament asset");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <Container>
        <Header>
          <TitleBlock>
            <h1>Tournament Assets</h1>
            <p>Upload asset id, name, optional description, image, and active status.</p>
          </TitleBlock>
        </Header>

        {error && <Status $tone="error">{error}</Status>}
        {message && <Status>{message}</Status>}
        {isLoading && <Status>Loading tournament assets...</Status>}

        <UploadPanel onSubmit={handleCreate}>
          <Field>
            <Label htmlFor="tournament-asset-id">Asset ID</Label>
            <Input id="tournament-asset-id" value={assetId} onChange={(event) => setAssetId(event.target.value)} placeholder="ASSET_001" disabled={isSaving} />
          </Field>
          <Field>
            <Label htmlFor="tournament-asset-name">Name</Label>
            <Input id="tournament-asset-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Asset Name" disabled={isSaving} />
          </Field>
          <Field>
            <Label htmlFor="tournament-asset-description">Description</Label>
            <Input id="tournament-asset-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional" disabled={isSaving} />
          </Field>
          <Field>
            <Label htmlFor="tournament-asset-image">Image</Label>
            <FileInput id="tournament-asset-image" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} disabled={isSaving} />
            <Muted>{getFileName(file) || "PNG, JPG, WEBP, or SVG"}</Muted>
          </Field>
          <Field>
            <Label>Active</Label>
            <ToggleRow>
              <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={isSaving} />
              <span>{active ? "Active" : "Disabled"}</span>
            </ToggleRow>
          </Field>
          <Button type="submit" disabled={isSaving}>Upload</Button>
        </UploadPanel>

        <AssetGrid>
          {sortedAssets.length === 0 && !isLoading ? (
            <EmptyState>No tournament assets uploaded yet.</EmptyState>
          ) : (
            sortedAssets.map((asset) => {
              const isEditing = editingId === asset.id;
              const imageUrl = getTournamentAssetUrl(asset);

              return (
                <AssetCard key={asset.id}>
                  {imageUrl ? <Preview src={imageUrl} alt={getTournamentAssetName(asset)} /> : <PreviewFallback>No Image</PreviewFallback>}
                  <CardBody>
                    {isEditing ? (
                      <>
                        <Input value={editingAssetId} onChange={(event) => setEditingAssetId(event.target.value)} placeholder="ASSET_001" disabled={isSaving} />
                        <Input value={editingName} onChange={(event) => setEditingName(event.target.value)} placeholder="Asset Name" disabled={isSaving} />
                        <Input value={editingDescription} onChange={(event) => setEditingDescription(event.target.value)} placeholder="Optional description" disabled={isSaving} />
                        <FileInput type="file" accept="image/*" onChange={(event) => setEditingFile(event.target.files?.[0] || null)} disabled={isSaving} />
                        <Muted>{getFileName(editingFile) || "Current image kept"}</Muted>
                        <ToggleRow>
                          <input type="checkbox" checked={editingActive} onChange={(event) => setEditingActive(event.target.checked)} disabled={isSaving} />
                          <span>{editingActive ? "Active" : "Disabled"}</span>
                        </ToggleRow>
                      </>
                    ) : (
                      <>
                        <AssetName>{getTournamentAssetName(asset)}</AssetName>
                        <Muted>{getTournamentAssetId(asset)}</Muted>
                        {asset.description && <Muted>{asset.description}</Muted>}
                        <Badge $active={isTournamentAssetActive(asset)}>{isTournamentAssetActive(asset) ? "Active" : "Disabled"}</Badge>
                      </>
                    )}
                  </CardBody>
                  <Actions>
                    {isEditing ? (
                      <>
                        <Button type="button" onClick={() => handleUpdate(asset)} disabled={isSaving}>Save</Button>
                        <Button type="button" $variant="ghost" onClick={cancelEdit} disabled={isSaving}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" $variant="ghost" onClick={() => startEdit(asset)} disabled={isSaving}>Edit</Button>
                        <Button type="button" $variant="danger" onClick={() => handleDelete(asset)} disabled={isSaving}>Delete</Button>
                      </>
                    )}
                  </Actions>
                </AssetCard>
              );
            })
          )}
        </AssetGrid>
      </Container>
    </Page>
  );
};

export default TournamentAssetsView;

const Page = styled.main`
  min-height: 100vh;
  padding: 2rem 1.25rem;
  box-sizing: border-box;
  background: var(--project-background, #090d14);
  color: var(--project-text-primary, #f8fafc);
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Container = styled.div`
  width: min(1120px, 100%);
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 1rem;
`;

const TitleBlock = styled.div`
  h1 {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.5rem);
  }

  p {
    margin: 0.45rem 0 0;
    color: var(--project-text-secondary, #94a3b8);
  }
`;

const Status = styled.div<{ $tone?: "error" }>`
  margin-bottom: 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "#ef4444" : "#14b8a6")};
  border-radius: 8px;
  background: ${({ $tone }) => ($tone === "error" ? "rgba(239, 68, 68, 0.12)" : "rgba(20, 184, 166, 0.12)")};
  color: ${({ $tone }) => ($tone === "error" ? "#fecaca" : "#ccfbf1")};
  font-size: 0.88rem;
`;

const UploadPanel = styled.form`
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, 1fr)) auto;
  align-items: end;
  gap: 0.85rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 0.4rem;
`;

const Label = styled.label`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Input = styled.input`
  width: 100%;
  min-height: 2.4rem;
  box-sizing: border-box;
  border: 1px solid var(--project-border, #334155);
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  background: var(--project-background, #0f172a);
  color: var(--project-text-primary, #f8fafc);
`;

const FileInput = styled.input`
  width: 100%;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.76rem;
`;

const ToggleRow = styled.label`
  min-height: 2.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--project-text-primary, #f8fafc);
  font-size: 0.84rem;
  font-weight: 800;

  input {
    width: 18px;
    height: 18px;
  }
`;

const Button = styled.button<{ $variant?: "danger" | "ghost" }>`
  min-height: 2.4rem;
  border: 1px solid ${({ $variant }) => ($variant === "danger" ? "#ef4444" : $variant === "ghost" ? "var(--project-border, #334155)" : "var(--project-primary, #ef4444)")};
  border-radius: 6px;
  padding: 0.52rem 0.85rem;
  background: ${({ $variant }) => ($variant === "danger" ? "#dc2626" : $variant === "ghost" ? "rgba(15, 23, 42, 0.82)" : "var(--project-primary, #ef4444)")};
  color: #ffffff;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const AssetGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.85rem;
`;

const AssetCard = styled.article`
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
`;

const Preview = styled.img`
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  object-fit: contain;
  background: #020617;
`;

const PreviewFallback = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 8px;
  color: var(--project-text-secondary, #94a3b8);
  font-weight: 800;
`;

const CardBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.4rem;
`;

const AssetName = styled.h2`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
`;

const Muted = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.78rem;
`;

const Badge = styled.span<{ $active: boolean }>`
  width: fit-content;
  border: 1px solid ${({ $active }) => ($active ? "#22c55e" : "var(--project-border, #334155)")};
  border-radius: 999px;
  padding: 0.28rem 0.6rem;
  color: ${({ $active }) => ($active ? "#bbf7d0" : "var(--project-text-secondary, #94a3b8)")};
  background: ${({ $active }) => ($active ? "rgba(34, 197, 94, 0.14)" : "rgba(15, 23, 42, 0.8)")};
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: grid;
  place-items: center;
  min-height: 220px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  color: var(--project-text-secondary, #94a3b8);
  background: rgba(15, 23, 42, 0.65);
  font-weight: 800;
`;
