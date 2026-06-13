import { useEffect } from "react";
import { getGameDetailsApi } from "./Repository/remote";
import {
  normalizeGameDetail,
  publishActiveGameDetails,
} from "./gameDetailsState";

const REFRESH_INTERVAL_MS = 15000;

const useSyncGameDetails = () => {
  useEffect(() => {
    let isMounted = true;

    const syncGameDetails = async () => {
      try {
        const response = await getGameDetailsApi();
        if (!isMounted || !Array.isArray(response)) return;

        publishActiveGameDetails(response.map(normalizeGameDetail));
      } catch {
        // Keep the last known local snapshot if the shared API is temporarily unavailable.
      }
    };

    syncGameDetails();
    const intervalId = window.setInterval(syncGameDetails, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", syncGameDetails);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncGameDetails);
    };
  }, []);
};

export default useSyncGameDetails;
