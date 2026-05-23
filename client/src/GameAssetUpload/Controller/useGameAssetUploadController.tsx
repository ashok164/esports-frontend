import { useState } from "react";
import {
  AssetUploadRow,
  createAssetUploadApi,
  deleteAssetUploadApi,
  updateAssetUploadApi,
} from "../Repository/remote";

type AssetUploadApiConfig = {
  createUrl: string;
  updateUrl: (id: string | number) => string;
  deleteUrl: (id: string | number) => string;
};

const useGameAssetUploadController = ({
  createUrl,
  updateUrl,
  deleteUrl,
}: AssetUploadApiConfig) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const saveAssets = async (rows: AssetUploadRow[]) => {
    const createRows = rows.filter((row) => row.operation !== "update");
    const updateRows = rows.filter(
      (row) => row.operation === "update" && row.recordId,
    );
    let createResponse: any = null;
    const updateResponses: any[] = [];

    setIsSaving(true);
    setError(null);
    setUploadProgress(0);
    setSuccessMessage(null);

    try {
      if (createRows.length > 0) {
        createResponse = await createAssetUploadApi(createUrl, createRows, (progress) => {
          setUploadProgress(updateRows.length > 0 ? Math.round(progress / 2) : progress);
        });
      }

      for (let index = 0; index < updateRows.length; index += 1) {
        const updateResponse = await updateAssetUploadApi(updateUrl, updateRows[index], (progress) => {
          const baseProgress = createRows.length > 0 ? 50 : 0;
          const updateShare = createRows.length > 0 ? 50 : 100;
          const rowProgress =
            ((index + progress / 100) / Math.max(updateRows.length, 1)) *
            updateShare;
          setUploadProgress(Math.round(baseProgress + rowProgress));
        });
        updateResponses.push(updateResponse);
      }

      setUploadProgress(100);
      setSuccessMessage("Upload saved successfully.");
      return { createResponse, updateResponses };
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save upload.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAsset = async (row: AssetUploadRow) => {
    setIsSaving(true);
    setError(null);
    setUploadProgress(0);
    setSuccessMessage(null);

    try {
      const response = row.operation === "update" && row.recordId
        ? await updateAssetUploadApi(updateUrl, row, setUploadProgress)
        : await createAssetUploadApi(createUrl, [row], setUploadProgress);

      setUploadProgress(100);
      setSuccessMessage("Row saved successfully.");
      return response;
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save row.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAsset = async (recordId: string | number) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await deleteAssetUploadApi(deleteUrl, recordId);
      setSuccessMessage("Row deleted successfully.");
      return response;
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete row.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    deleteAsset,
    error,
    isSaving,
    saveAsset,
    saveAssets,
    successMessage,
    uploadProgress,
  };
};

export default useGameAssetUploadController;
