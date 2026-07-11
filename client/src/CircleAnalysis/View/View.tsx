import React, { useEffect, useState } from "react";
import { useProjectTheme } from "../../Theme";
import {
  buildCircleAnalysisFromTeams,
  getCircleAnalysisApi,
  getCircleAnalysisTeamsApi,
  subscribeCircleAnalysisUpdates,
} from "../Repository/remote";
import { CircleAnalysisResponse } from "../types";
import CircleTimeline from "./Component/CircleDesign";

const CircleAnalysis = () => {
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [analysis, setAnalysis] = useState<CircleAnalysisResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getCircleAnalysisTeamsApi(), getCircleAnalysisApi()])
      .then(([teamRows, savedResponse]) => {
        if (!isMounted) return;
        setAnalysis(
          teamRows.length
            ? buildCircleAnalysisFromTeams(teamRows, savedResponse)
            : savedResponse,
        );
      })
      .catch((err) => {
        console.log("Failed to load circle analysis:", err);
      });

    const unsubscribe = subscribeCircleAnalysisUpdates(async (response) => {
      try {
        const teamRows = await getCircleAnalysisTeamsApi();
        setAnalysis(
          teamRows.length
            ? buildCircleAnalysisFromTeams(teamRows, response)
            : response,
        );
      } catch {
        setAnalysis(response);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (isThemeLoading) return null;

  return (
    <>
      <CircleTimeline circles={analysis?.circles} teams={analysis?.teams || []} />
    </>
  );
};

export default CircleAnalysis;
