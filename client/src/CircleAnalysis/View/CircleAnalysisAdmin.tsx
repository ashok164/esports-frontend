import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useProjectTheme } from "../../Theme";
import {
  buildCircleAnalysisFromTeams,
  getCircleAnalysisApi,
  getCircleAnalysisTeamsApi,
  updateCircleAnalysisApi,
} from "../Repository/remote";
import { CircleAnalysisResponse, CircleAnalysisTeam } from "../types";

const DEFAULT_CIRCLES = [1, 2, 3, 4, 5, 6, 7, 8];

const CircleAnalysisAdmin: React.FC = () => {
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [analysis, setAnalysis] = useState<CircleAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const circles = analysis?.circles?.length ? analysis.circles : DEFAULT_CIRCLES;
  const teams = analysis?.teams || [];
  const totalKills = useMemo(
    () =>
      teams.reduce(
        (sum, team) =>
          sum + circles.reduce((circleSum, circle) => circleSum + (team.killsPerCircle[circle] || 0), 0),
        0,
      ),
    [circles, teams],
  );

  useEffect(() => {
    let isMounted = true;

    const loadAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [teamRows, savedResponse] = await Promise.all([
          getCircleAnalysisTeamsApi(),
          getCircleAnalysisApi(),
        ]);
        const mergedResponse = teamRows.length
          ? buildCircleAnalysisFromTeams(teamRows, savedResponse)
          : savedResponse;

        if (isMounted) setAnalysis(mergedResponse);
      } catch (err: any) {
        if (isMounted) setError(err?.message || "Failed to load circle analysis data");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateTeam = (teamId: string, nextTeam: (team: CircleAnalysisTeam) => CircleAnalysisTeam) => {
    setAnalysis((current) => {
      if (!current) return current;

      return {
        ...current,
        teams: current.teams.map((team) => (team.teamId === teamId ? nextTeam(team) : team)),
      };
    });
    setStatus(null);
  };

  const updateCircleKills = (teamId: string, circle: number, value: string) => {
    const kills = Math.max(0, Math.round(Number(value) || 0));
    updateTeam(teamId, (team) => ({
      ...team,
      killsPerCircle: {
        ...team.killsPerCircle,
        [circle]: kills,
      },
    }));
  };

  const saveAnalysis = async () => {
    if (!analysis) return;

    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await updateCircleAnalysisApi(analysis);
      setAnalysis(response);
      setStatus("Saved. Circle analysis broadcast has been updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to save circle analysis");
    } finally {
      setIsSaving(false);
    }
  };

  if (isThemeLoading) return null;

  return (
    <Page>
      <Shell>
        <Header>
          <TitleBlock>
            <Kicker>Broadcast Data</Kicker>
            <Title>Circle Analysis Control</Title>
            <Subtitle>
              Auto-loaded 12 team IDs, names, logos, and country flags from team records.
            </Subtitle>
          </TitleBlock>
          <SummaryPanel>
            <SummaryValue>{teams.length}</SummaryValue>
            <SummaryLabel>Teams</SummaryLabel>
            <SummaryValue>{totalKills}</SummaryValue>
            <SummaryLabel>Kills</SummaryLabel>
          </SummaryPanel>
        </Header>

        <Toolbar>
          <ToolbarText>
            {isLoading ? "Loading team data..." : `Updated ${analysis?.updatedAt ? new Date(analysis.updatedAt).toLocaleString() : "now"}`}
          </ToolbarText>
          <SaveButton type="button" onClick={saveAnalysis} disabled={isSaving || isLoading || !analysis}>
            {isSaving ? "Saving..." : "Save Response"}
          </SaveButton>
        </Toolbar>

        {error && <Alert $tone="danger">{error}</Alert>}
        {status && <Alert $tone="success">{status}</Alert>}

        {isLoading ? (
          <EmptyState>Loading circle analysis controls...</EmptyState>
        ) : teams.length === 0 ? (
          <EmptyState>No team records found. Add teams from Team Record first.</EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Placement</th>
                  <th>Status</th>
                  {circles.map((circle) => (
                    <th key={circle}>C{circle}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.teamId}>
                    <td>
                      <TeamCell>
                        <LogoBox>
                          {team.logoUrl ? <TeamLogo src={team.logoUrl} alt="" /> : <LogoFallback>{team.shortLabel}</LogoFallback>}
                          {team.countryLogoUrl && <Flag src={team.countryLogoUrl} alt="" />}
                        </LogoBox>
                        <TeamText>
                          <TeamName>{team.teamName}</TeamName>
                          <TeamMeta>ID {team.teamId} / {team.shortLabel}</TeamMeta>
                        </TeamText>
                      </TeamCell>
                    </td>
                    <td>
                      <Select
                        value={team.lastCircle}
                        onChange={(event) =>
                          updateTeam(team.teamId, (current) => ({
                            ...current,
                            lastCircle: Number(event.target.value),
                          }))
                        }
                      >
                        {circles.map((circle) => (
                          <option key={circle} value={circle}>
                            Circle {circle}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <CheckGroup>
                        <label>
                          <input
                            type="checkbox"
                            checked={team.isDead}
                            onChange={(event) =>
                              updateTeam(team.teamId, (current) => ({
                                ...current,
                                isDead: event.target.checked,
                              }))
                            }
                          />
                          Dead
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={team.hasBooyah}
                            onChange={(event) =>
                              updateTeam(team.teamId, (current) => ({
                                ...current,
                                hasBooyah: event.target.checked,
                                isDead: event.target.checked ? false : current.isDead,
                              }))
                            }
                          />
                          Booyah
                        </label>
                      </CheckGroup>
                    </td>
                    {circles.map((circle) => (
                      <td key={circle}>
                        <KillInput
                          type="number"
                          min="0"
                          value={team.killsPerCircle[circle] || 0}
                          onChange={(event) => updateCircleKills(team.teamId, circle, event.target.value)}
                          aria-label={`${team.teamName} circle ${circle} kills`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Shell>
    </Page>
  );
};

export default CircleAnalysisAdmin;

const Page = styled.main`
  min-height: 100vh;
  background:
    linear-gradient(180deg, var(--project-background, #08111f), var(--project-surface, #101722)),
    var(--project-background, #08111f);
  color: var(--project-text-primary, #f8fafc);
  font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
`;

const Shell = styled.div`
  width: min(1380px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 8px;
`;

const Kicker = styled.div`
  color: var(--project-accent, #5eead4);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.35rem);
  line-height: 1;
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--project-text-secondary, #a8b3c7);
  font-size: 0.95rem;
`;

const SummaryPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(88px, 1fr));
  gap: 4px 12px;
  min-width: 230px;
  padding: 16px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.48);
`;

const SummaryValue = styled.strong`
  font-size: 1.9rem;
  line-height: 1;
`;

const SummaryLabel = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
  background: var(--project-surface, rgba(15, 23, 42, 0.85));
`;

const ToolbarText = styled.div`
  color: var(--project-text-secondary, #cbd5e1);
  font-size: 0.86rem;
  font-weight: 700;
`;

const SaveButton = styled.button`
  min-height: 38px;
  border: 1px solid rgba(var(--project-secondary-rgb, 94, 234, 212), 0.45);
  border-radius: 8px;
  padding: 0 16px;
  background: var(--project-secondary, #22c55e);
  color: var(--project-text-inverse, #020617);
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const Alert = styled.div<{ $tone: "danger" | "success" }>`
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${({ $tone }) => ($tone === "danger" ? "rgba(248, 113, 113, 0.45)" : "rgba(52, 211, 153, 0.45)")};
  background: ${({ $tone }) => ($tone === "danger" ? "rgba(127, 29, 29, 0.42)" : "rgba(6, 78, 59, 0.42)")};
  color: var(--project-text-primary, #fff);
  font-weight: 800;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.52);
`;

const Table = styled.table`
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;

  th,
  td {
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    padding: 10px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--project-surface-alt, #111827);
    color: var(--project-text-secondary, #cbd5e1);
    font-size: 0.76rem;
    text-transform: uppercase;
  }

  tbody tr:hover {
    background: rgba(var(--project-secondary-rgb, 20, 184, 166), 0.08);
  }
`;

const TeamCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
`;

const LogoBox = styled.div`
  position: relative;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.78);
`;

const TeamLogo = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
`;

const LogoFallback = styled.div`
  font-size: 0.75rem;
  font-weight: 900;
  color: var(--project-text-secondary, #cbd5e1);
`;

const Flag = styled.img`
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid var(--project-text-primary, #fff);
  background: var(--project-background, #020617);
`;

const TeamText = styled.div`
  min-width: 0;
`;

const TeamName = styled.div`
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TeamMeta = styled.div`
  margin-top: 4px;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.78rem;
  font-weight: 700;
`;

const Select = styled.select`
  min-width: 112px;
  min-height: 36px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  padding: 0 10px;
  background: var(--project-background, #020617);
  color: var(--project-text-primary, #fff);
  font-weight: 800;
`;

const CheckGroup = styled.div`
  display: grid;
  gap: 7px;
  min-width: 92px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--project-text-secondary, #cbd5e1);
    font-size: 0.8rem;
    font-weight: 800;
  }

  input {
    width: 16px;
    height: 16px;
  }
`;

const KillInput = styled.input`
  width: 58px;
  min-height: 34px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.85);
  color: var(--project-text-primary, #fff);
  font-weight: 900;
  text-align: center;
`;

const EmptyState = styled.div`
  min-height: 280px;
  display: grid;
  place-items: center;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  color: var(--project-text-secondary, #94a3b8);
  font-weight: 900;
`;
