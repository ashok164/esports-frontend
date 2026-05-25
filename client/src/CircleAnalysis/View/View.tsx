import React from "react";
import { useProjectTheme } from "../../Theme";
import CircleTimeline from "./Component/CircleDesign";

const CircleAnalysis = () => {
  const { isLoading: isThemeLoading } = useProjectTheme();

  if (isThemeLoading) return null;

  return (
    <>
      <CircleTimeline />
    </>
  );
};

export default CircleAnalysis;
