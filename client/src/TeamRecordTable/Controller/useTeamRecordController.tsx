import { useCallback, useEffect, useState } from "react";
import {
  createTeamTableApi,
  deleteTeamTableApi,
  getTeamTableApi,
  updateTeamTableApi,
} from "../Repositary/remote";
import { useNavigate } from "react-router-dom";

export interface TeamRecord {
  id?: number | string;
  _id?: number | string;
  team_id?: string | number;
  teamId?: string | number;
  team_name?: string;
  teamName?: string;
  short_tag?: string;
  shortTag?: string;
  tag?: string;
  team_logo?: string;
  teamLogo?: string;
  country_logo?: string;
  countryLogo?: string;
}

const useTeamRecordController = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractFile = (fileField: any): File | null => {
    if (!fileField) return null;
    if (fileField instanceof File) return fileField;
    if (Array.isArray(fileField) || fileField instanceof FileList) {
      return fileField[0] instanceof File ? fileField[0] : null;
    }
    if (typeof fileField === "object" && fileField["0"] instanceof File) {
      return fileField["0"];
    }
    return null;
  };

  const buildTeamFormData = (teamRecord: any) => {
    const formData = new FormData();
    formData.append("teamId", teamRecord.teamId || teamRecord.team_id || "");
    formData.append("teamName", teamRecord.teamName || teamRecord.team_name || "");
    formData.append(
      "shortTag",
      teamRecord.tag || teamRecord.shortTag || teamRecord.short_tag || ""
    );

    const teamLogoFile = extractFile(teamRecord.teamLogo);
    const countryLogoFile = extractFile(teamRecord.countryLogo);

    if (teamLogoFile) {
      formData.append("teamLogo", teamLogoFile);
    }
    if (countryLogoFile) {
      formData.append("countryLogo", countryLogoFile);
    }

    return formData;
  };

  const getRecordId = (record: TeamRecord) => record.id || record._id;
  const getTeamId = (record: TeamRecord) => record.team_id || record.teamId || "";

  const compareTeamIdAscending = (left: TeamRecord, right: TeamRecord) => {
    const leftTeamId = getTeamId(left);
    const rightTeamId = getTeamId(right);
    const leftNumber = Number(leftTeamId);
    const rightNumber = Number(rightTeamId);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return String(leftTeamId).localeCompare(String(rightTeamId), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTeamTableApi();
      setTeams(Array.isArray(result) ? [...result].sort(compareTeamIdAscending) : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load team records");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreateTeam = async (data: any) => {
    setIsSaving(true);
    setError(null);
    try {
      if (
        !data ||
        !data.teams ||
        !Array.isArray(data.teams) ||
        data.teams.length === 0
      ) {
        setError("Add at least one valid team before saving");
        return;
      }

      for (const teamRecord of data.teams) {
        await createTeamTableApi(buildTeamFormData(teamRecord));
      }

      await loadTeams();
      navigate("/team-record");
    } catch (err: any) {
      setError(err?.message || "Failed to submit team records");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTeam = async (recordId: string | number, data: any) => {
    setIsSaving(true);
    setError(null);
    try {
      await updateTeamTableApi(recordId, buildTeamFormData(data));
      await loadTeams();
    } catch (err: any) {
      setError(err?.message || "Failed to update team record");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorderTeams = async (rows: any[]) => {
    setIsSaving(true);
    setError(null);
    try {
      const rowsWithIds = rows.filter((row) => row.recordId);

      await Promise.all(
        rowsWithIds.map((row, index) =>
          updateTeamTableApi(
            row.recordId,
            buildTeamFormData({
              ...row,
              teamId: String(-100000 - index),
            }),
          ),
        ),
      );

      await Promise.all(
        rowsWithIds.map((row) =>
          updateTeamTableApi(row.recordId, buildTeamFormData(row)),
        ),
      );

      await loadTeams();
    } catch (err: any) {
      setError(err?.message || "Failed to reorder team records");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = async (recordId: string | number) => {
    setIsSaving(true);
    setError(null);
    try {
      await deleteTeamTableApi(recordId);
      await loadTeams();
    } catch (err: any) {
      setError(err?.message || "Failed to delete team record");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTeamLogos = (team?: TeamRecord) => {
    const recordId = team ? getRecordId(team) : "";
    navigate(recordId ? `/team-logo?team=${recordId}` : "/team-logo");
  };

  return {
    createTeamTable: handleCreateTeam,
    updateTeamTable: handleUpdateTeam,
    reorderTeamTable: handleReorderTeams,
    deleteTeamTable: handleDeleteTeam,
    openTeamLogos: handleOpenTeamLogos,
    refreshTeams: loadTeams,
    teams,
    isLoading,
    isSaving,
    error,
  };
};

export default useTeamRecordController;
