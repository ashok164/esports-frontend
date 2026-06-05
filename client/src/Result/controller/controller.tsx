import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTeamTableApi } from "../../TeamRecordTable/Repositary/remote";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getLeagueStageResultGameDetails,
  getResultGameDetails,
  getTodaysResultGameDetails,
} from "../../GameDetails/gameDetailsState";
import {
  createResultApi,
  deleteResultApi,
  deleteResultsApi,
  getResultsByMatchIdsApi,
  ResultRow,
  saveRealtimeResultDataApi,
  updateResultApi,
} from "../repository/remote";

const makeLocalId = () => `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export type ResultControlTab = "result" | "today" | "league";

export const getResultRecordId = (row: ResultRow) => row.id || row._id;

const resultDownloadHeaders = [
  "Match ID",
  "Team ID",
  "Team Logo URL",
  "Country Logo URL",
  "Team Name",
  "Team Tag",
  "Kills",
  "Placement",
  "Booyah Count",
  "Total Score",
];

const pick = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return "";
};

const normalizeResultRow = (row: any): ResultRow => ({
  id: row?.id,
  _id: row?._id,
  matchIds: String(row?.matchIds ?? row?.match_ids ?? row?.match_id ?? ""),
  teamId: String(pick(row, ["permanentTeamId", "permanent_team_id", "team_id", "teamId", "teamID", "teamid"])),
  teamLogo: String(pick(row, ["teamLogo", "team_logo", "logo"])),
  countryLogo: String(pick(row, ["countryLogo", "country_logo", "flag"])),
  teamName: String(pick(row, ["team_name", "teamName", "name"])),
  teamTag: String(pick(row, ["teamTag", "team_tag", "shortTag", "short_tag", "tag"])),
  kills: pick(row, ["kill_score", "kills", "kill"]) || 0,
  placement: pick(row, ["survival_score", "placement", "place", "rank", "match_rank"]) || 0,
  booyahCount: pick(row, ["booyahCount", "booyah_count", "booyah", "winCount"]) || "",
  totalKills: pick(row, ["total_score", "totalScore", "totalKills", "total_kills"]) || 0,
});

const normalizeTeamRecord = (team: any) => ({
  teamId: String(pick(team, ["teamId", "team_id"])),
  teamLogo: String(pick(team, ["teamLogo", "team_logo"])),
  countryLogo: String(pick(team, ["countryLogo", "country_logo"])),
  teamName: String(pick(team, ["teamName", "team_name"])),
  teamTag: String(pick(team, ["teamTag", "team_tag", "shortTag", "short_tag", "tag"])),
});

const mergeWithTeamRecords = (rows: ResultRow[], teams: any[], matchIds: string) => {
  const normalizedTeams = teams.map(normalizeTeamRecord);

  return rows.map((row) => {
    const team = normalizedTeams.find(
      (item) =>
        item.teamId === row.teamId ||
        (item.teamTag && item.teamTag.toLowerCase() === row.teamTag.toLowerCase()) ||
        (item.teamName && item.teamName.toLowerCase() === row.teamName.toLowerCase()),
    );

    return {
      ...row,
      matchIds,
      teamId: row.teamId || team?.teamId || "",
      teamLogo: row.teamLogo || team?.teamLogo || "",
      countryLogo: row.countryLogo || team?.countryLogo || "",
      teamName: row.teamName || team?.teamName || "",
      teamTag: row.teamTag || team?.teamTag || "",
    };
  });
};

const sortResults = (rows: ResultRow[]) =>
  [...rows].sort((left, right) => {
    const leftScore = Number(left.totalKills);
    const rightScore = Number(right.totalKills);

    if (Number.isFinite(leftScore) && Number.isFinite(rightScore) && leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return String(left.teamName).localeCompare(String(right.teamName));
  });

const escapeCsvValue = (value: unknown) => {
  const rawValue = String(value ?? "");
  const safeValue = /^[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue;

  return `"${safeValue.replace(/"/g, '""')}"`;
};

const downloadResultCsv = (rows: ResultRow[], filename: string) => {
  const csvRows = [
    resultDownloadHeaders,
    ...sortResults(rows).map((row) => [
      row.matchIds,
      row.teamId,
      row.teamLogo,
      row.countryLogo,
      row.teamName,
      row.teamTag,
      row.kills,
      row.placement,
      row.booyahCount,
      row.totalKills,
    ]),
  ];
  const csvContent = csvRows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const toTeamResultPayload = ({ id, _id, ...row }: ResultRow) => ({
  matchIds: row.matchIds,
  teamId: row.teamId,
  teamLogo: row.teamLogo,
  countryLogo: row.countryLogo,
  teamName: row.teamName,
  teamTag: row.teamTag,
  kills: row.kills,
  placement: row.placement,
  booyahCount: row.booyahCount,
  totalKills: row.totalKills,
});

const useResultController = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [activeTab, setActiveTab] = useState<ResultControlTab>("result");
  const [activeMatchIds, setActiveMatchIds] = useState(getResultGameDetails().matchIds);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingRow, setEditingRow] = useState<ResultRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const lastAutoLoadedMatchIds = useRef<string | null>(null);

  const matchIdList = useMemo(
    () => activeMatchIds.split(",").map((matchId) => matchId.trim()).filter(Boolean),
    [activeMatchIds],
  );

  const getMatchIdsForTab = useCallback((tab: ResultControlTab) => {
    if (tab === "today") return getTodaysResultGameDetails().matchIds;
    if (tab === "league") return getLeagueStageResultGameDetails().matchIds;
    return getResultGameDetails().matchIds;
  }, []);

  useEffect(() => {
    const updateActiveMatchIds = () => {
      setActiveMatchIds(getMatchIdsForTab(activeTab));
    };

    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, updateActiveMatchIds);
    window.addEventListener("storage", updateActiveMatchIds);

    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, updateActiveMatchIds);
      window.removeEventListener("storage", updateActiveMatchIds);
    };
  }, [activeTab, getMatchIdsForTab]);

  useEffect(() => {
    setActiveMatchIds(getMatchIdsForTab(activeTab));
    setEditingId(null);
    setEditingRow(null);
  }, [activeTab, getMatchIdsForTab]);

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (matchIdList.length === 0) {
        setResults([]);
        setStatus("No match ID is enabled in Game Details.");
        return;
      }

      let realtimeSavePayload: any = null;

      try {
        realtimeSavePayload = await saveRealtimeResultDataApi(matchIdList);
      } catch (err) {
        console.warn("Realtime result save failed; loading existing DB rows.", err);
      }

      const matchPayload = await getResultsByMatchIdsApi(matchIdList);
      const teams = await getTeamTableApi();
      const sourceRows =
        matchIdList.length > 1 || activeTab !== "result"
          ? matchPayload?.overall
          : matchPayload?.data;
      const fetchedRows = mergeWithTeamRecords(
        (Array.isArray(sourceRows) ? sourceRows : []).map((row: any) =>
          normalizeResultRow({
            ...row,
            matchIds: matchIdList.join(","),
          }),
        ),
        Array.isArray(teams) ? teams : [],
        matchIdList.join(","),
      ).filter((row) => row.teamId || row.teamName || row.teamTag);

      if (fetchedRows.length === 0) {
        setResults([]);
        setStatus("No saved result rows found for the enabled match IDs.");
        return;
      }

      const localRows = fetchedRows.map((row) => ({ ...row, id: getResultRecordId(row) || makeLocalId() }));
      setResults(sortResults(localRows));
      const skippedCount = Array.isArray(realtimeSavePayload?.skippedRows)
        ? realtimeSavePayload.skippedRows.length
        : 0;
      const savedCount = Array.isArray(realtimeSavePayload?.data)
        ? realtimeSavePayload.data.length
        : 0;
      setStatus(
        matchIdList.length > 1 || activeTab !== "result"
          ? `Saved ${savedCount} realtime rows, then calculated ${localRows.length} team totals from ${matchIdList.length} match IDs.` +
              (skippedCount ? ` ${skippedCount} rows skipped because team identity was not found.` : "")
          : `Saved ${savedCount} realtime rows, then loaded ${localRows.length} saved result rows from ${matchIdList.join(",")}.` +
              (skippedCount ? ` ${skippedCount} rows skipped because team identity was not found.` : ""),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load result data");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, matchIdList]);

  useEffect(() => {
    const matchKey = matchIdList.join(",");
    const loadKey = `${activeTab}:${matchKey}`;

    if (lastAutoLoadedMatchIds.current === loadKey) return;

    lastAutoLoadedMatchIds.current = loadKey;
    loadResults();
  }, [activeTab, loadResults, matchIdList]);

  const beginEdit = (row: ResultRow) => {
    setEditingId(getResultRecordId(row) || null);
    setEditingRow({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingRow(null);
  };

  const updateEditingRow = (field: keyof ResultRow, value: string) => {
    setEditingRow((row) => (row ? { ...row, [field]: value } : row));
  };

  const saveEdit = async () => {
    if (!editingId || !editingRow) return;

    setIsSaving(true);
    setError(null);

    try {
      if (!String(editingId).startsWith("local-")) {
        await updateResultApi(editingId, editingRow);
      }

      setResults((rows) =>
        sortResults(
          rows.map((row) =>
            String(getResultRecordId(row)) === String(editingId)
              ? { ...editingRow, id: row.id, _id: row._id }
              : row,
          ),
        ),
      );
      cancelEdit();
    } catch (err: any) {
      setError(err?.message || "Failed to update result row");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllResults = async () => {
    if (results.length === 0) return;

    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      const rowsToSave = results.map(toTeamResultPayload);
      const response = await createResultApi(rowsToSave);
      const savedRowsSource = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : rowsToSave;
      const savedRows = savedRowsSource.map((row: any) => normalizeResultRow(row));

      setResults(
        sortResults(
          savedRows.map((row) => ({
            ...row,
            id: getResultRecordId(row) || makeLocalId(),
          })),
        ),
      );
      setStatus(`Updated ${savedRows.length} result rows.`);
    } catch (err: any) {
      setError(err?.message || "Failed to update result rows");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteResult = async (row: ResultRow) => {
    const recordId = getResultRecordId(row);
    if (!recordId) return;

    setIsSaving(true);
    setError(null);

    try {
      if (!String(recordId).startsWith("local-")) {
        await deleteResultApi(recordId);
      }

      setResults((rows) => rows.filter((item) => String(getResultRecordId(item)) !== String(recordId)));
    } catch (err: any) {
      setError(err?.message || "Failed to delete result row");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllResults = async () => {
    if (results.length === 0) return;

    const scope = activeMatchIds || "current view";
    if (!window.confirm(`Delete all ${results.length} result rows for ${scope}?`)) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      await deleteResultsApi(results);
      setResults([]);
      setStatus(`Deleted ${results.length} result rows.`);
    } catch (err: any) {
      setError(err?.message || "Failed to delete all result rows");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const filenamePrefix =
      activeTab === "league" ? "league-stage-result" : activeTab === "today" ? "todays-result" : "result";
    const timestamp = new Date().toISOString().slice(0, 10);

    downloadResultCsv(sortResults(results), `${filenamePrefix}-${timestamp}.csv`);
    setStatus(`Downloaded ${results.length} rows.`);
  };

  return {
    activeMatchIds,
    activeTab,
    beginEdit,
    cancelEdit,
    deleteResult,
    deleteAllResults,
    editingId,
    editingRow,
    error,
    isLoading,
    isSaving,
    loadResults,
    results,
    saveAllResults,
    saveEdit,
    status,
    downloadResults,
    setActiveTab,
    updateEditingRow,
  };
};

export default useResultController;
