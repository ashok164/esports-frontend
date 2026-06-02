import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import http from "../../AxiosFile/axios";
import {
  publishActiveGameDetails,
  readStoredGameDetails,
} from "../../GameDetails/gameDetailsState";
import {
  deleteMatchTeamMappingApi,
  deleteMatchTeamMappingsApi,
  getAllMatchTeamMappingsApi,
} from "../../GameDetails/Repository/remote";
import { getTeamTableApi } from "../../TeamRecordTable/Repositary/remote";

type MappingRow = {
  id?: string | number;
  matchId: string;
  roomTeamId: string;
  permanentTeamId: string;
  slotNumber?: number;
  teamName?: string;
  teamTag?: string;
  updatedAt?: string;
};

type MappingGroup = {
  matchId: string;
  mappingCount: number;
  updatedAt?: string;
  mappings: MappingRow[];
};

type MappingCorrection = {
  matchId?: string;
  roomTeamId: string;
  previousPermanentTeamId?: string | null;
  detectedPermanentTeamId: string;
  matchedPlayers?: number;
  matchScore?: number;
  source?: string;
  correctedAt?: string;
};

type TeamOption = {
  teamId: string;
  teamName: string;
  teamTag: string;
};

type RawTeamRow = {
  roomTeamId: string;
  teamName: string;
};

type NameSuggestion = {
  teamId: string;
  teamName: string;
  score: number;
  ambiguous: boolean;
};

const TEAM_MAPPING_CORRECTIONS_STORAGE_KEY = "team_mapping_corrections";

const readMappingCorrections = (): Record<string, MappingCorrection[]> => {
  try {
    const stored = window.localStorage.getItem(TEAM_MAPPING_CORRECTIONS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "") ?? "";

const normalizeTeamId = (value: any) => {
  const clean = String(value ?? "").trim();
  if (!/^\d+$/.test(clean)) return clean;
  const numberValue = Number(clean);
  return Number.isSafeInteger(numberValue) ? String(numberValue) : clean;
};

const normalizeName = (value: any) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/4/g, "a")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const getNameTokens = (value: any) =>
  normalizeName(value)
    .split(" ")
    .filter((token) => token.length > 1 && !["esport", "esports", "team", "gaming"].includes(token));

const scoreNameMatch = (rawName: string, team: TeamOption) => {
  const raw = normalizeName(rawName);
  const dbName = normalizeName(team.teamName);
  const tag = normalizeName(team.teamTag);
  const rawTokens = getNameTokens(raw);
  const dbTokens = getNameTokens(dbName);
  let score = 0;

  if (raw && dbName === raw) score += 100;
  if (tag && tag === raw) score += 90;
  if (dbName && raw.includes(dbName)) score += 70;
  if (dbName && dbName.includes(raw)) score += 60;
  score += dbTokens.filter((token) => rawTokens.includes(token)).length * 18;
  if (tag && rawTokens.includes(tag) && tag.length >= 2) score += 35;

  return score;
};

const suggestTeamByName = (rawName: string, teams: TeamOption[]): NameSuggestion | null => {
  const ranked = teams
    .map((team) => ({ team, score: scoreNameMatch(rawName, team) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  const second = ranked[1];

  if (!best || best.score < 70) return null;

  return {
    teamId: best.team.teamId,
    teamName: best.team.teamName,
    score: best.score,
    ambiguous: Boolean(second && best.score - second.score < 20),
  };
};

const getRawTeams = (payload: any): RawTeamRow[] => {
  const teams =
    payload?.data?.team_stats ||
    payload?.data?.match?.team_stats ||
    payload?.team_stats ||
    payload?.match?.team_stats ||
    [];

  return Array.isArray(teams)
    ? teams.map((team: any) => ({
        roomTeamId: normalizeTeamId(firstValue(team.team_id, team.teamId, team.id)),
        teamName: String(firstValue(team.team_name, team.teamName, team.name)),
      })).filter((team) => team.roomTeamId)
    : [];
};

const MatchTeamMappingsView: React.FC = () => {
  const [groups, setGroups] = useState<MappingGroup[]>([]);
  const [corrections, setCorrections] = useState<Record<string, MappingCorrection[]>>(
    readMappingCorrections,
  );
  const [rawTeamsByMatch, setRawTeamsByMatch] = useState<Record<string, RawTeamRow[]>>({});
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.matchId === selectedMatchId) || groups[0],
    [groups, selectedMatchId],
  );
  const correctionsByRoom = useMemo(() => {
    const rows = selectedGroup ? corrections[selectedGroup.matchId] || [] : [];
    return new Map(rows.map((correction) => [String(correction.roomTeamId), correction]));
  }, [corrections, selectedGroup]);
  const rawTeamsByRoom = useMemo(() => {
    const rows = selectedGroup ? rawTeamsByMatch[selectedGroup.matchId] || [] : [];
    return new Map(rows.map((team) => [String(team.roomTeamId), team]));
  }, [rawTeamsByMatch, selectedGroup]);

  const loadMappings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCorrections(readMappingCorrections());
      const response = await getAllMatchTeamMappingsApi();
      const nextGroups = Array.isArray(response) ? response : [];
      setGroups(nextGroups);
      setSelectedMatchId((current) =>
        current && nextGroups.some((group) => group.matchId === current)
          ? current
          : nextGroups[0]?.matchId || "",
      );
    } catch (err: any) {
      setError(err?.message || "Could not load match mappings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await getTeamTableApi();
        setTeamOptions(
          (Array.isArray(teams) ? teams : [])
            .map((team: any) => ({
              teamId: String(firstValue(team.team_id, team.teamId)),
              teamName: String(firstValue(team.team_name, team.teamName)),
              teamTag: String(firstValue(team.short_tag, team.shortTag, team.teamTag, team.tag)),
            }))
            .filter((team: TeamOption) => team.teamId),
        );
      } catch (err: any) {
        setError(err?.message || "Could not load teams for raw compare.");
      }
    };

    loadTeams();
  }, []);

  useEffect(() => {
    if (!selectedGroup?.matchId || rawTeamsByMatch[selectedGroup.matchId]) return;

    const loadRawTeams = async () => {
      try {
        const response = await http.get(`/raw/${selectedGroup.matchId}`);
        const rows = getRawTeams(response?.data);
        setRawTeamsByMatch((current) => ({
          ...current,
          [selectedGroup.matchId]: rows,
        }));
      } catch {
        setRawTeamsByMatch((current) => ({
          ...current,
          [selectedGroup.matchId]: [],
        }));
      }
    };

    loadRawTeams();
  }, [rawTeamsByMatch, selectedGroup]);

  const deleteRoomMapping = async (mapping: MappingRow) => {
    if (!window.confirm(`Delete room ${mapping.roomTeamId} mapping for ${mapping.matchId}?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteMatchTeamMappingApi(mapping.matchId, mapping.roomTeamId);
      await loadMappings();
    } catch (err: any) {
      setError(err?.message || "Could not delete room mapping.");
      setIsLoading(false);
    }
  };

  const deleteMatchMapping = async (matchId: string) => {
    if (!window.confirm(`Delete all room mappings for match ${matchId}?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteMatchTeamMappingsApi(matchId);
      publishActiveGameDetails(
        readStoredGameDetails().map((game) =>
          game.matchId === matchId ? { ...game, mappingTemplateId: "" } : game,
        ),
      );
      await loadMappings();
    } catch (err: any) {
      setError(err?.message || "Could not delete match mappings.");
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <GlobalMappingStyles />
      <Shell>
        <Header>
          <div>
            <Kicker>Tournament Control</Kicker>
            <Title>Match Mappings</Title>
          </div>
          <HeaderActions>
            <GhostText>{isLoading ? "Loading..." : `${groups.length} match IDs`}</GhostText>
            <Button type="button" onClick={loadMappings} disabled={isLoading}>
              Refresh
            </Button>
          </HeaderActions>
        </Header>

        {error && <Alert>{error}</Alert>}

        <Layout>
          <MatchListPanel>
            <PanelHeader>
              <PanelTitle>Match IDs</PanelTitle>
            </PanelHeader>

            {groups.length === 0 ? (
              <EmptyState>No saved mappings yet.</EmptyState>
            ) : (
              <MatchList>
                {groups.map((group) => (
                  <MatchButton
                    key={group.matchId}
                    type="button"
                    $active={group.matchId === selectedGroup?.matchId}
                    onClick={() => setSelectedMatchId(group.matchId)}
                  >
                    <MatchId>{group.matchId}</MatchId>
                    <MatchMeta>{group.mappingCount} mapped rooms</MatchMeta>
                  </MatchButton>
                ))}
              </MatchList>
            )}
          </MatchListPanel>

          <DetailPanel>
            <PanelHeader>
              <div>
                <PanelTitle>{selectedGroup?.matchId || "No match selected"}</PanelTitle>
                <GhostText>
                  {selectedGroup
                    ? `${selectedGroup.mappingCount} mappings`
                    : "Select a match ID"}
                </GhostText>
              </div>
              {selectedGroup && (
                <DangerButton
                  type="button"
                  onClick={() => deleteMatchMapping(selectedGroup.matchId)}
                  disabled={isLoading}
                >
                  Delete Match Mapping
                </DangerButton>
              )}
            </PanelHeader>

            {!selectedGroup ? (
              <EmptyState>No mapping selected.</EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Room ID</th>
                    <th>Permanent Team ID</th>
                    <th>Garena Team</th>
                    <th>Auto Change</th>
                    <th>Team</th>
                    <th>Tag</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.mappings.map((mapping) => {
                    const correction = correctionsByRoom.get(String(mapping.roomTeamId));
                    const rawTeam = rawTeamsByRoom.get(String(mapping.roomTeamId));
                    const suggestion = rawTeam
                      ? suggestTeamByName(rawTeam.teamName, teamOptions)
                      : null;
                    const hasLiveMismatch =
                      suggestion &&
                      !suggestion.ambiguous &&
                      String(suggestion.teamId) !== String(mapping.permanentTeamId);
                    return (
                      <tr key={`${mapping.matchId}-${mapping.roomTeamId}`}>
                        <td><Mono>{mapping.roomTeamId}</Mono></td>
                        <td><Mono>{mapping.permanentTeamId}</Mono></td>
                        <td>
                          {rawTeam ? (
                            <RawNameBlock>
                              <span>{rawTeam.teamName || "-"}</span>
                              {hasLiveMismatch ? (
                                <small>suggest {suggestion.teamId} - {suggestion.teamName}</small>
                              ) : suggestion?.ambiguous ? (
                                <small>ambiguous name</small>
                              ) : null}
                            </RawNameBlock>
                          ) : (
                            <MutedText>No raw data</MutedText>
                          )}
                        </td>
                        <td>
                          {correction ? (
                            <CorrectionPill>
                              <Mono>{correction.previousPermanentTeamId || "-"}</Mono>
                              <span>to</span>
                              <Mono>{correction.detectedPermanentTeamId}</Mono>
                              {correction.source === "team-name" ? (
                                <small>name {correction.matchScore || ""}</small>
                              ) : correction.matchedPlayers ? (
                                <small>{correction.matchedPlayers} UID</small>
                              ) : null}
                            </CorrectionPill>
                          ) : hasLiveMismatch ? (
                            <CorrectionPill>
                              <Mono>{mapping.permanentTeamId}</Mono>
                              <span>to</span>
                              <Mono>{suggestion.teamId}</Mono>
                              <small>name {suggestion.score}</small>
                            </CorrectionPill>
                          ) : (
                            <MutedText>No change</MutedText>
                          )}
                        </td>
                        <td>{mapping.teamName || "-"}</td>
                        <td>{mapping.teamTag || "-"}</td>
                        <td>
                          <IconButton
                            type="button"
                            title="Delete room mapping"
                            onClick={() => deleteRoomMapping(mapping)}
                            disabled={isLoading}
                          >
                            <TrashIcon />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </DetailPanel>
        </Layout>
      </Shell>
    </Page>
  );
};

export default MatchTeamMappingsView;

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 6l1 15h10l1-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlobalMappingStyles = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #0a0f18);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  background: linear-gradient(180deg, var(--project-background, #0a0f18), var(--project-surface, #101722));
  color: var(--project-text-primary, #e5edf8);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.div`
  width: min(1320px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Kicker = styled.div`
  color: var(--project-accent, #5eead4);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 6px 0 0;
  color: var(--project-text-primary, #ffffff);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MatchListPanel = styled.section`
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
`;

const DetailPanel = styled.section`
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const MatchList = styled.div`
  display: grid;
  gap: 8px;
`;

const MatchButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  gap: 5px;
  padding: 12px;
  border: 1px solid ${({ $active }) => $active ? "var(--project-accent, #5eead4)" : "rgba(148, 163, 184, 0.22)"};
  border-radius: 8px;
  background: ${({ $active }) => $active ? "rgba(94, 234, 212, 0.14)" : "rgba(2, 6, 23, 0.42)"};
  color: var(--project-text-primary, #ffffff);
  text-align: left;
  cursor: pointer;
`;

const MatchId = styled.span`
  font-family: "SFMono-Regular", Consolas, monospace;
  font-weight: 800;
  overflow-wrap: anywhere;
`;

const MatchMeta = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.82rem;
`;

const Table = styled.table`
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: 10px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    text-align: left;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }

  th {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.75rem;
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const Button = styled.button`
  min-height: 38px;
  border: 0;
  border-radius: 6px;
  background: var(--project-primary, #ef4444);
  color: #ffffff;
  padding: 0 14px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const DangerButton = styled(Button)`
  background: var(--project-danger, #dc2626);
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(248, 113, 113, 0.32);
  border-radius: 6px;
  background: rgba(127, 29, 29, 0.22);
  color: #fecaca;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Mono = styled.span`
  font-family: "SFMono-Regular", Consolas, monospace;
`;

const CorrectionPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 5px 7px;
  border: 1px solid rgba(245, 158, 11, 0.36);
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.12);
  color: #fde68a;
  font-size: 0.82rem;

  small {
    color: #fbbf24;
    font-size: 0.72rem;
    font-weight: 800;
  }
`;

const RawNameBlock = styled.div`
  display: grid;
  gap: 4px;

  span {
    color: var(--project-text-primary, #ffffff);
  }

  small {
    color: #fbbf24;
    font-size: 0.76rem;
    font-weight: 800;
  }
`;

const MutedText = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.82rem;
`;

const GhostText = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.86rem;
  font-weight: 700;
`;

const EmptyState = styled.div`
  padding: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  color: var(--project-text-secondary, #94a3b8);
  text-align: center;
`;

const Alert = styled.div`
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.34);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  color: var(--project-text-primary, #ffffff);
`;
