import { useEffect, useState } from "react";
import {
  AssetGalleryRecord,
  getAssetUploadsApi,
} from "../Repository/remote";

const useGameAssetGalleryController = (getUrl: string) => {
  const [records, setRecords] = useState<AssetGalleryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAssetUploadsApi(getUrl);
      setRecords(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load assets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [getUrl]);

  return {
    error,
    isLoading,
    records,
    refreshRecords: loadRecords,
  };
};

export default useGameAssetGalleryController;
