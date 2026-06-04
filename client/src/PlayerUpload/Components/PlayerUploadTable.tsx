import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import styled from "styled-components";

type PlayerInfo = {
  uid: string;
  playerName: string;
  playerPic: any;
  playerPicUrl: string;
  cameraLink: string;
};

type TeamSection = {
  teamId: string;
  players: PlayerInfo[];
};

type PlayerUploadTableProps = {
  createPlayerUploads: (data: FormValues) => void;
  playerUploads?: Array<{
    id?: string | number;
    teamId: string;
    teamName?: string;
    playerPhotos?: string[];
    players?: Array<{
      uid?: string;
      playerName?: string;
      playerPic?: string;
      cameraLink?: string;
    }>;
  }>;
  loading?: boolean;
  error?: string | null;
  tournamentAssetOptions?: Array<{ name: string; url: string }>;
};

type FormValues = {
  sections: TeamSection[];
};

type SavedPlayer = {
  uid?: string;
  playerName?: string;
  playerPic?: string;
  cameraLink?: string;
};

type TeamDivision = {
  id?: string | number;
  teamId: string;
  teamName?: string;
  players: SavedPlayer[];
};

const emptyPlayer = (): PlayerInfo => ({
  uid: "",
  playerName: "",
  playerPic: null,
  playerPicUrl: "",
  cameraLink: "",
});

const groupUploadsByTeam = (
  uploads: NonNullable<PlayerUploadTableProps["playerUploads"]>,
): TeamDivision[] => {
  const grouped = new Map<string, TeamDivision>();

  uploads.forEach((upload) => {
    const key = upload.teamId || String(upload.id || "unknown");
    const current = grouped.get(key);
    const photoPlayers = (upload.playerPhotos || []).map((photoUrl, index) => ({
      playerName: `Player ${index + 1}`,
      playerPic: photoUrl,
    }));
    const nextPlayers = upload.players?.length ? upload.players : photoPlayers;

    if (current) {
      current.teamName = current.teamName || upload.teamName;
      current.players = [...current.players, ...nextPlayers];
      return;
    }

    grouped.set(key, {
      id: upload.id,
      teamId: upload.teamId,
      teamName: upload.teamName,
      players: nextPlayers,
    });
  });

  return Array.from(grouped.values()).sort((left, right) =>
    String(left.teamId || "").localeCompare(String(right.teamId || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
};

const getFirstFile = (fileField: any): File | null => {
  if (!fileField) return null;
  if (fileField instanceof File) return fileField;
  if (fileField instanceof FileList && fileField[0]) return fileField[0];
  if (Array.isArray(fileField) && fileField[0] instanceof File) return fileField[0];
  if (typeof fileField === "object" && fileField[0] instanceof File) return fileField[0];
  return null;
};

type TeamPlayersProps = {
  control: any;
  register: any;
  sectionIndex: number;
  errors: any;
  previewUrls: Record<string, string>;
  tournamentAssetOptions: Array<{ name: string; url: string }>;
};

const TeamPlayers = ({
  control,
  register,
  sectionIndex,
  errors,
  previewUrls,
  tournamentAssetOptions,
}: TeamPlayersProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.players` as any,
  });

  return (
    <PlayersPanel>
      <PlayersHeader>
        <span>Players</span>
        <SmallButton type="button" onClick={() => append(emptyPlayer())}>
          Add Player
        </SmallButton>
      </PlayersHeader>

      <PlayerRows>
        {fields.map((field, playerIndex) => {
          const playerErrors = errors.sections?.[sectionIndex]?.players?.[playerIndex];
          const previewKey = `${sectionIndex}-${playerIndex}`;

          return (
            <PlayerRow key={field.id}>
              <PlayerNumber>{playerIndex + 1}</PlayerNumber>
              <InputStack>
                <InputField
                  type="text"
                  placeholder="Player UID"
                  $hasError={!!playerErrors?.uid}
                  {...register(`sections.${sectionIndex}.players.${playerIndex}.uid`, {
                    required: "UID is required",
                  })}
                />
                {playerErrors?.uid && <ErrorText>{playerErrors.uid.message}</ErrorText>}
              </InputStack>
              <InputStack>
                <InputField
                  type="text"
                  placeholder="Player name"
                  $hasError={!!playerErrors?.playerName}
                  {...register(
                    `sections.${sectionIndex}.players.${playerIndex}.playerName`,
                    { required: "Player name is required" },
                  )}
                />
                {playerErrors?.playerName && (
                  <ErrorText>{playerErrors.playerName.message}</ErrorText>
                )}
              </InputStack>
              <InputStack>
                <AssetSelect
                  {...register(`sections.${sectionIndex}.players.${playerIndex}.playerPicUrl`)}
                >
                  <option value="">Choose existing tournament asset</option>
                  {tournamentAssetOptions.map((asset) => (
                    <option key={asset.url} value={asset.url}>
                      {asset.name}
                    </option>
                  ))}
                </AssetSelect>
                <FileField
                  type="file"
                  accept="image/*"
                  {...register(`sections.${sectionIndex}.players.${playerIndex}.playerPic`)}
                />
                {previewUrls[previewKey] && (
                  <InlinePreview>
                    <img src={previewUrls[previewKey]} alt={`Player ${playerIndex + 1}`} />
                  </InlinePreview>
                )}
              </InputStack>
              <InputStack>
                <InputField
                  type="url"
                  placeholder="Camera link"
                  $hasError={false}
                  {...register(
                    `sections.${sectionIndex}.players.${playerIndex}.cameraLink`,
                  )}
                />
              </InputStack>
              <SmallButton
                type="button"
                disabled={fields.length === 1}
                onClick={() => remove(playerIndex)}
              >
                Delete
              </SmallButton>
            </PlayerRow>
          );
        })}
      </PlayerRows>
    </PlayersPanel>
  );
};

const PlayerUploadTable = ({
  createPlayerUploads,
  playerUploads = [],
  loading,
  error,
  tournamentAssetOptions = [],
}: PlayerUploadTableProps) => {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [expandedSavedTeams, setExpandedSavedTeams] = useState<Record<string, boolean>>({});

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      sections: [{ teamId: "", players: [emptyPlayer()] }],
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
      section?.players?.forEach((player, playerIndex) => {
        const file = getFirstFile(player?.playerPic);
        if (file) {
          nextUrls[`${sectionIndex}-${playerIndex}`] = URL.createObjectURL(file);
        } else if (player?.playerPicUrl) {
          nextUrls[`${sectionIndex}-${playerIndex}`] = player.playerPicUrl;
        }
      });
    });

    setPreviewUrls((previousUrls) => {
      Object.values(previousUrls).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
      return nextUrls;
    });

    return () => {
      Object.values(nextUrls).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [watchedSections]);

  const teamDivisions = useMemo(
    () => groupUploadsByTeam(playerUploads),
    [playerUploads],
  );

  const onSubmit = (data: FormValues) => {
    createPlayerUploads(data);
  };

  const toggleSavedTeam = (teamKey: string) => {
    setExpandedSavedTeams((current) => ({
      ...current,
      [teamKey]: !current[teamKey],
    }));
  };

  return (
    <PageWrapper>
      <Container>
        <HeaderPanel>
          <TitleBlock>
            <h2>
              Player Upload <span>Manager</span>
            </h2>
            <p>Add any number of teams, then add any number of players per team.</p>
          </TitleBlock>
        </HeaderPanel>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <th style={{ width: "4rem", textAlign: "center" }}>No.</th>
                  <th style={{ width: "12rem" }}>Team ID *</th>
                  <th>Player Info</th>
                  <th style={{ width: "6rem", textAlign: "center" }}>Actions</th>
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
                        <TeamPlayers
                          control={control}
                          register={register}
                          sectionIndex={sectionIndex}
                          errors={errors}
                          previewUrls={previewUrls}
                          tournamentAssetOptions={tournamentAssetOptions}
                        />
                      </TableCell>

                      <TableCell style={{ verticalAlign: "middle" }}>
                        <ActionWrapper>
                          <ActionButton
                            type="button"
                            disabled={fields.length === 1}
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
            <AddTeamButton
              type="button"
              onClick={() => append({ teamId: "", players: [emptyPlayer()] })}
            >
              Add Team
            </AddTeamButton>

            <SaveButton type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </SaveButton>
          </FooterPanel>
        </form>

        <ExistingPanel>
          <SectionHeader>
            <div>
              <SectionTitle>Saved Team Players</SectionTitle>
              <SectionNote>Loaded from the player upload API.</SectionNote>
            </div>
          </SectionHeader>
          {loading && playerUploads.length === 0 ? (
            <EmptyState>Loading player uploads...</EmptyState>
          ) : teamDivisions.length === 0 ? (
            <EmptyState>No player upload data found from API.</EmptyState>
          ) : (
            <SavedGrid>
              {teamDivisions.map((team) => {
                const teamKey = `${team.teamId}-${team.id}`;
                const isExpanded = !!expandedSavedTeams[teamKey];

                return (
                <SavedCard key={teamKey}>
                  <SavedCardHeader>
                    <div>
                      <TeamTitle>{team.teamName || `Team ${team.teamId || "-"}`}</TeamTitle>
                      <SavedCardSummary>
                        {team.players.length} {team.players.length === 1 ? "player" : "players"} uploaded
                      </SavedCardSummary>
                    </div>
                    <SavedCardActions>
                      <TeamBadge>ID: {team.teamId || "-"}</TeamBadge>
                      <CollapseButton
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleSavedTeam(teamKey)}
                      >
                        {isExpanded ? "Hide Data" : "Show Data"}
                      </CollapseButton>
                    </SavedCardActions>
                  </SavedCardHeader>
                  {isExpanded && (team.players.length ? (
                    <SavedPlayerGrid>
                      {team.players.map((player, playerIndex) => (
                        <PlayerTile key={`${team.teamId}-${player.uid || playerIndex}`}>
                          <PlayerNumberLabel>Player {playerIndex + 1}</PlayerNumberLabel>
                          <SavedPhoto>
                            {player.playerPic ? (
                              <img
                                src={player.playerPic}
                                alt={player.playerName || `Player ${playerIndex + 1}`}
                              />
                            ) : (
                              <PhotoFallback>No Pic</PhotoFallback>
                            )}
                          </SavedPhoto>
                          <SavedPlayerName>{player.playerName || "Unnamed Player"}</SavedPlayerName>
                          <SavedMeta>UID: {player.uid || "-"}</SavedMeta>
                          {player.cameraLink ? (
                            <PlayerLink
                              href={player.cameraLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Camera Link
                            </PlayerLink>
                          ) : (
                            <SavedMeta>No camera link</SavedMeta>
                          )}
                        </PlayerTile>
                      ))}
                    </SavedPlayerGrid>
                  ) : (
                    <NoPhotoText>No players saved</NoPhotoText>
                  ))}
                </SavedCard>
                );
              })}
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
  padding: 2rem 1.25rem;
  background-color: var(--project-background, #0d0f12);
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--project-text-primary, #ffffff);
`;

const Container = styled.div`
  width: min(100%, 95rem);
  margin: 0 auto;
  background-color: var(--project-surface, #14171c);
  border-radius: 0.5rem;
  border: 1px solid var(--project-border, #1f242d);
  border-left: 4px solid var(--project-primary, #ef4444);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  padding: 2rem;
`;

const HeaderPanel = styled.div`
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px dashed var(--project-border, #2a313d);
`;

const TitleBlock = styled.div`
  h2 {
    font-size: 1.6rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--project-text-primary, #ffffff);
    margin: 0;

    span {
      color: var(--project-primary, #ef4444);
    }
  }

  p {
    font-size: 0.8rem;
    color: var(--project-text-secondary, #8c9ba5);
    margin: 0.4rem 0 0 0;
  }
`;

const TableContainer = styled.div`
  overflow: auto;
  border-radius: 0.35rem;
  border: 1px solid var(--project-border, #2a313d);
  background-color: var(--project-surface-alt, #090b0e);
  max-height: 640px;
`;

const Table = styled.table`
  width: 100%;
  min-width: 1020px;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8rem;
`;

const TableHead = styled.thead`
  background-color: var(--project-surface-alt, #0d1015);
  position: sticky;
  top: 0;
  z-index: 10;

  th {
    padding: 1rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--project-text-secondary, #8c9ba5);
    border-bottom: 2px solid var(--project-border, #2a313d);
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid var(--project-border, #1a2029);

  &:hover {
    background-color: rgba(var(--project-primary-rgb, 14, 17, 22), 0.08);
  }
`;

const SerialColumn = styled.td`
  padding: 1rem;
  text-align: center;
  font-weight: 900;
  color: var(--project-text-primary, #ffffff);
  background-color: var(--project-surface-alt, #0d1015);
  border-right: 1px solid var(--project-border, #1a2029);
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: top;
`;

const InputStack = styled.div`
  min-width: 0;
`;

const InputField = styled.input<{ $hasError: boolean }>`
  width: 100%;
  box-sizing: border-box;
  border-radius: 0.25rem;
  background-color: var(--project-surface, #14171c);
  border: 1px solid ${(props) => (props.$hasError ? "var(--project-danger, #ef4444)" : "var(--project-border, #2a313d)")};
  padding: 0.65rem 0.8rem;
  font-size: 0.8rem;
  color: var(--project-text-primary, #ffffff);

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "var(--project-danger, #ef4444)" : "var(--project-accent, #ffffff)")};
  }
`;

const FileField = styled.input`
  width: 100%;
  font-size: 0.72rem;
  color: var(--project-text-secondary, #8c9ba5);

  &::file-selector-button {
    margin-right: 0.5rem;
    padding: 0.45rem 0.7rem;
    border-radius: 0.25rem;
    border: 1px solid var(--project-border, #2a313d);
    font-size: 0.68rem;
    font-weight: 800;
    cursor: pointer;
    background-color: var(--project-surface, #14171c);
    color: var(--project-text-primary, #ffffff);
  }
`;

const AssetSelect = styled.select`
  width: 100%;
  min-height: 2.25rem;
  margin-bottom: 0.45rem;
  box-sizing: border-box;
  border-radius: 0.25rem;
  border: 1px solid var(--project-border, #2a313d);
  padding: 0 0.55rem;
  background-color: var(--project-surface, #14171c);
  color: var(--project-text-primary, #ffffff);
  font-size: 0.72rem;
`;

const PlayersPanel = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const PlayersHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--project-text-secondary, #8c9ba5);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const PlayerRows = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const PlayerRow = styled.div`
  display: grid;
  grid-template-columns: 2rem minmax(8rem, 1fr) minmax(10rem, 1.1fr) minmax(12rem, 1.2fr) minmax(12rem, 1.2fr) 4.75rem;
  align-items: start;
  gap: 0.65rem;
  padding: 0.75rem;
  border: 1px solid var(--project-border, #1f242d);
  border-radius: 0.35rem;
  background-color: var(--project-surface-alt, #0d1015);
`;

const PlayerNumber = styled.div`
  height: 2.25rem;
  display: grid;
  place-items: center;
  color: var(--project-text-secondary, #8c9ba5);
  font-weight: 900;
`;

const InlinePreview = styled.div`
  width: 3rem;
  height: 3rem;
  margin-top: 0.45rem;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid var(--project-border, #2a313d);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ErrorText = styled.p`
  color: var(--project-danger, #ef4444);
  font-size: 11px;
  margin: 0.35rem 0 0 0;
  font-weight: 700;
`;

const SubmitError = styled.div`
  margin-top: 1rem;
  color: var(--project-danger, #fecaca);
  background-color: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.3);
  border-radius: 0.25rem;
  padding: 0.75rem 1rem;
`;

const ActionWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ActionButton = styled.button`
  border-radius: 0.25rem;
  border: 1px solid var(--project-border, #2a313d);
  background-color: var(--project-surface, #14171c);
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;
  padding: 0.5rem 0.75rem;

  &:disabled {
    color: #4f5d6c;
    cursor: not-allowed;
  }
`;

const SmallButton = styled(ActionButton)`
  padding: 0.5rem 0.6rem;
  font-size: 0.72rem;
  white-space: nowrap;
`;

const FooterPanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const AddTeamButton = styled.button`
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 0.25rem;
  border: 1px solid var(--project-border, #2a313d);
  background-color: var(--project-surface, #14171c);
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;
`;

const SaveButton = styled.button`
  padding: 0.75rem 2.25rem;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--project-text-primary, #ffffff);
  background-color: var(--project-primary, #ef4444);
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
  letter-spacing: 0.04em;
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

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
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
  color: var(--project-text-primary, #ffffff);
  background-color: #14171c;
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 800;
`;

const SavedCardSummary = styled.div`
  margin-top: 0.3rem;
  color: #8c9ba5;
  font-size: 0.75rem;
`;

const SavedCardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const CollapseButton = styled(ActionButton)`
  white-space: nowrap;
`;

const SavedPlayerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
`;

const PlayerTile = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const PlayerNumberLabel = styled.div`
  color: #8c9ba5;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
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

const PhotoFallback = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #627282;
  font-size: 0.75rem;
  font-weight: 900;
`;

const SavedPlayerName = styled.div`
  font-size: 0.86rem;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SavedMeta = styled.div`
  color: #8c9ba5;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

const NoPhotoText = styled.div`
  color: #8c9ba5;
  font-size: 0.8rem;
  margin-top: 1rem;
`;

const EmptyState = styled.div`
  color: #8c9ba5;
  padding: 1rem;
  border: 1px dashed #2a313d;
  border-radius: 0.35rem;
  text-align: center;
`;
