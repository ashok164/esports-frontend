import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  TeamBanner,
  TeamBannerKind,
  createTeamBannerApi,
  deleteTeamBannerApi,
  getTeamBannerFileField,
  getTeamBannerName,
  getTeamBannerUrl,
  getTeamBannersApi,
  updateTeamBannerApi,
} from "../Repository/remote";

type Props = {
  kind: TeamBannerKind;
  title: string;
  description: string;
};

const getFileName = (file: File | null) => file?.name || "";

const TeamBannerManager: React.FC<Props> = ({ kind, title, description }) => {
  const [banners, setBanners] = useState<TeamBanner[]>([]);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingTeamId, setEditingTeamId] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingActive, setEditingActive] = useState(true);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedBanners = useMemo(
    () => [...banners].sort((left, right) => getTeamBannerName(left).localeCompare(getTeamBannerName(right))),
    [banners],
  );

  const loadBanners = async () => {
    setIsLoading(true);
    setError("");
    try {
      setBanners(await getTeamBannersApi(kind));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Failed to load ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [kind]);

  const resetCreateForm = () => {
    setName("");
    setTeamId("");
    setBannerDescription("");
    setActive(true);
    setFile(null);
    const input = document.getElementById(`${kind}-team-banner-file`) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const buildFormData = (
    bannerName: string,
    bannerTeamId: string,
    bannerDescription: string,
    bannerActive: boolean,
    bannerFile: File | null,
  ) => {
    const formData = new FormData();
    if (bannerName.trim()) formData.append("name", bannerName.trim());
    if (bannerTeamId.trim()) formData.append("team_id", bannerTeamId.trim());
    formData.append("description", bannerDescription.trim());
    formData.append("active", String(bannerActive));
    if (bannerFile) formData.append(getTeamBannerFileField(kind), bannerFile);
    return formData;
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teamId.trim()) {
      setError("Team ID is required");
      return;
    }

    if (!file) {
      setError("Banner image is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await createTeamBannerApi(kind, buildFormData(name, teamId, bannerDescription, active, file));
      setMessage(`${title} uploaded`);
      resetCreateForm();
      await loadBanners();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Failed to upload ${title.toLowerCase()}`);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (banner: TeamBanner) => {
    setEditingId(banner.id);
    setEditingName(getTeamBannerName(banner));
    setEditingTeamId(String(banner.team_id || banner.teamId || ""));
    setEditingDescription(String(banner.description || ""));
    setEditingActive(banner.active === true || banner.active === 1 || banner.active === "1" || banner.active === "true");
    setEditingFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingTeamId("");
    setEditingDescription("");
    setEditingActive(true);
    setEditingFile(null);
  };

  const handleUpdate = async (banner: TeamBanner) => {
    if (!editingTeamId.trim()) {
      setError("Team ID is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await updateTeamBannerApi(kind, banner.id, buildFormData(editingName, editingTeamId, editingDescription, editingActive, editingFile));
      setMessage(`${title} updated`);
      cancelEdit();
      await loadBanners();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Failed to update ${title.toLowerCase()}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (banner: TeamBanner) => {
    if (!window.confirm(`Delete ${getTeamBannerName(banner)}?`)) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteTeamBannerApi(kind, banner.id);
      setMessage(`${title} deleted`);
      await loadBanners();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Failed to delete ${title.toLowerCase()}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <Container>
        <Header>
          <TitleBlock>
            <h1>{title}</h1>
            <p>{description}</p>
          </TitleBlock>
        </Header>

        {error && <Status $tone="error">{error}</Status>}
        {message && <Status>{message}</Status>}
        {isLoading && <Status>Loading banners...</Status>}

        <UploadPanel onSubmit={handleCreate}>
          <Field>
            <Label htmlFor={`${kind}-team-banner-name`}>Name</Label>
            <Input
              id={`${kind}-team-banner-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Team banner"
              disabled={isSaving}
            />
          </Field>
          <Field>
            <Label htmlFor={`${kind}-team-banner-team-id`}>Team ID</Label>
            <Input
              id={`${kind}-team-banner-team-id`}
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              placeholder="123"
              disabled={isSaving}
            />
          </Field>
          <Field>
            <Label htmlFor={`${kind}-team-banner-description`}>Description</Label>
            <Input
              id={`${kind}-team-banner-description`}
              value={bannerDescription}
              onChange={(event) => setBannerDescription(event.target.value)}
              placeholder="Optional text"
              disabled={isSaving}
            />
          </Field>
          <Field>
            <Label htmlFor={`${kind}-team-banner-file`}>Banner Image</Label>
            <FileInput
              id={`${kind}-team-banner-file`}
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              disabled={isSaving}
            />
            <Muted>{getFileName(file) || "PNG, JPG, WEBP, or SVG"}</Muted>
          </Field>
          <Field>
            <Label>Active</Label>
            <ToggleRow>
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                disabled={isSaving}
              />
              <span>{active ? "Active" : "Disabled"}</span>
            </ToggleRow>
          </Field>
          <Button type="submit" disabled={isSaving}>Upload</Button>
        </UploadPanel>

        <BannerGrid>
          {sortedBanners.length === 0 && !isLoading ? (
            <EmptyState>No banners uploaded yet.</EmptyState>
          ) : (
            sortedBanners.map((banner) => {
              const isEditing = editingId === banner.id;
              const imageUrl = getTeamBannerUrl(banner);

              return (
                <BannerCard key={banner.id}>
                  {imageUrl ? <Preview src={imageUrl} alt={getTeamBannerName(banner)} /> : <PreviewFallback>No Image</PreviewFallback>}
                  <CardBody>
                    {isEditing ? (
                      <>
                        <Input value={editingName} onChange={(event) => setEditingName(event.target.value)} disabled={isSaving} />
                        <Input
                          value={editingTeamId}
                          onChange={(event) => setEditingTeamId(event.target.value)}
                          placeholder="Team ID"
                          disabled={isSaving}
                        />
                        <Input
                          value={editingDescription}
                          onChange={(event) => setEditingDescription(event.target.value)}
                          placeholder="Optional description"
                          disabled={isSaving}
                        />
                        <FileInput
                          type="file"
                          accept="image/*"
                          onChange={(event) => setEditingFile(event.target.files?.[0] || null)}
                          disabled={isSaving}
                        />
                        <Muted>{getFileName(editingFile) || "Current image kept"}</Muted>
                        <ToggleRow>
                          <input
                            type="checkbox"
                            checked={editingActive}
                            onChange={(event) => setEditingActive(event.target.checked)}
                            disabled={isSaving}
                          />
                          <span>{editingActive ? "Active" : "Disabled"}</span>
                        </ToggleRow>
                      </>
                    ) : (
                      <>
                        <BannerName>{getTeamBannerName(banner)}</BannerName>
                        <Muted>Team ID: {banner.team_id || banner.teamId || "Not set"}</Muted>
                        {banner.description && <Muted>{banner.description}</Muted>}
                        <Muted>{banner.active === false || banner.active === 0 || banner.active === "false" || banner.active === "0" ? "Disabled" : "Active"}</Muted>
                        <Muted>{banner.file_name || banner.filename || banner.path || "Uploaded banner"}</Muted>
                      </>
                    )}
                  </CardBody>
                  <Actions>
                    {isEditing ? (
                      <>
                        <Button type="button" onClick={() => handleUpdate(banner)} disabled={isSaving}>Save</Button>
                        <Button type="button" $variant="ghost" onClick={cancelEdit} disabled={isSaving}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" $variant="ghost" onClick={() => startEdit(banner)} disabled={isSaving}>Edit</Button>
                        <Button type="button" $variant="danger" onClick={() => handleDelete(banner)} disabled={isSaving}>Delete</Button>
                      </>
                    )}
                  </Actions>
                </BannerCard>
              );
            })
          )}
        </BannerGrid>
      </Container>
    </Page>
  );
};

export default TeamBannerManager;

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
  grid-template-columns: repeat(3, minmax(160px, 1fr)) auto;
  align-items: end;
  gap: 0.85rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);

  @media (max-width: 760px) {
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

const BannerGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.85rem;
`;

const BannerCard = styled.article`
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
`;

const Preview = styled.img`
  width: 100%;
  aspect-ratio: 16 / 7;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  object-fit: contain;
  background: #020617;
`;

const PreviewFallback = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 16 / 7;
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

const BannerName = styled.h2`
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
