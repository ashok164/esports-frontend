import React, { useEffect, useState } from "react";
import { useProjectTheme } from "../../Theme";
import {
  getCircleAnalysisApi,
  subscribeCircleAnalysisUpdates,
} from "../Repository/remote";
import { CircleAnalysisResponse } from "../types";
import CircleTimeline from "./Component/CircleDesign";

const CircleAnalysis = () => {
  const { isLoading: isThemeLoading } = useProjectTheme();
  const [analysis, setAnalysis] = useState<CircleAnalysisResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCircleAnalysisApi()
      .then((response) => {
        if (isMounted) setAnalysis(response);
      })
      .catch((err) => {
        console.log("Failed to load circle analysis:", err);
      });

    const unsubscribe = subscribeCircleAnalysisUpdates((response) => {
      setAnalysis(response);
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
