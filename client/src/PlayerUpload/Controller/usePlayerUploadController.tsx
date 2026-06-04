import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createPlayerUploadApi,
  deletePlayerByUidApi,
  deleteTeamPlayersApi,
  getPlayerByUidApi,
  getPlayerUploadsApi,
  getTeamPlayersByTeamIdApi,
  updatePlayerByUidApi,
  updateTeamPlayersApi,
} from "../Repository/remote";
import { API_BASE_URL } from "../../Routes/ApiRoutes/apiRoutes";
import {
  getTournamentAssetName,
  getTournamentAssetUrl,
  getTournamentAssetsApi,
} from "../../TournamentAssets/Repository/remote";

export interface PlayerUploadRecord {
  id?: string | number;
  teamId: string;
  teamName?: string;
  playerPhotos?: string[];
  players?: PlayerUploadPlayer[];
  countryLogo?: any;
  teamLogo?: any;
}

export interface PlayerUploadPlayer {
  uid?: string;
  playerName?: string;
  playerPic?: string;
  cameraLink?: string;
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

const normalizePlayers = (record: any): PlayerUploadPlayer[] => {
  const flatPlayerUid =
    record?.uid ||
    record?.playerUid ||
    record?.player_uid ||
    record?.player_id ||
    record?.playerId ||
    "";
  const flatPlayerName =
    record?.playerName ||
    record?.player_name ||
    record?.player ||
    record?.name ||
    record?.username ||
    "";
  const flatPlayerPic =
    record?.playerPic ||
    record?.player_pic ||
    record?.playerPhoto ||
    record?.player_photo ||
    record?.photo ||
    record?.image ||
    "";
  const flatCameraLink =
    record?.cameraLink ||
    record?.camera_link ||
    record?.camera ||
    record?.link ||
    "";

  if (flatPlayerUid || flatPlayerName || flatPlayerPic || flatCameraLink) {
    return [
      {
        uid: String(flatPlayerUid),
        playerName: flatPlayerName || "Unnamed Player",
        playerPic: toImageUrl(flatPlayerPic),
        cameraLink: flatCameraLink,
      },
    ];
  }

  const rawPlayers =
    record?.players ||
    record?.playerDetails ||
    record?.player_details ||
    record?.teamPlayers ||
    record?.team_players ||
    [];

  const parsedPlayers =
    typeof rawPlayers === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(rawPlayers);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : rawPlayers;

  if (!Array.isArray(parsedPlayers)) {
    return [];
  }

  return parsedPlayers.map((player: any, index: number) => ({
    uid: String(
      player?.uid ||
        player?.playerUid ||
        player?.player_uid ||
        player?.player_id ||
        player?.playerId ||
        "",
    ),
    playerName:
      player?.playerName ||
      player?.player_name ||
      player?.player ||
      player?.name ||
      player?.username ||
      `Player ${index + 1}`,
    playerPic: toImageUrl(
      player?.playerPic ||
        player?.player_pic ||
        player?.playerPhoto ||
        player?.player_photo ||
        player?.photo ||
        player?.image ||
        "",
    ),
    cameraLink:
      player?.cameraLink ||
      player?.camera_link ||
      player?.link ||
      player?.camera ||
      "",
  }));
};

const normalizePlayerUpload = (
  record: any,
  index: number,
): PlayerUploadRecord => ({
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
  players: normalizePlayers(record),
  countryLogo: record?.countryLogo,
  teamLogo: record?.teamLogo,
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
    return Array.from(fileField).filter(
      (file): file is File => file instanceof File,
    );
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
  const [tournamentAssetOptions, setTournamentAssetOptions] = useState<
    Array<{ name: string; url: string }>
  >([]);

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
    formData.append("team_id", section.teamId || "");

    const players = Array.isArray(section.players) ? section.players : [];
    const playerPayload = players.map((player: any, index: number) => {
      const uid = player?.uid || "";
      const playerName = player?.playerName || "";
      const cameraLink = player?.cameraLink || "";
      const playerPicUrl = String(player?.playerPicUrl || "").trim();

      formData.append(`players[${index}][uid]`, uid);
      formData.append(`players[${index}][playerName]`, playerName);
      formData.append(`players[${index}][cameraLink]`, cameraLink);
      formData.append(`players[${index}][player_pic]`, playerPicUrl);
      formData.append("playerUid", uid);
      formData.append("playerName", playerName);
      formData.append("cameraLink", cameraLink);
      if (playerPicUrl) formData.append("player_pic", playerPicUrl);

      extractFiles(player?.playerPic).forEach((photoFile) => {
        formData.append("player_pic", photoFile);
      });

      return {
        uid,
        playerName,
        cameraLink,
        playerPic: playerPicUrl,
        player_pic: playerPicUrl,
      };
    });

    formData.append("players", JSON.stringify(playerPayload));

    extractFiles(section.playerPhotos).forEach((photoFile) => {
      formData.append("player_pic", photoFile);
    });

    return formData;
  };

  const buildSinglePlayerFormData = (player: any) => {
    const formData = new FormData();
    const uid = player?.uid || player?.playerUid || player?.player_uid || "";
    const originalUid = player?.originalUid || "";
    const playerName = player?.playerName || player?.player_name || "";
    const cameraLink = player?.cameraLink || player?.camera_link || "";

    formData.append("uid", uid);
    formData.append("originalUid", originalUid);
    formData.append("original_uid", originalUid);
    formData.append("playerUid", uid);
    formData.append("player_uid", uid);
    formData.append("playerId", uid);
    formData.append("player_id", uid);
    formData.append("playerName", playerName);
    formData.append("player_name", playerName);
    formData.append("name", playerName);
    formData.append("cameraLink", cameraLink);
    formData.append("camera_link", cameraLink);
    formData.append("camera", cameraLink);

    extractFiles(player?.playerPic).forEach((photoFile) => {
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
      await updateTeamPlayersApi(
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

  const handleDeletePlayerUpload = async (teamId: string | number) => {
    try {
      setLoading(true);
      setError(null);
      await deleteTeamPlayersApi(teamId);
      await getPlayerUploads();
    } catch (err: any) {
      setError(err?.message || "Failed to delete player upload");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayerByUid = async (
    playerUid: string | number,
    player: any,
  ) => {
    try {
      setLoading(true);
      setError(null);
      await updatePlayerByUidApi(playerUid, buildSinglePlayerFormData(player));
      await getPlayerUploads();
    } catch (err: any) {
      setError(err?.message || "Failed to update player");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayerByUid = async (playerUid: string | number) => {
    try {
      setLoading(true);
      setError(null);
      await deletePlayerByUidApi(playerUid);
      await getPlayerUploads();
    } catch (err: any) {
      setError(err?.message || "Failed to delete player");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetTeamPlayersByTeamId = async (teamId: string | number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTeamPlayersByTeamIdApi(teamId);
      const rows = getResponseRows(result).map(normalizePlayerUpload);
      setPlayerUploads(rows);
      return rows;
    } catch (err: any) {
      setError(err?.message || "Failed to fetch team players");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleGetPlayerByUid = async (playerUid: string | number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPlayerByUidApi(playerUid);
      return normalizePlayers({ players: [result?.data || result] })[0];
    } catch (err: any) {
      setError(err?.message || "Failed to fetch player");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPlayerUploads();
    getTournamentAssetsApi()
      .then((assets) => {
        setTournamentAssetOptions(
          assets
            .map((asset) => ({
              name: getTournamentAssetName(asset),
              url: getTournamentAssetUrl(asset),
            }))
            .filter((asset) => asset.url),
        );
      })
      .catch(() => setTournamentAssetOptions([]));
  }, []);

  return {
    createPlayerUploads: handleCreatePlayerUploads,
    updatePlayerUpload: handleUpdatePlayerUpload,
    deletePlayerUpload: handleDeletePlayerUpload,
    updatePlayerByUid: handleUpdatePlayerByUid,
    deletePlayerByUid: handleDeletePlayerByUid,
    getTeamPlayersByTeamId: handleGetTeamPlayersByTeamId,
    getPlayerByUid: handleGetPlayerByUid,
    getPlayerUploads,
    playerUploads,
    tournamentAssetOptions,
    loading,
    error,
  };
};

export default usePlayerUploadController;
