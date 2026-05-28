import React, { useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { getMatchTeamMappingsApi } from "../../GameDetails/Repository/remote";
import { createResultApi, getResultByMatchIdApi, ResultRow } from "../../Result/repository/remote";

type MappingRow = {
  roomTeamId: string;
  permanentTeamId: string;
  teamName?: string;
  teamTag?: string;
  teamLogo?: string;
  countryLogo?: string;
};

type PreviewRow = {
  roomTeamId: string;
  jsonTeamName: string;
  mappedTeamId: string;
  mappedTeamName: string;
  teamTag: string;
  teamLogo: string;
  countryLogo: string;
  kills: number;
  placement: number;
  booyahCount: number;
  totalKills: number;
  final: boolean;
  mapped: boolean;
};

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const toText = (value: any) => String(value ?? "").trim();

const normalizeTeamId = (value: any) => {
  const clean = toText(value);
  if (!/^\d+$/.test(clean)) return clean;
  const numberValue = Number(clean);
  return Number.isSafeInteger(numberValue) ? String(numberValue) : clean;
};

const toNumber = (value: any) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.trunc(numberValue) : 0;
};

const toBoolean = (value: any) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["true", "1", "yes", "y", "win", "winner", "booyah", "final"].includes(
    toText(value).toLowerCase(),
  );
};

const cleanJsonText = (value: string) => {
  let clean = value.trim();
  clean = clean.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  const objectStart = clean.indexOf("{");
  const arrayStart = clean.indexOf("[");
  const firstJsonStart =
    objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart);

  if (firstJsonStart > 0) {
    clean = clean.slice(firstJsonStart).trim();
  }

  const objectEnd = clean.lastIndexOf("}");
  const arrayEnd = clean.lastIndexOf("]");
  const lastJsonEnd = Math.max(objectEnd, arrayEnd);

  if (lastJsonEnd >= 0 && lastJsonEnd < clean.length - 1) {
    clean = clean.slice(0, lastJsonEnd + 1).trim();
  }

  return clean;
};

const getMatchIdFromPayload = (payload: any) =>
  toText(
    firstValue(
      payload?.data?.matchId,
      payload?.data?.match_id,
      payload?.matchId,
      payload?.match_id,
    ),
  );

const getStandingsFromPayload = (payload: any) => {
  if (Array.isArray(payload?.data?.standings)) return payload.data.standings;
  if (Array.isArray(payload?.standings)) return payload.standings;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getRoomTeamId = (team: any) =>
  normalizeTeamId(
    firstValue(
      team.roomTeamId,
      team.room_team_id,
      team.team_id,
      team.teamId,
      team.id,
      team.team_uid,
      team.teamUid,
      team.teamCode,
    ),
  );

const getTeamName = (team: any) =>
  toText(firstValue(team.team_name, team.teamName, team.name, team.team, team.title));

const getKills = (team: any) =>
  toNumber(firstValue(team.killing_score, team.killingScore, team.kill_count, team.killCount, team.kills));

const getPlacement = (team: any) =>
  toNumber(firstValue(team.ranking_score, team.rankingScore, team.placement, team.placement_points));

const getTotalKills = (team: any, kills: number, placement: number) =>
  toNumber(
    firstValue(
      team.totalKills,
      team.total_kills,
      team.totalScore,
      team.total_score,
      team.totalPoints,
      team.total_points,
      kills + placement,
    ),
  );

const formatLogo = (value: string) => {
  const clean = toText(value);
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return clean.startsWith("/uploads") ? clean : `/uploads/${clean.replace(/^uploads\//i, "")}`;
};

const normalizeSavedRows = (payload: any): ResultRow[] =>
  Array.isArray(payload?.data) ? payload.data : [];

const ResultJsonControlView: React.FC = () => {
  const [jsonText, setJsonText] = useState("");
  const [matchId, setMatchId] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [savedRows, setSavedRows] = useState<ResultRow[]>([]);
  const [status, setStatus] = useState("Paste websocket JSON and parse it.");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [parsedPayload, setParsedPayload] = useState<any>(null);

  const counts = useMemo(
    () => ({
      teams: previewRows.length,
      mapped: previewRows.filter((row) => row.mapped).length,
      booyah: previewRows.filter((row) => row.booyahCount > 0).length,
      final: previewRows.filter((row) => row.final).length,
    }),
    [previewRows],
  );

  const parseJson = async () => {
    setError("");
    setStatus("Parsing JSON...");
    setPreviewRows([]);
    setSavedRows([]);
    setParsedPayload(null);
    setIsBusy(true);

    try {
      const cleaned = cleanJsonText(jsonText);
      const payload = JSON.parse(cleaned);
      const detectedMatchId = matchId.trim() || getMatchIdFromPayload(payload);

      if (!detectedMatchId) {
        throw new Error("Match ID not found. Enter match ID or include data.matchId in JSON.");
      }

      const standings = getStandingsFromPayload(payload);
      if (!standings.length) {
        throw new Error("No standings/results array found in JSON.");
      }

      const mappings = (await getMatchTeamMappingsApi(detectedMatchId)) as MappingRow[];
      const mappingByRoomId = new Map(
        mappings.map((mapping) => [normalizeTeamId(mapping.roomTeamId), mapping]),
      );

      const nextRows = standings.map((team: any) => {
        const roomTeamId = getRoomTeamId(team);
        const mapping = mappingByRoomId.get(roomTeamId);
        const kills = getKills(team);
        const placement = getPlacement(team);
        const booyahCount = toBoolean(
          firstValue(team.booyah, team.is_booyah, team.isBooyah, team.has_booyah, team.hasBooyah),
        )
          ? 1
          : 0;

        return {
          roomTeamId,
          jsonTeamName: getTeamName(team),
          mappedTeamId: toText(mapping?.permanentTeamId),
          mappedTeamName: toText(mapping?.teamName),
          teamTag: toText(mapping?.teamTag),
          teamLogo: formatLogo(toText(mapping?.teamLogo)),
          countryLogo: formatLogo(toText(mapping?.countryLogo)),
          kills,
          placement,
          booyahCount,
          totalKills: getTotalKills(team, kills, placement),
          final: toBoolean(firstValue(team.final, team.is_final, team.isFinal)),
          mapped: Boolean(mapping),
        };
      });

      setJsonText(cleaned);
      setMatchId(detectedMatchId);
      setParsedPayload({
        ...payload,
        matchId: detectedMatchId,
        data: {
          ...(payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
            ? payload.data
            : {}),
          matchId: detectedMatchId,
          standings,
        },
      });
      setPreviewRows(nextRows);

      const mappedCount = nextRows.filter((row: PreviewRow) => row.mapped).length;
      if (mappedCount !== nextRows.length) {
        setStatus(`Parsed ${nextRows.length} teams. ${nextRows.length - mappedCount} teams are not mapped, so their JSON team_id will be saved directly.`);
      } else {
        setStatus(`Ready to save ${nextRows.length} mapped teams for match ${detectedMatchId}.`);
      }
    } catch (err: any) {
      setError(err?.message || "Could not parse JSON.");
      setStatus("Parse failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const saveResults = async () => {
    if (!parsedPayload) return;

    setError("");
    setStatus("Saving result rows...");
    setIsBusy(true);

    try {
      const response = await createResultApi(parsedPayload as any);
      const saved = normalizeSavedRows(response);
      setSavedRows(saved);
      setStatus(`Saved ${saved.length} rows. Booyah rows: ${saved.filter((row) => Number(row.booyahCount) > 0).length}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not save result rows.");
      setStatus("Save failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const loadSavedResults = async () => {
    if (!matchId.trim()) {
      setError("Enter match ID before loading saved results.");
      return;
    }

    setError("");
    setStatus("Loading saved results...");
    setIsBusy(true);

    try {
      const response = await getResultByMatchIdApi(matchId.trim());
      const rows = normalizeSavedRows(response);
      setSavedRows(rows);
      setStatus(`Loaded ${rows.length} saved rows for ${matchId.trim()}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not load saved results.");
      setStatus("Load failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const canSave = parsedPayload && previewRows.length > 0;

  return (
    <Page>
      <GlobalResultJsonStyles />
      <Shell>
        <Header>
          <div>
            <Kicker>Tournament Control</Kicker>
            <Title>JSON Result Control</Title>
          </div>
          <HeaderActions>
            <Input
              value={matchId}
              onChange={(event) => setMatchId(event.target.value)}
              placeholder="Match ID"
              aria-label="Match ID"
            />
            <Button type="button" onClick={parseJson} disabled={isBusy}>
              Parse
            </Button>
            <Button type="button" onClick={saveResults} disabled={isBusy || !canSave}>
              Save
            </Button>
            <Button type="button" onClick={loadSavedResults} disabled={isBusy} $variant="ghost">
              Results
            </Button>
          </HeaderActions>
        </Header>

        {error && <Alert>{error}</Alert>}
        <Notice>{status}</Notice>

        <Layout>
          <EditorPanel>
            <PanelHeader>
              <PanelTitle>Paste JSON</PanelTitle>
              <GhostText>Whitespace and code fences are cleaned before parsing.</GhostText>
            </PanelHeader>
            <JsonInput
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              spellCheck={false}
              placeholder='Paste {"success":true,"data":{"matchId":"...","standings":[...]}}'
            />
          </EditorPanel>

          <PreviewPanel>
            <Stats>
              <Stat><strong>{counts.teams}</strong><span>JSON teams</span></Stat>
              <Stat><strong>{counts.mapped}</strong><span>Mapped</span></Stat>
              <Stat><strong>{counts.booyah}</strong><span>Booyah</span></Stat>
              <Stat><strong>{counts.final}</strong><span>Final</span></Stat>
            </Stats>

            <PanelHeader>
              <PanelTitle>Slot Mapping Preview</PanelTitle>
              <GhostText>{previewRows.length ? `${previewRows.length} teams` : "No parsed teams"}</GhostText>
            </PanelHeader>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>JSON Team</th>
                    <th>Mapped Team</th>
                    <th>Logo</th>
                    <th>Kills</th>
                    <th>Place</th>
                    <th>Booyah</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.length === 0 ? (
                    <tr><EmptyCell colSpan={7}>Parse JSON to preview slot mapping.</EmptyCell></tr>
                  ) : (
                    previewRows.map((row) => (
                      <tr key={`${row.roomTeamId}-${row.jsonTeamName}`}>
                        <td><Mono>{row.roomTeamId || "-"}</Mono></td>
                        <td>{row.jsonTeamName || "-"}</td>
                        <td>
                          <Pill $active={row.mapped}>
                            {row.mapped ? `${row.mappedTeamName || "Team"} (${row.mappedTeamId})` : "Not mapped"}
                          </Pill>
                        </td>
                        <td>
                          <LogoPair>
                            {row.teamLogo && <Logo src={row.teamLogo} alt="" />}
                            {row.countryLogo && <Logo src={row.countryLogo} alt="" />}
                          </LogoPair>
                        </td>
                        <td>{row.kills}</td>
                        <td>{row.placement}</td>
                        <td><Pill $active={row.booyahCount > 0}>{row.booyahCount > 0 ? "Yes" : "No"}</Pill></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrap>

            <PanelHeader $spaced>
              <PanelTitle>Saved Result</PanelTitle>
              <GhostText>{savedRows.length ? `${savedRows.length} rows` : "No saved rows loaded"}</GhostText>
            </PanelHeader>
            <TableWrap $short>
              <Table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Tag</th>
                    <th>Kills</th>
                    <th>Place</th>
                    <th>Booyah</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRows.length === 0 ? (
                    <tr><EmptyCell colSpan={6}>Saved rows will appear here.</EmptyCell></tr>
                  ) : (
                    savedRows.map((row, index) => (
                      <tr key={`${row.teamId}-${row.teamName}-${index}`}>
                        <td>{row.teamName || "-"}</td>
                        <td>{row.teamTag || "-"}</td>
                        <td>{row.kills}</td>
                        <td>{row.placement}</td>
                        <td>{row.booyahCount}</td>
                        <td>{row.totalKills}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </PreviewPanel>
        </Layout>
      </Shell>
    </Page>
  );
};

export default ResultJsonControlView;

const GlobalResultJsonStyles = createGlobalStyle`
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
  margin-bottom: 16px;

  @media (max-width: 900px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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
  grid-template-columns: minmax(360px, 0.92fr) minmax(520px, 1.25fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
`;

const EditorPanel = styled(Panel)`
  padding: 16px;
`;

const PreviewPanel = styled(Panel)`
  padding: 16px;
`;

const PanelHeader = styled.div<{ $spaced?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: ${({ $spaced }) => ($spaced ? "18px 0 10px" : "0 0 10px")};
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: var(--project-text-primary, #f8fafc);
  font-size: 1rem;
`;

const GhostText = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.82rem;
`;

const Input = styled.input`
  width: min(320px, 100%);
  height: 42px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.28));
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.4);
  color: var(--project-text-primary, #f8fafc);
  padding: 0 12px;
  outline: none;
`;

const JsonInput = styled.textarea`
  width: 100%;
  min-height: 620px;
  resize: vertical;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.28));
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.48);
  color: var(--project-text-primary, #f8fafc);
  padding: 12px;
  outline: none;
  font: 0.82rem/1.45 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
`;

const Button = styled.button<{ $variant?: "ghost" }>`
  height: 42px;
  border: 1px solid ${({ $variant }) => ($variant === "ghost" ? "var(--project-border, rgba(148, 163, 184, 0.28))" : "transparent")};
  border-radius: 8px;
  background: ${({ $variant }) => ($variant === "ghost" ? "rgba(15, 23, 42, 0.75)" : "var(--project-accent, #14b8a6)")};
  color: ${({ $variant }) => ($variant === "ghost" ? "var(--project-text-primary, #f8fafc)" : "#031712")};
  padding: 0 16px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const Notice = styled.div`
  border: 1px solid rgba(94, 234, 212, 0.22);
  border-radius: 8px;
  background: rgba(20, 184, 166, 0.09);
  color: var(--project-text-primary, #e5edf8);
  padding: 12px 14px;
  margin-bottom: 12px;
`;

const Alert = styled(Notice)`
  border-color: rgba(248, 113, 113, 0.38);
  background: rgba(127, 29, 29, 0.38);
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;

  @media (max-width: 620px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Stat = styled.div`
  min-height: 74px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  padding: 10px;
  background: rgba(2, 6, 23, 0.34);

  strong {
    display: block;
    color: var(--project-text-primary, #fff);
    font-size: 1.55rem;
    line-height: 1.05;
  }

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.78rem;
  }
`;

const TableWrap = styled.div<{ $short?: boolean }>`
  max-height: ${({ $short }) => ($short ? "300px" : "430px")};
  overflow: auto;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.82rem;

  th,
  td {
    border-bottom: 1px solid var(--project-border, rgba(148, 163, 184, 0.16));
    padding: 9px 8px;
    text-align: left;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgba(15, 23, 42, 0.98);
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.74rem;
    text-transform: uppercase;
  }
`;

const EmptyCell = styled.td`
  color: var(--project-text-secondary, #94a3b8);
  text-align: center !important;
  padding: 28px 12px !important;
`;

const Mono = styled.span`
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
`;

const Pill = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 3px 8px;
  background: ${({ $active }) => ($active ? "rgba(34, 197, 94, 0.16)" : "rgba(148, 163, 184, 0.12)")};
  color: ${({ $active }) => ($active ? "#86efac" : "var(--project-text-secondary, #94a3b8)")};
  font-size: 0.75rem;
  font-weight: 800;
`;

const LogoPair = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Logo = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.08);
`;
