import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  TournamentLogo,
  createTournamentLogoApi,
  deleteTournamentLogoApi,
  getTournamentLogoName,
  getTournamentLogoUrl,
  getTournamentLogosApi,
  isTournamentLogoActive,
  updateTournamentLogoApi,
} from "../Repository/remote";

const getFileName = (file: File | null) => file?.name || "";

const getCreatedLogo = (response: any): TournamentLogo | null =>
  response?.data || response?.logo || response?.tournamentLogo || null;

const TournamentLogoView: React.FC = () => {
  const [logos, setLogos] = useState<TournamentLogo[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLogoListExpanded, setIsLogoListExpanded] = useState(false);

  const activeLogo = useMemo(() => logos.find((logo) => isTournamentLogoActive(logo)), [logos]);
  const sortedLogos = useMemo(
    () => [...logos].sort((left, right) => Number(isTournamentLogoActive(right)) - Number(isTournamentLogoActive(left))),
    [logos],
  );

  const loadLogos = async () => {
    setIsLoading(true);
    setError("");
    try {
      setLogos(await getTournamentLogosApi());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load tournament logos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogos();
  }, []);

  const resetCreateForm = () => {
    setName("");
    setFile(null);
    const input = document.getElementById("tournament-logo-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const setOnlyActive = async (id: string | number, nextActive: boolean) => {
    await updateTournamentLogoApi(id, { active: nextActive });

    if (nextActive) {
      await Promise.all(
        logos
          .filter((logo) => String(logo.id) !== String(id) && isTournamentLogoActive(logo))
          .map((logo) => updateTournamentLogoApi(logo.id, { active: false })),
      );
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Tournament logo image is required");
      return;
    }

    const formData = new FormData();
    if (name.trim()) formData.append("name", name.trim());
    formData.append("tournamentLogo", file);
    formData.append("active", "true");

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await createTournamentLogoApi(formData);
      const createdLogo = getCreatedLogo(response);
      if (createdLogo?.id) {
        await Promise.all(
          logos
            .filter((logo) => String(logo.id) !== String(createdLogo.id) && isTournamentLogoActive(logo))
            .map((logo) => updateTournamentLogoApi(logo.id, { active: false })),
        );
      }
      setMessage("Tournament logo uploaded and enabled");
      resetCreateForm();
      await loadLogos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload tournament logo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActiveChange = async (logo: TournamentLogo, nextActive: boolean) => {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await setOnlyActive(logo.id, nextActive);
      setMessage(nextActive ? `${getTournamentLogoName(logo)} is live now` : "Tournament logo disabled");
      await loadLogos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update tournament logo");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (logo: TournamentLogo) => {
    setEditingId(logo.id);
    setEditingName(getTournamentLogoName(logo));
    setEditingFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingFile(null);
  };

  const handleUpdate = async (logo: TournamentLogo) => {
    if (!editingName.trim()) {
      setError("Tournament name is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", editingName.trim());
    formData.append("active", String(isTournamentLogoActive(logo)));
    if (editingFile) {
      formData.append("tournamentLogo", editingFile);
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await updateTournamentLogoApi(logo.id, formData);
      setMessage("Tournament logo updated");
      cancelEdit();
      await loadLogos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update tournament logo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (logo: TournamentLogo) => {
    if (!window.confirm(`Delete ${getTournamentLogoName(logo)} tournament logo?`)) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteTournamentLogoApi(logo.id);
      setMessage("Tournament logo deleted");
      await loadLogos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete tournament logo");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <Container>
        <Header>
          <TitleBlock>
            <h1>Tournament Logos</h1>
            <p>Upload a tournament logo and choose the single active logo for live broadcast.</p>
          </TitleBlock>
          <LivePreview>
            <span>Active Logo</span>
            {activeLogo ? (
              <PreviewLogo src={getTournamentLogoUrl(activeLogo)} alt={getTournamentLogoName(activeLogo)} />
            ) : (
              <PreviewEmpty>No active logo</PreviewEmpty>
            )}
          </LivePreview>
        </Header>

        {error && <Status $tone="error">{error}</Status>}
        {message && <Status>{message}</Status>}
        {isLoading && <Status>Loading tournament logos...</Status>}

        <UploadPanel onSubmit={handleCreate}>
          <Field>
            <Label htmlFor="tournament-logo-name">Tournament Name</Label>
            <Input
              id="tournament-logo-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="League Stage"
              disabled={isSaving}
            />
          </Field>
          <Field>
            <Label htmlFor="tournament-logo-file">Logo Image</Label>
            <FileInput
              id="tournament-logo-file"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              disabled={isSaving}
            />
            <Muted>{getFileName(file) || "PNG, JPG, WEBP, or SVG"}</Muted>
          </Field>
          <Button type="submit" disabled={isSaving}>
            Upload & Enable
          </Button>
        </UploadPanel>

        <ListHeader>
          <div>
            <ListTitle>Uploaded Tournament Logos</ListTitle>
            <Muted>{sortedLogos.length} logos</Muted>
          </div>
          <IconButton type="button" $variant="ghost" aria-expanded={isLogoListExpanded} onClick={() => setIsLogoListExpanded((current) => !current)}>
            {isLogoListExpanded ? "Hide Logos" : "Show Logos"}
          </IconButton>
        </ListHeader>

        {isLogoListExpanded && <LogoGrid>
          {sortedLogos.length === 0 && !isLoading ? (
            <EmptyState>No tournament logos uploaded yet.</EmptyState>
          ) : (
            sortedLogos.map((logo) => {
              const logoUrl = getTournamentLogoUrl(logo);
              const isEditing = editingId === logo.id;

              return (
                <LogoCard key={logo.id} $active={isTournamentLogoActive(logo)}>
                  {logoUrl ? <LogoImage src={logoUrl} alt={getTournamentLogoName(logo)} /> : <LogoFallback>No Image</LogoFallback>}
                  <CardBody>
                    {isEditing ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          disabled={isSaving}
                        />
                        <FileInput
                          type="file"
                          accept="image/*"
                          onChange={(event) => setEditingFile(event.target.files?.[0] || null)}
                          disabled={isSaving}
                        />
                        <Muted>{getFileName(editingFile) || "Current image kept"}</Muted>
                      </>
                    ) : (
                      <>
                        <LogoName>{getTournamentLogoName(logo)}</LogoName>
                        <Muted>{logo.file_name || logo.filename || logo.path || "Uploaded tournament logo"}</Muted>
                        <SwitchRow>
                          <SwitchLabel>{isTournamentLogoActive(logo) ? "Live enabled" : "Disabled"}</SwitchLabel>
                          <Switch>
                            <input
                              type="checkbox"
                              checked={isTournamentLogoActive(logo)}
                              onChange={(event) => handleActiveChange(logo, event.target.checked)}
                              disabled={isSaving}
                            />
                            <span />
                          </Switch>
                        </SwitchRow>
                      </>
                    )}
                  </CardBody>
                  <Actions>
                    {isEditing ? (
                      <>
                        <IconButton type="button" title="Save" onClick={() => handleUpdate(logo)} disabled={isSaving}>
                          Save
                        </IconButton>
                        <IconButton type="button" title="Cancel" $variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                          Cancel
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton type="button" title="Edit" $variant="ghost" onClick={() => startEdit(logo)} disabled={isSaving}>
                          Edit
                        </IconButton>
                        <IconButton type="button" title="Delete" $variant="danger" onClick={() => handleDelete(logo)} disabled={isSaving}>
                          Delete
                        </IconButton>
                      </>
                    )}
                  </Actions>
                </LogoCard>
              );
            })
          )}
        </LogoGrid>}
      </Container>
    </Page>
  );
};

export default TournamentLogoView;

const Page = styled.main`
  min-height: 100vh;
  padding: 2rem 1.25rem;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.1), transparent 36%),
    var(--project-background, #090d14);
  color: var(--project-text-primary, #f8fafc);
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Container = styled.div`
  width: min(1120px, 100%);
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  h1 {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.5rem);
    letter-spacing: 0;
  }

  p {
    margin: 0.45rem 0 0;
    color: var(--project-text-secondary, #94a3b8);
  }
`;

const LivePreview = styled.aside`
  display: grid;
  justify-items: center;
  gap: 0.55rem;
  min-width: 180px;
  padding: 0.9rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
  }
`;

const PreviewLogo = styled.img`
  max-width: 136px;
  max-height: 82px;
  object-fit: contain;
`;

const PreviewEmpty = styled.div`
  display: grid;
  place-items: center;
  width: 136px;
  height: 82px;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 8px;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.8rem;
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
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.2fr) auto;
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

  &::file-selector-button {
    margin-right: 0.6rem;
    border: 1px solid var(--project-border, #334155);
    border-radius: 6px;
    padding: 0.48rem 0.58rem;
    background: var(--project-surface, #111827);
    color: var(--project-text-primary, #f8fafc);
    cursor: pointer;
    font-weight: 800;
  }
`;

const Button = styled.button`
  min-height: 2.4rem;
  border: 1px solid var(--project-primary, #ef4444);
  border-radius: 6px;
  padding: 0.52rem 0.85rem;
  background: var(--project-primary, #ef4444);
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

const LogoGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.85rem;
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
  padding: 0.85rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
`;

const ListTitle = styled.h2`
  margin: 0 0 0.25rem;
  font-size: 1rem;
`;

const LogoCard = styled.article<{ $active: boolean }>`
  display: grid;
  grid-template-columns: 5.25rem minmax(0, 1fr);
  gap: 0.85rem;
  padding: 0.9rem;
  border: 1px solid ${({ $active }) => ($active ? "var(--project-primary, #ef4444)" : "var(--project-border, #334155)")};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "rgba(239, 68, 68, 0.12)" : "rgba(15, 23, 42, 0.82)")};
`;

const LogoImage = styled.img`
  width: 5.25rem;
  height: 5.25rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  object-fit: contain;
  background: #020617;
`;

const LogoFallback = styled.div`
  display: grid;
  place-items: center;
  width: 5.25rem;
  height: 5.25rem;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 8px;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.7rem;
  font-weight: 800;
`;

const CardBody = styled.div`
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 0.45rem;
`;

const Actions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const IconButton = styled.button<{ $variant?: "danger" | "ghost" }>`
  min-height: 2.2rem;
  border: 1px solid ${({ $variant }) => ($variant === "danger" ? "#ef4444" : "var(--project-border, #334155)")};
  border-radius: 6px;
  padding: 0.42rem 0.7rem;
  background: ${({ $variant }) => ($variant === "danger" ? "#dc2626" : "rgba(15, 23, 42, 0.82)")};
  color: #ffffff;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const LogoName = styled.h2`
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

const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.2rem;
`;

const SwitchLabel = styled.span`
  color: var(--project-text-primary, #f8fafc);
  font-size: 0.8rem;
  font-weight: 800;
`;

const Switch = styled.label`
  position: relative;
  display: inline-flex;
  width: 48px;
  height: 26px;

  input {
    position: absolute;
    opacity: 0;
  }

  span {
    width: 100%;
    border-radius: 999px;
    background: #334155;
    cursor: pointer;
    transition: background 160ms ease;
  }

  span::before {
    content: "";
    position: absolute;
    top: 4px;
    left: 4px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #ffffff;
    transition: transform 160ms ease;
  }

  input:checked + span {
    background: var(--project-primary, #ef4444);
  }

  input:checked + span::before {
    transform: translateX(22px);
  }

  input:disabled + span {
    cursor: not-allowed;
    opacity: 0.55;
  }
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
