import React, { useState } from "react";
import styled from "styled-components";
import usePlayerUploadController from "../Controller/usePlayerUploadController";

type PlayerProfile = {
  uid?: string;
  playerName?: string;
  playerPic?: string;
  cameraLink?: string;
};

type TeamDivision = {
  id?: string | number;
  teamId: string;
  teamName?: string;
  players: PlayerProfile[];
};

type EditingPlayer = {
  key: string;
  originalUid: string;
  uid: string;
  playerName: string;
  cameraLink: string;
  playerPic: any;
};

const groupUploadsByTeam = (uploads: any[]): TeamDivision[] => {
  const grouped = new Map<string, TeamDivision>();

  uploads.forEach((upload) => {
    const key = upload.teamId || String(upload.id || "unknown");
    const current = grouped.get(key);
    const photoPlayers = (upload.playerPhotos || []).map((photoUrl: string, index: number) => ({
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

const PlayerUploadProfile = () => {
  const {
    deletePlayerByUid,
    deletePlayerUpload,
    error,
    loading,
    playerUploads,
    updatePlayerByUid,
  } = usePlayerUploadController();
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayer | null>(null);
  const teamDivisions = groupUploadsByTeam(playerUploads);

  const getPlayerKey = (
    teamId: string | number,
    player: PlayerProfile,
    playerIndex: number,
  ) => `${teamId}-${player.uid || playerIndex}`;

  const handleStartEditPlayer = (
    teamId: string | number,
    player: PlayerProfile,
    playerIndex: number,
  ) => {
    setEditingPlayer({
      key: getPlayerKey(teamId, player, playerIndex),
      originalUid: String(player.uid || ""),
      uid: String(player.uid || ""),
      playerName: player.playerName || "",
      cameraLink: player.cameraLink || "",
      playerPic: null,
    });
  };

  const handleSavePlayer = async () => {
    const playerUid = editingPlayer?.originalUid || editingPlayer?.uid;
    if (!editingPlayer || !playerUid) return;

    try {
      await updatePlayerByUid(playerUid, editingPlayer);
      setEditingPlayer(null);
    } catch {
      // Keep edit mode open so the user can retry without retyping.
    }
  };

  const handleDeletePlayer = async (playerUid?: string | number) => {
    if (!playerUid) return;
    await deletePlayerByUid(playerUid);
  };

  const handleDeleteTeam = async (team: TeamDivision) => {
    if (!team.teamId) return;
    await deletePlayerUpload(team.teamId);
  };

  return (
    <PageWrapper>
      <Container>
        <HeaderPanel>
          <TitleBlock>
            <h2>
              Team Profile <span>Preview</span>
            </h2>
            <p>Loaded from saved player upload API data.</p>
          </TitleBlock>
        </HeaderPanel>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {loading && playerUploads.length === 0 ? (
          <EmptyState>
            <Spinner />
            <span>Loading player upload data...</span>
          </EmptyState>
        ) : teamDivisions.length === 0 ? (
          <EmptyState>No player upload data is available from API yet.</EmptyState>
        ) : (
          <Grid>
            {teamDivisions.map((team) => (
              <TeamCard key={`${team.teamId}-${team.id}`}>
                <TeamHeaderRow>
                  <TeamMainInfo>
                    <TeamName>{team.teamName || "Unnamed Team"}</TeamName>
                    <TeamBadge>ID: {team.teamId || "-"}</TeamBadge>
                  </TeamMainInfo>
                  <HeaderActions>
                    <PlayerCount>{team.players.length} Players</PlayerCount>
                    <DeleteTeamButton
                      type="button"
                      title="Delete whole team players"
                      onClick={() => handleDeleteTeam(team)}
                    >
                      <DeleteIcon />
                      Team
                    </DeleteTeamButton>
                  </HeaderActions>
                </TeamHeaderRow>

                <TeamContent>
                  {team.players.length ? (
                    <PlayerListContainer>
                      <TableHeaderRow>
                        <div>Player Info</div>
                        <div>Unique ID</div>
                        <div>Assets & Diagnostics</div>
                        <div style={{ textAlign: "right" }}>Actions</div>
                      </TableHeaderRow>

                      {team.players.map((player, playerIndex) => {
                        const playerKey = getPlayerKey(team.teamId, player, playerIndex);
                        const isEditing = editingPlayer?.key === playerKey;

                        return (
                          <PlayerRow key={playerKey}>
                            <PlayerProfileCell>
                              <AvatarCircle>
                                {player.playerPic ? (
                                  <img
                                    src={player.playerPic}
                                    alt={player.playerName || "Player"}
                                  />
                                ) : (
                                  <span>P{playerIndex + 1}</span>
                                )}
                              </AvatarCircle>
                              <PlayerTextInfo>
                                {isEditing && editingPlayer ? (
                                  <>
                                    <InlineInput
                                      value={editingPlayer.playerName}
                                      placeholder="Player name"
                                      onChange={(event) =>
                                        setEditingPlayer({
                                          ...editingPlayer,
                                          playerName: event.target.value,
                                        })
                                      }
                                    />
                                    <InlineFile
                                      type="file"
                                      accept="image/*"
                                      onChange={(event) =>
                                        setEditingPlayer({
                                          ...editingPlayer,
                                          playerPic: event.target.files,
                                        })
                                      }
                                    />
                                  </>
                                ) : (
                                  <>
                                    <PlayerNameText>
                                      {player.playerName || "Unnamed Player"}
                                    </PlayerNameText>
                                    <PlayerIndexLabel>Slot {playerIndex + 1}</PlayerIndexLabel>
                                  </>
                                )}
                              </PlayerTextInfo>
                            </PlayerProfileCell>

                            <PlayerUidCell>
                              {isEditing && editingPlayer ? (
                                <InlineInput
                                  value={editingPlayer.uid}
                                  placeholder="Player UID"
                                  onChange={(event) =>
                                    setEditingPlayer({
                                      ...editingPlayer,
                                      uid: event.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <code>{player.uid || "-"}</code>
                              )}
                            </PlayerUidCell>

                            <PlayerLinksCell>
                              {isEditing && editingPlayer ? (
                                <InlineInput
                                  value={editingPlayer.cameraLink}
                                  placeholder="Camera link"
                                  onChange={(event) =>
                                    setEditingPlayer({
                                      ...editingPlayer,
                                      cameraLink: event.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <>
                                  {player.playerPic && (
                                    <AssetLink
                                      href={player.playerPic}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      View Photo
                                    </AssetLink>
                                  )}
                                  {player.cameraLink && (
                                    <AssetLink
                                      href={player.cameraLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="camera-link"
                                    >
                                      Live Stream
                                    </AssetLink>
                                  )}
                                  {!player.playerPic && !player.cameraLink && (
                                    <NoAssetsText>No external assets available</NoAssetsText>
                                  )}
                                </>
                              )}
                            </PlayerLinksCell>

                            <ActionCell>
                              {isEditing && editingPlayer ? (
                                <>
                                  <SaveIconButton
                                    type="button"
                                    title="Save Player"
                                    onClick={handleSavePlayer}
                                  >
                                    Save
                                  </SaveIconButton>
                                  <TextIconButton
                                    type="button"
                                    title="Cancel Edit"
                                    onClick={() => setEditingPlayer(null)}
                                  >
                                    Cancel
                                  </TextIconButton>
                                </>
                              ) : (
                                <>
                                  <IconButton
                                    type="button"
                                    title="Edit Player"
                                    onClick={() =>
                                      handleStartEditPlayer(team.teamId, player, playerIndex)
                                    }
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <DeleteButton
                                    type="button"
                                    title="Delete Player Profile"
                                    onClick={() => handleDeletePlayer(player.uid)}
                                  >
                                    <DeleteIcon />
                                  </DeleteButton>
                                </>
                              )}
                            </ActionCell>
                          </PlayerRow>
                        );
                      })}
                    </PlayerListContainer>
                  ) : (
                    <NoPlayersMessage>No roster players mapped to this profile division.</NoPlayersMessage>
                  )}
                </TeamContent>
              </TeamCard>
            ))}
          </Grid>
        )}
      </Container>
    </PageWrapper>
  );
};

export default PlayerUploadProfile;

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 3rem 2rem;
  background-color: var(--project-background, #0b0f19);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--project-text-primary, #f3f4f6);
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 76rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const HeaderPanel = styled.div`
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--project-border, #1f293d);
`;

const TitleBlock = styled.div`
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0;
    margin: 0;
    color: var(--project-text-primary, #ffffff);

    span {
      color: var(--project-secondary, #38bdf8);
      font-weight: 400;
    }
  }

  p {
    font-size: 0.85rem;
    color: var(--project-text-secondary, #9ca3af);
    margin: 0.35rem 0 0 0;
  }
`;

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ErrorBanner = styled.div`
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.35);
  border-radius: 0.5rem;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  color: var(--project-danger, #fecaca);
  padding: 0.85rem 1rem;
  font-size: 0.85rem;
`;

const TeamCard = styled.div`
  border-radius: 0.625rem;
  border: 1px solid var(--project-border, #1f293d);
  background-color: var(--project-surface, #111827);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
`;

const TeamHeaderRow = styled.div`
  background-color: var(--project-surface-alt, #1e293b);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #1f293d;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const TeamMainInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const TeamName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TeamBadge = styled.span`
  border: 1px solid #334155;
  border-radius: 0.25rem;
  background-color: #0f172a;
  padding: 0.25rem 0.5rem;
  color: #94a3b8;
  font-size: 0.75rem;
  font-family: monospace;
  white-space: nowrap;
`;

const PlayerCount = styled.span`
  font-size: 0.8rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  white-space: nowrap;
`;

const TeamContent = styled.div`
  background-color: #111827;
`;

const PlayerListContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const TableHeaderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(14rem, 2fr) minmax(10rem, 1.2fr) minmax(14rem, 1.6fr) 10rem;
  padding: 0.75rem 1.5rem;
  background-color: #151e2e;
  border-bottom: 1px solid #1f293d;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;

  @media (max-width: 768px) {
    display: none;
  }
`;

const PlayerRow = styled.div`
  display: grid;
  grid-template-columns: minmax(14rem, 2fr) minmax(10rem, 1.2fr) minmax(14rem, 1.6fr) 10rem;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #1f293d;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #161f30;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
  }
`;

const PlayerProfileCell = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
`;

const AvatarCircle = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  background-color: #1f293d;
  border: 1px solid #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af;
  }
`;

const PlayerTextInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

const PlayerNameText = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PlayerIndexLabel = styled.span`
  font-size: 0.72rem;
  color: #64748b;
`;

const PlayerUidCell = styled.div`
  min-width: 0;

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.8rem;
    color: #cbd5e1;
    background-color: #1f293d;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    overflow-wrap: anywhere;
  }
`;

const PlayerLinksCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const AssetLink = styled.a`
  font-size: 0.78rem;
  font-weight: 500;
  color: #38bdf8;
  text-decoration: none;
  border-bottom: 1px transparent solid;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: #7dd3fc;
    border-color: #7dd3fc;
  }

  &.camera-link {
    color: #a78bfa;

    &:hover {
      color: #c084fc;
      border-color: #c084fc;
    }
  }
`;

const NoAssetsText = styled.span`
  font-size: 0.75rem;
  color: #4b5563;
  font-style: italic;
`;

const ActionCell = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.45rem;

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const IconButton = styled.button`
  min-width: 2.15rem;
  height: 2.15rem;
  border: 1px solid #334155;
  border-radius: 0.35rem;
  background: #0f172a;
  color: #cbd5e1;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  padding: 0 0.55rem;

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
    border-color: #7dd3fc;
    color: #7dd3fc;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const TextIconButton = styled(IconButton)`
  width: auto;
  height: 2.15rem;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
`;

const SaveIconButton = styled(TextIconButton)`
  border-color: #15803d;
  color: #bbf7d0;

  &:hover:not(:disabled) {
    border-color: #22c55e;
    color: #dcfce7;
  }
`;

const DeleteButton = styled(IconButton)`
  &:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }
`;

const DeleteTeamButton = styled(DeleteButton)`
  width: auto;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
`;

const InlineInput = styled.input`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #334155;
  border-radius: 0.35rem;
  background: #0f172a;
  color: #f8fafc;
  padding: 0.5rem 0.6rem;
  font-size: 0.78rem;

  &:focus {
    outline: none;
    border-color: #7dd3fc;
  }
`;

const InlineFile = styled.input`
  width: 100%;
  color: #94a3b8;
  font-size: 0.72rem;
`;

const NoPlayersMessage = styled.div`
  color: #64748b;
  font-size: 0.85rem;
  text-align: center;
  padding: 2.5rem 1.5rem;
  font-style: italic;
`;

const EmptyState = styled.div`
  color: #9ca3af;
  padding: 5rem 2rem;
  text-align: center;
  border: 2px dashed #1f293d;
  border-radius: 0.625rem;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: #111827;
`;

const Spinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #374151;
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
