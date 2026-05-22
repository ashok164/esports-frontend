import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createPlayerUploadApi,
  deletePlayerUploadApi,
  getPlayerUploadsApi,
  updatePlayerUploadApi,
} from "../Repository/remote";
import { API_BASE_URL } from "../../Routes/ApiRoutes/apiRoutes";

export interface PlayerUploadRecord {
  id?: string | number;
  teamId: string;
  teamName?: string;
  playerPhotos?: string[];
}

const toImageUrl = (path: string) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const normalizePhotos = (record: any): string[] => {
  const rawPhotos =
    record?.playerPhotos ||
    record?.player_photos ||
    record?.player_pic ||
    record?.playerPic ||
    record?.playerPhoto ||
    record?.player_photo ||
    record?.players ||
    record?.photos ||
    record?.images ||
    [];

  const photos =
    typeof rawPhotos === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(rawPhotos);
            return Array.isArray(parsed) ? parsed : rawPhotos.split(",");
          } catch {
            return rawPhotos.split(",");
          }
        })()
      : rawPhotos;

  if (!Array.isArray(photos)) return [];

  return photos
    .map((photo: any) => {
      if (typeof photo === "string") return photo;
      return (
        photo?.url ||
        photo?.path ||
        photo?.image ||
        photo?.photo ||
        photo?.playerPhoto ||
        photo?.player_photo ||
        photo?.player_pic ||
        photo?.playerPic ||
        ""
      );
    })
    .filter(Boolean)
    .map(toImageUrl);
};

const normalizePlayerUpload = (record: any, index: number): PlayerUploadRecord => ({
  id: record?.id || record?._id || record?.teamId || record?.team_id || index,
  teamId: String(record?.teamId || record?.team_id || record?.team || ""),
  teamName:
    record?.teamName ||
    record?.team_name ||
    record?.name ||
    record?.team?.teamName ||
    record?.team?.team_name ||
    "",
  playerPhotos: normalizePhotos(record),
});

const getResponseRows = (result: any) => {
  const rows =
    result?.data?.data ||
    result?.data?.playerUploads ||
    result?.data?.teamPlayers ||
    result?.data ||
    result?.playerUploads ||
    result?.teamPlayers ||
    result;

  return Array.isArray(rows) ? rows : [];
};

const extractFiles = (fileField: any): File[] => {
  if (!fileField) return [];
  if (fileField instanceof File) return [fileField];
  if (Array.isArray(fileField) || fileField instanceof FileList) {
    return Array.from(fileField).filter((file): file is File => file instanceof File);
  }
  if (typeof fileField === "object" && fileField["0"] instanceof File) {
    return Array.from(fileField as FileList).filter(
      (file): file is File => file instanceof File,
    );
  }
  return [];
};

const usePlayerUploadController = () => {
  const navigate = useNavigate();
  const [playerUploads, setPlayerUploads] = useState<PlayerUploadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlayerUploads = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPlayerUploadsApi();
      setPlayerUploads(getResponseRows(result).map(normalizePlayerUpload));
    } catch (err: any) {
      setError(err?.message || "Failed to fetch player uploads");
    } finally {
      setLoading(false);
    }
  };

  const buildPlayerUploadFormData = (section: any) => {
    const formData = new FormData();
    formData.append("teamId", section.teamId || "");

    extractFiles(section.playerPhotos).forEach((photoFile) => {
      formData.append("player_pic", photoFile);
    });

    return formData;
  };

  const handleCreatePlayerUploads = async (data: any) => {
    try {
      if (!data?.sections || !Array.isArray(data.sections)) return;

      setLoading(true);
      setError(null);

      const savedTeamIds: string[] = [];

      for (const section of data.sections) {
        await createPlayerUploadApi(buildPlayerUploadFormData(section));
        savedTeamIds.push(section.teamId);
      }

      localStorage.setItem(
        "playerUploadTeamIds",
        JSON.stringify(savedTeamIds.filter(Boolean)),
      );

      navigate("/player-profile");
    } catch (err: any) {
      setError(err?.message || "Failed to save player uploads");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayerUpload = async (
    playerUploadId: string | number,
    section: any,
  ) => {
    try {
      setLoading(true);
      setError(null);
      await updatePlayerUploadApi(
        playerUploadId,
        buildPlayerUploadFormData(section),
      );
      await getPlayerUploads();
    } catch (err: any) {
      setError(err?.message || "Failed to update player upload");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayerUpload = async (playerUploadId: string | number) => {
    try {
      setLoading(true);
      setError(null);
      await deletePlayerUploadApi(playerUploadId);
      await getPlayerUploads();
    } catch (err: any) {
      setError(err?.message || "Failed to delete player upload");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPlayerUploads();
  }, []);

  return {
    createPlayerUploads: handleCreatePlayerUploads,
    updatePlayerUpload: handleUpdatePlayerUpload,
    deletePlayerUpload: handleDeletePlayerUpload,
    getPlayerUploads,
    playerUploads,
    loading,
    error,
  };
};

export default usePlayerUploadController;
