import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  CountryLogo,
  createCountryLogoApi,
  deleteCountryLogoApi,
  getCountryLogosApi,
  updateCountryLogoApi,
} from "../Repository/remote";

const getFileName = (file: File | null) => file?.name || "";

const CountryLogoView: React.FC = () => {
  const [logos, setLogos] = useState<CountryLogo[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedLogos = useMemo(
    () => [...logos].sort((left, right) => left.name.localeCompare(right.name)),
    [logos],
  );

  const loadLogos = async () => {
    setIsLoading(true);
    setError("");
    try {
      setLogos(await getCountryLogosApi());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load country logos");
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
    const input = document.getElementById("country-logo-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !file) {
      setError("Country name and logo image are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("countryLogo", file);

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await createCountryLogoApi(formData);
      setMessage("Country logo uploaded successfully");
      resetCreateForm();
      await loadLogos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload country logo");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (logo: CountryLogo) => {
    setEditingId(logo.id);
    setEditingName(logo.name);
    setEditingFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingFile(null);
  };

  const handleUpdate = async (logo: CountryLogo) => {
    if (!editingName.trim()) {
      setError("Country name is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", editingName.trim());
    if (editingFile) {
      formData.append("countryLogo", editingFile);
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await updateCountryLogoApi(logo.id, formData);
      setMessage("Country logo updated successfully");
      cancelEdit();
      await loadLogos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update country logo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (logo: CountryLogo) => {
    if (!window.confirm(`Delete ${logo.name} country logo?`)) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await deleteCountryLogoApi(logo.id);
      const clearedTeams = Number(result?.clearedTeams || 0);
      setMessage(
        clearedTeams > 0
          ? `Country logo deleted. Cleared from ${clearedTeams} team${clearedTeams === 1 ? "" : "s"}.`
          : "Country logo deleted successfully",
      );
      await loadLogos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete country logo");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <Container>
        <Header>
          <TitleBlock>
            <h1>Country Logos</h1>
            <p>Upload reusable country logos once, then select them from team records.</p>
          </TitleBlock>
        </Header>

        {error && <Status $tone="error">{error}</Status>}
        {message && <Status>{message}</Status>}
        {isLoading && <Status>Loading country logos...</Status>}

        <UploadPanel onSubmit={handleCreate}>
          <Field>
            <Label htmlFor="country-logo-name">Country Name</Label>
            <Input
              id="country-logo-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nepal"
              disabled={isSaving}
            />
          </Field>
          <Field>
            <Label htmlFor="country-logo-file">Logo Image</Label>
            <FileInput
              id="country-logo-file"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              disabled={isSaving}
            />
            <Muted>{getFileName(file) || "PNG, JPG, WEBP, or SVG"}</Muted>
          </Field>
          <Button type="submit" disabled={isSaving}>
            Upload
          </Button>
        </UploadPanel>

        <LogoGrid>
          {sortedLogos.length === 0 && !isLoading ? (
            <EmptyState>No country logos uploaded yet.</EmptyState>
          ) : (
            sortedLogos.map((logo) => {
              const isEditing = editingId === logo.id;

              return (
                <LogoCard key={logo.id}>
                  <Preview src={logo.countryLogo} alt={`${logo.name} logo`} />
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
                        <LogoName>{logo.name}</LogoName>
                        <Muted>{logo.filename || logo.path || "Uploaded logo"}</Muted>
                      </>
                    )}
                  </CardBody>
                  <Actions>
                    {isEditing ? (
                      <>
                        <Button type="button" onClick={() => handleUpdate(logo)} disabled={isSaving}>
                          Save
                        </Button>
                        <Button type="button" $variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" $variant="ghost" onClick={() => startEdit(logo)} disabled={isSaving}>
                          Edit
                        </Button>
                        <Button type="button" $variant="danger" onClick={() => handleDelete(logo)} disabled={isSaving}>
                          Delete
                        </Button>
                      </>
                    )}
                  </Actions>
                </LogoCard>
              );
            })
          )}
        </LogoGrid>
      </Container>
    </Page>
  );
};

export default CountryLogoView;

const Page = styled.main`
  min-height: 100vh;
  padding: 2rem 1.25rem;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(var(--project-secondary-rgb, 20, 184, 166), 0.08), transparent 36%),
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

const LogoGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.85rem;
`;

const LogoCard = styled.article`
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.8rem;
  padding: 0.85rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
`;

const Preview = styled.img`
  width: 4.5rem;
  height: 4.5rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  object-fit: cover;
  background: #020617;
`;

const CardBody = styled.div`
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 0.4rem;
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

const Actions = styled.div`
  grid-column: 1 / -1;
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
