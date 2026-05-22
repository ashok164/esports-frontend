import React, { useMemo } from "react";
import styled from "styled-components";

export interface Team {
  id?: number | string;
  _id?: number | string;
  team_id: string;
  team_name: string | null;
  short_tag: string | null;
  team_logo: string | null;
  country_logo: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TeamLogoDesignProps {
  teams?: Team[];
  selectedTeamId?: string | null;
}

const getRecordId = (team: Team) => String(team.id || team._id || "");

const compareTeamId = (left: Team, right: Team) => {
  const leftNumber = Number(left.team_id);
  const rightNumber = Number(right.team_id);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return String(left.team_id || "").localeCompare(String(right.team_id || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

export default function TeamLogoDesign({
  teams = [],
  selectedTeamId,
}: TeamLogoDesignProps) {
  const visibleTeams = useMemo(() => {
    return [...teams].sort(compareTeamId);
  }, [teams]);

  return (
    <Page>
      <Header>
        <div>
          <h2>Team Logo Gallery</h2>
          <p>Review team crests and country marks after every create or update.</p>
        </div>
        <Counter>{visibleTeams.length} Teams</Counter>
      </Header>

      {visibleTeams.length === 0 ? (
        <EmptyState>No logo records found.</EmptyState>
      ) : (
        <Grid>
          {visibleTeams.map((team) => {
            const isSelected = selectedTeamId && getRecordId(team) === selectedTeamId;

            return (
              <Card key={team.id || team._id || team.team_id} $selected={Boolean(isSelected)}>
                <LogoStage>
                  {team.team_logo ? (
                    <TeamLogo
                      src={team.team_logo}
                      alt={`${team.team_name || "Team"} logo`}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <LogoFallback>{team.short_tag || "TEAM"}</LogoFallback>
                  )}

                  <IdBadge>ID {team.team_id}</IdBadge>
                  {team.country_logo && (
                    <CountryLogo src={team.country_logo} alt={`${team.team_name || "Team"} country`} />
                  )}
                </LogoStage>

                <InfoPanel>
                  <div>
                    <TeamName title={team.team_name || ""}>
                      {team.team_name || "Unknown Team"}
                    </TeamName>
                    <TeamTag>{team.short_tag || "No tag"}</TeamTag>
                  </div>

                  <Links>
                    {team.team_logo ? (
                      <a href={team.team_logo} target="_blank" rel="noopener noreferrer">
                        Team logo
                      </a>
                    ) : (
                      <span>No team logo</span>
                    )}
                    {team.country_logo ? (
                      <a href={team.country_logo} target="_blank" rel="noopener noreferrer">
                        Country logo
                      </a>
                    ) : (
                      <span>No country logo</span>
                    )}
                  </Links>
                </InfoPanel>
              </Card>
            );
          })}
        </Grid>
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  padding: 2rem 1.25rem;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(8, 13, 21, 0.96), rgba(15, 23, 42, 0.98)),
    linear-gradient(90deg, rgba(239, 68, 68, 0.08), rgba(20, 184, 166, 0.05));
  color: #f8fafc;
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Header = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;

  h2 {
    margin: 0;
    font-size: clamp(1.55rem, 3vw, 2.45rem);
    letter-spacing: 0;
    line-height: 1.05;
  }

  p {
    margin: 0.55rem 0 0;
    color: #94a3b8;
    font-size: 0.92rem;
  }

  @media (max-width: 680px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Counter = styled.div`
  border: 1px solid #334155;
  border-radius: 0.45rem;
  padding: 0.55rem 0.8rem;
  background: rgba(15, 23, 42, 0.82);
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Grid = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
`;

const Card = styled.article<{ $selected?: boolean }>`
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid ${({ $selected }) => ($selected ? "#fca5a5" : "#243244")};
  background: rgba(15, 23, 42, 0.9);
  box-shadow: ${({ $selected }) =>
    $selected ? "0 0 0 3px rgba(239, 68, 68, 0.18)" : "0 16px 35px rgba(0, 0, 0, 0.24)"};
`;

const LogoStage = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  background:
    linear-gradient(145deg, rgba(30, 41, 59, 0.62), rgba(2, 6, 23, 0.95)),
    radial-gradient(circle at 50% 38%, rgba(239, 68, 68, 0.14), transparent 42%);
`;

const TeamLogo = styled.img`
  width: 76%;
  height: 76%;
  object-fit: contain;
  filter: drop-shadow(0 18px 25px rgba(0, 0, 0, 0.36));
`;

const LogoFallback = styled.div`
  width: 72%;
  height: 72%;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  color: #cbd5e1;
  font-size: 1.8rem;
  font-weight: 900;
  background: rgba(15, 23, 42, 0.78);
`;

const IdBadge = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  border-radius: 0.35rem;
  padding: 0.28rem 0.5rem;
  background: rgba(2, 6, 23, 0.78);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 800;
`;

const CountryLogo = styled.img`
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid rgba(248, 250, 252, 0.88);
  background: #020617;
`;

const InfoPanel = styled.div`
  min-height: 112px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.8rem;
`;

const TeamName = styled.h3`
  margin: 0;
  font-size: 1rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TeamTag = styled.div`
  margin-top: 0.25rem;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Links = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  font-size: 0.78rem;

  a {
    color: #93c5fd;
    text-decoration: none;
    font-weight: 700;
  }

  span {
    color: #64748b;
  }
`;

const EmptyState = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto;
  min-height: 280px;
  display: grid;
  place-items: center;
  border: 1px solid #243244;
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.82);
  color: #94a3b8;
  font-weight: 800;
`;
