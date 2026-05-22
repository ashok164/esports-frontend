import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import styled from "styled-components";

type PlayerUploadTableProps = {
  createPlayerUploads: (data: any) => void;
  playerUploads?: Array<{
    id?: string | number;
    teamId: string;
    teamName?: string;
    playerPhotos?: string[];
  }>;
  loading?: boolean;
  error?: string | null;
};

type FormValues = {
  sections: Array<{
    teamId: string;
    playerPhotos: any;
  }>;
};

type TeamDivision = {
  id?: string | number;
  teamId: string;
  teamName?: string;
  playerPhotos: string[];
};

const groupUploadsByTeam = (
  uploads: NonNullable<PlayerUploadTableProps["playerUploads"]>,
): TeamDivision[] => {
  const grouped = new Map<string, TeamDivision>();

  uploads.forEach((upload) => {
    const key = upload.teamId || String(upload.id || "unknown");
    const current = grouped.get(key);
    const nextPhotos = upload.playerPhotos || [];

    if (current) {
      current.teamName = current.teamName || upload.teamName;
      current.playerPhotos = Array.from(
        new Set([...current.playerPhotos, ...nextPhotos]),
      );
      return;
    }

    grouped.set(key, {
      id: upload.id,
      teamId: upload.teamId,
      teamName: upload.teamName,
      playerPhotos: nextPhotos,
    });
  });

  return Array.from(grouped.values());
};

const PlayerUploadTable = ({
  createPlayerUploads,
  playerUploads = [],
  loading,
  error,
}: PlayerUploadTableProps) => {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      sections: [{ teamId: "", playerPhotos: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections",
  });

  const watchedSections = useWatch({ control, name: "sections" });

  useEffect(() => {
    const nextUrls: Record<string, string> = {};

    watchedSections?.forEach((section, sectionIndex) => {
      Array.from(section?.playerPhotos || []).forEach((file, photoIndex) => {
        if (file instanceof File) {
          nextUrls[`${sectionIndex}-${photoIndex}`] = URL.createObjectURL(file);
        }
      });
    });

    setPreviewUrls((previousUrls) => {
      Object.values(previousUrls).forEach((url) => URL.revokeObjectURL(url));
      return nextUrls;
    });

    return () => {
      Object.values(nextUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [watchedSections]);

  const canRemove = useMemo(() => fields.length > 1, [fields.length]);
  const teamDivisions = useMemo(
    () => groupUploadsByTeam(playerUploads),
    [playerUploads],
  );

  const onSubmit = (data: FormValues) => {
    createPlayerUploads(data);
  };

  return (
    <PageWrapper>
      <Container>
        <HeaderPanel>
          <TitleBlock>
            <h2>
              Player Upload <span>Manager</span>
            </h2>
            <p>Save team id with any number of player photos.</p>
          </TitleBlock>
        </HeaderPanel>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <th style={{ width: "4rem", textAlign: "center" }}>ID</th>
                  <th style={{ width: "14rem" }}>Team Id *</th>
                  <th>Player Photos</th>
                  <th style={{ width: "5.5rem", textAlign: "center" }}>
                    Actions
                  </th>
                </tr>
              </TableHead>

              <tbody>
                {fields.map((field, sectionIndex) => {
                  const sectionErrors = errors.sections?.[sectionIndex];

                  return (
                    <TableRow key={field.id}>
                      <SerialColumn>
                        {String(sectionIndex + 1).padStart(2, "0")}
                      </SerialColumn>
                      <TableCell>
                        <InputField
                          type="text"
                          placeholder="Team ID"
                          $hasError={!!sectionErrors?.teamId}
                          {...register(`sections.${sectionIndex}.teamId`, {
                            required: "Team id is required",
                          })}
                        />
                        {sectionErrors?.teamId && (
                          <ErrorText>{sectionErrors.teamId.message}</ErrorText>
                        )}
                      </TableCell>

                      <TableCell>
                        <PhotoUploadCell>
                          <PreviewGrid>
                            {Object.entries(previewUrls)
                              .filter(([key]) => key.startsWith(`${sectionIndex}-`))
                              .map(([key, url], photoIndex) => (
                                <PhotoPreview key={key}>
                                  <img
                                    src={url}
                                    alt={`Team ${sectionIndex + 1} player ${
                                      photoIndex + 1
                                    }`}
                                  />
                                </PhotoPreview>
                              ))}
                            {Object.keys(previewUrls).every(
                              (key) => !key.startsWith(`${sectionIndex}-`),
                            ) && (
                              <PhotoPreview>
                                <PreviewPlaceholder>+</PreviewPlaceholder>
                              </PhotoPreview>
                            )}
                          </PreviewGrid>
                          <FileInput
                            type="file"
                            accept="image/*"
                            multiple
                            {...register(`sections.${sectionIndex}.playerPhotos`)}
                          />
                        </PhotoUploadCell>
                      </TableCell>

                      <TableCell style={{ verticalAlign: "middle" }}>
                        <ActionWrapper>
                          <ActionButton
                            type="button"
                            title="Delete section"
                            disabled={!canRemove}
                            onClick={() => remove(sectionIndex)}
                          >
                            Delete
                          </ActionButton>
                        </ActionWrapper>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>

          {error && <SubmitError>{error}</SubmitError>}

          <FooterPanel>
            <AddRowButton
              type="button"
              onClick={() =>
                append({ teamId: "", playerPhotos: null })
              }
              title="Add section"
            >
              +
            </AddRowButton>

            <SaveButton type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </SaveButton>
          </FooterPanel>
        </form>

        <ExistingPanel>
          <SectionHeader>
            <div>
              <SectionTitle>Team Player Divisions</SectionTitle>
              <SectionNote>Each team id contains all saved player images.</SectionNote>
            </div>
          </SectionHeader>
          {loading && playerUploads.length === 0 ? (
            <EmptyState>Loading player uploads...</EmptyState>
          ) : teamDivisions.length === 0 ? (
            <EmptyState>No player upload data found from API.</EmptyState>
          ) : (
            <SavedGrid>
              {teamDivisions.map((team) => (
                <SavedCard key={`${team.teamId}-${team.id}`}>
                  <SavedCardHeader>
                    <TeamTitle>{team.teamName || `Team ${team.teamId || "-"}`}</TeamTitle>
                    <TeamBadge>ID: {team.teamId || "-"}</TeamBadge>
                  </SavedCardHeader>
                  {team.playerPhotos.length ? (
                    <SavedPhotoGrid>
                      {team.playerPhotos.map((photoUrl, photoIndex) => (
                        <PlayerTile key={`${photoUrl}-${photoIndex}`}>
                          <PlayerNumber>Player {photoIndex + 1}</PlayerNumber>
                          <SavedPhoto>
                            <img
                              src={photoUrl}
                              alt={`Team ${team.teamId} player ${photoIndex + 1}`}
                            />
                          </SavedPhoto>
                          <PlayerLinksRow>
                            <PlayerLink
                              href={photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Player Pic
                            </PlayerLink>
                          </PlayerLinksRow>
                        </PlayerTile>
                      ))}
                    </SavedPhotoGrid>
                  ) : (
                    <NoPhotoText>No player photos uploaded</NoPhotoText>
                  )}
                </SavedCard>
              ))}
            </SavedGrid>
          )}
        </ExistingPanel>
      </Container>
    </PageWrapper>
  );
};

export default PlayerUploadTable;

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  margin: 0;
  padding: 2.5rem 1.5rem;
  background-color: #0d0f12;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Container = styled.div`
  width: 100%;
  max-width: 95rem;
  background-color: #14171c;
  border-radius: 0.5rem;
  border: 1px solid #1f242d;
  border-left: 4px solid #ef4444;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  padding: 2rem;
  color: #ffffff;
`;

const HeaderPanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px dashed #2a313d;
`;

const TitleBlock = styled.div`
  h2 {
    font-size: 1.6rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #ffffff;
    margin: 0;

    span {
      color: #ef4444;
    }
  }

  p {
    font-size: 0.8rem;
    color: #8c9ba5;
    margin: 0.4rem 0 0 0;
  }
`;

const TableContainer = styled.div`
  overflow: auto;
  border-radius: 0.25rem;
  border: 1px solid #2a313d;
  background-color: #090b0e;
  max-height: 620px;
`;

const Table = styled.table`
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8rem;
`;

const TableHead = styled.thead`
  background-color: #0d1015;
  position: sticky;
  top: 0;
  z-index: 10;

  th {
    padding: 1rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #8c9ba5;
    border-bottom: 2px solid #2a313d;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #1a2029;

  &:hover {
    background-color: #0e1116;
  }
`;

const SerialColumn = styled.td`
  padding: 1rem;
  text-align: center;
  font-weight: 900;
  color: #ffffff;
  background-color: #0d1015;
  border-right: 1px solid #1a2029;
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: top;
`;

const InputField = styled.input<{ $hasError: boolean }>`
  width: 100%;
  box-sizing: border-box;
  border-radius: 0.25rem;
  background-color: #14171c;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#2a313d")};
  padding: 0.65rem 0.8rem;
  font-size: 0.8rem;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#ffffff")};
  }
`;

const PhotoUploadCell = styled.div`
  display: grid;
  gap: 0.65rem;
  min-width: 18rem;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4.25rem, 4.25rem));
  gap: 0.5rem;
`;

const PhotoPreview = styled.div`
  width: 4.25rem;
  height: 4.25rem;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid #2a313d;
  background-color: #0d1015;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const PreviewPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #627282;
  font-weight: 900;
`;

const FileInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  font-size: 0.72rem;
  color: #8c9ba5;

  &::file-selector-button {
    margin-right: 0.5rem;
    padding: 0.45rem 0.7rem;
    border-radius: 0.25rem;
    border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#2a313d")};
    font-size: 0.68rem;
    font-weight: 800;
    cursor: pointer;
    background-color: #14171c;
    color: ${(props) => (props.$hasError ? "#ef4444" : "#ffffff")};
  }
`;

const ErrorText = styled.p`
  color: #ef4444;
  font-size: 11px;
  margin: 0.35rem 0 0 0;
  font-weight: 700;
`;

const SubmitError = styled.div`
  margin-top: 1rem;
  color: #fecaca;
  background-color: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.25rem;
  padding: 0.75rem 1rem;
`;

const ActionWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ActionButton = styled.button`
  border-radius: 0.25rem;
  border: 1px solid #2a313d;
  background-color: #14171c;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem 0.75rem;

  &:disabled {
    color: #4f5d6c;
    cursor: not-allowed;
  }
`;

const FooterPanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
`;

const AddRowButton = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.2rem;
  line-height: 1;
  font-weight: 900;
  border-radius: 0.25rem;
  border: none;
  background-color: #ef4444;
  color: #ffffff;
  cursor: pointer;
`;

const SaveButton = styled.button`
  padding: 0.75rem 2.25rem;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #ffffff;
  background-color: #ef4444;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;

  &:disabled {
    background-color: #7f1d1d;
    cursor: wait;
  }
`;

const ExistingPanel = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed #2a313d;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SectionNote = styled.p`
  color: #8c9ba5;
  font-size: 0.8rem;
  margin: 0.35rem 0 0 0;
`;

const SavedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
`;

const SavedCard = styled.div`
  border-radius: 0.35rem;
  border: 1px solid #2a313d;
  background-color: #0d1015;
  padding: 1rem;
`;

const SavedCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TeamTitle = styled.div`
  font-weight: 900;
  font-size: 1.1rem;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TeamBadge = styled.div`
  flex: 0 0 auto;
  border: 1px solid #2a313d;
  border-radius: 0.25rem;
  color: #ffffff;
  background-color: #14171c;
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 800;
`;

const SavedPhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: 0.75rem;
`;

const PlayerTile = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const PlayerNumber = styled.div`
  color: #8c9ba5;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const PlayerLinksRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PlayerLink = styled.a`
  color: #58a6ff;
  font-size: 0.78rem;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

const SavedPhoto = styled.div`
  aspect-ratio: 1;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid #2a313d;
  background-color: #14171c;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const NoPhotoText = styled.div`
  color: #8c9ba5;
  font-size: 0.8rem;
`;

const EmptyState = styled.div`
  color: #8c9ba5;
  padding: 1rem;
  border: 1px dashed #2a313d;
  border-radius: 0.35rem;
  text-align: center;
`;
