import http from "../../AxiosFile/axios";
import { API_BASE_URL } from "../../Routes/ApiRoutes/apiRoutes";

export type AssetUploadRow = {
  operation?: "create" | "update";
  recordId?: string | number;
  name: string;
  code: string;
  description?: string;
  existingImageUrl?: string;
  image?: any;
  readOnly?: boolean;
  isShared?: boolean;
  sourceTournamentName?: string;
  sourceTournamentSlug?: string;
};

export type UploadProgressHandler = (progress: number) => void;

export type AssetGalleryRecord = {
  id?: string | number;
  _id?: string | number;
  assetId: string;
  name: string;
  imageUrl: string;
  description?: string;
  readOnly?: boolean;
  isShared?: boolean;
  sourceTournamentName?: string;
  sourceTournamentSlug?: string;
};

const toImageUrl = (path: string) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const getResponseRows = (result: any) => {
  const rows =
    result?.data?.data ||
    result?.data?.items ||
    result?.data?.records ||
    result?.data ||
    result?.items ||
    result?.records ||
    result;

  return Array.isArray(rows) ? rows : [];
};

const normalizeAssetRecord = (record: any, index: number): AssetGalleryRecord => {
  const image =
    record?.imageUrl ||
    record?.image_url ||
    record?.image ||
    record?.logo ||
    record?.icon ||
    record?.photo ||
    record?.weapon_image ||
    record?.character_image ||
    record?.skill_image ||
    record?.role_image ||
    record?.equipment_image ||
    "";

  return {
    id: record?.id,
    _id: record?._id,
    assetId: String(
      record?.assetId ||
        record?.asset_id ||
        record?.code ||
        record?.itemId ||
        record?.item_id ||
        record?.weaponId ||
        record?.characterId ||
        record?.skillId ||
        record?.roleId ||
        record?.equipmentId ||
        record?.id ||
        record?._id ||
        index + 1,
    ),
    name:
      record?.name ||
      record?.title ||
      record?.weaponName ||
      record?.characterName ||
      record?.skillName ||
      record?.roleName ||
      record?.equipmentName ||
      record?.weapon_name ||
      record?.character_name ||
      record?.skill_name ||
      record?.role_name ||
      record?.equipment_name ||
      "Unnamed",
    imageUrl: toImageUrl(image),
    description: record?.description || record?.note || "",
    readOnly: Boolean(record?.read_only || record?.readOnly || record?.is_shared || record?.isShared),
    isShared: Boolean(record?.is_shared || record?.isShared),
    sourceTournamentName: String(record?.source_tournament_name || record?.sourceTournamentName || ""),
    sourceTournamentSlug: String(record?.source_tournament_slug || record?.sourceTournamentSlug || ""),
  };
};

const extractFile = (fileField: any): File | null => {
  if (!fileField) return null;
  if (fileField instanceof File) return fileField;
  if (fileField instanceof FileList && fileField[0]) return fileField[0];
  if (Array.isArray(fileField) && fileField[0] instanceof File) return fileField[0];
  if (typeof fileField === "object" && fileField[0] instanceof File) {
    return fileField[0];
  }
  return null;
};

const buildAssetFormData = (rows: AssetUploadRow[]) => {
  const formData = new FormData();
  const payload = rows.map((row, index) => {
    const imageFile = extractFile(row.image);

    if (imageFile) {
      formData.append("images", imageFile);
      formData.append(`items[${index}][fileName]`, imageFile.name);
    }

    formData.append(`items[${index}][name]`, row.name || "");
    formData.append(`items[${index}][code]`, row.code || "");
    formData.append(`items[${index}][assetId]`, row.code || "");
    formData.append(`items[${index}][asset_id]`, row.code || "");
    formData.append(`items[${index}][description]`, row.description || "");

    return {
      name: row.name || "",
      code: row.code || "",
      assetId: row.code || "",
      asset_id: row.code || "",
      description: row.description || "",
      fileName: imageFile?.name || "",
    };
  });

  formData.append("items", JSON.stringify(payload));

  if (rows.length === 1) {
    const row = rows[0];
    formData.append("name", row.name || "");
    formData.append("code", row.code || "");
    formData.append("assetId", row.code || "");
    formData.append("asset_id", row.code || "");
    formData.append("description", row.description || "");

    const imageFile = extractFile(row.image);
    if (imageFile) formData.append("fileName", imageFile.name);
  }

  return formData;
};

export const createAssetUploadApi = async (
  createUrl: string,
  rows: AssetUploadRow[],
  onProgress?: UploadProgressHandler,
) => {
  const response = await http.post(createUrl, buildAssetFormData(rows), {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event: any) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

  return response;
};

export const updateAssetUploadApi = async (
  updateUrl: (id: string | number) => string,
  row: AssetUploadRow,
  onProgress?: UploadProgressHandler,
) => {
  if (!row.recordId) {
    throw new Error("Record ID is required for update");
  }

  const response = await http.put(updateUrl(row.recordId), buildAssetFormData([row]), {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event: any) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

  return response;
};

export const deleteAssetUploadApi = async (
  deleteUrl: (id: string | number) => string,
  recordId: string | number,
) => {
  const response = await http.delete(deleteUrl(recordId));
  return response;
};

export const getAssetUploadsApi = async (getUrl: string) => {
  const response = await http.get(getUrl);
  return getResponseRows(response).map(normalizeAssetRecord);
};
