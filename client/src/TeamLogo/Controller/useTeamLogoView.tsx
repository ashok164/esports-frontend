import React, { useEffect, useState } from "react";
import { getTeamLogo } from "../Repository/remote";

const useTeamLogoView = () => {
  const [teamLogoData, setTeamLogoData] = useState<any>();
  const getLogoData = async () => {
    try {
      const result = await getTeamLogo();
      setTeamLogoData(result);
    } catch (e) {}
  };

  useEffect(() => {
    getLogoData();
  }, []);
  return {
    teamLogoData,
  };
};

export default useTeamLogoView;
