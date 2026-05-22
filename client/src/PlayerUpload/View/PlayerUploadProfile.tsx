import React from "react";
import styled from "styled-components";
import usePlayerUploadController from "../Controller/usePlayerUploadController";

type TeamDivision = {
  id?: string | number;
  teamId: string;
  teamName?: string;
  playerPhotos: string[];
};

const groupUploadsByTeam = (uploads: any[]): TeamDivision[] => {
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

const PlayerUploadProfile = () => {
  const { playerUploads, loading } = usePlayerUploadController();
  const teamDivisions = groupUploadsByTeam(playerUploads);

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

        {loading && playerUploads.length === 0 ? (
          <EmptyState>Loading player upload data...</EmptyState>
        ) : teamDivisions.length === 0 ? (
          <EmptyState>No player upload data is available from API yet.</EmptyState>
        ) : (
          <Grid>
            {teamDivisions.map((team) => (
              <TeamCard key={`${team.teamId}-${team.id}`}>
                <TeamHeader>
                  <TeamName>{team.teamName || `Team ${team.teamId || "-"}`}</TeamName>
                  <TeamId>ID: {team.teamId || "-"}</TeamId>
                </TeamHeader>
                <TeamInfo>
                  {team.playerPhotos.length ? (
                    <PhotoGrid>
                      {team.playerPhotos.map((photoUrl, photoIndex) => (
                        <PlayerTile key={`${photoUrl}-${photoIndex}`}>
                          <PlayerLabel>Player {photoIndex + 1}</PlayerLabel>
                          <PlayerPhoto>
                            <img
                              src={photoUrl}
                              alt={`Team ${team.teamId} player ${photoIndex + 1}`}
                            />
                          </PlayerPhoto>
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
                    </PhotoGrid>
                  ) : (
                    <TeamId>No player photos uploaded</TeamId>
                  )}
                </TeamInfo>
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
  width: 100vw;
  box-sizing: border-box;
  margin: 0;
  padding: 2.5rem 1.5rem;
  background-color: #0d0f12;
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #ffffff;
`;

const Container = styled.div`
  width: 100%;
  max-width: 76rem;
  margin: 0 auto;
  background-color: #14171c;
  border-radius: 0.5rem;
  border: 1px solid #1f242d;
  border-left: 4px solid #ef4444;
  padding: 2rem;
`;

const HeaderPanel = styled.div`
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
`;

const TeamCard = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #2a313d;
  background-color: #0d1015;
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TeamInfo = styled.div`
  min-width: 0;
`;

const TeamName = styled.div`
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: uppercase;
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: 0.75rem;
`;

const PlayerTile = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const PlayerLabel = styled.div`
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

const PlayerPhoto = styled.div`
  aspect-ratio: 1;
  border-radius: 0.35rem;
  overflow: hidden;
  background-color: #14171c;
  border: 1px solid #2a313d;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const TeamId = styled.div`
  flex: 0 0 auto;
  border: 1px solid #2a313d;
  border-radius: 0.25rem;
  background-color: #14171c;
  padding: 0.4rem 0.6rem;
  color: #8c9ba5;
  font-size: 0.75rem;
  font-weight: 800;
`;

const EmptyState = styled.div`
  color: #8c9ba5;
  padding: 3rem 1rem;
  text-align: center;
  border: 1px dashed #2a313d;
  border-radius: 0.5rem;
`;
