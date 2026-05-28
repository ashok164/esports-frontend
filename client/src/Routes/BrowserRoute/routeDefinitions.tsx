import React from "react";
import BroadcastThemeView from "../../BroadcastTheme/View";
import CircleAnalysis from "../../CircleAnalysis/View";
import CircleAnalysisAdmin from "../../CircleAnalysis/View/CircleAnalysisAdmin";
import GameAssetUploadView from "../../GameAssetUpload/View";
import GameDetailsView from "../../GameDetails/View";
import ViewCharacters from "../../GameAssetUpload/View/ViewCharacters";
import ViewEquipment from "../../GameAssetUpload/View/ViewEquipment";
import ViewRoles from "../../GameAssetUpload/View/ViewRoles";
import ViewSkills from "../../GameAssetUpload/View/ViewSkills";
import ViewWeapons from "../../GameAssetUpload/View/ViewWeapons";
import LastTeamNotification from "../../LastFourTeams/View/LastTeamNotification";
import LiveStandingsView from "../../LiveStandingsTable/View";
import LoginView, { RegisterView } from "../../Auth/View";
import MatchTeamMappingsView from "../../MatchTeamMappings/View";
import MatchNumber from "../../MatchNumber/View";
import PlayerUploadProfile from "../../PlayerUpload/View/PlayerUploadProfile";
import PlayerUploadView from "../../PlayerUpload/View";
import OverallResultView from "../../Result/view/OverallResultView";
import ResultBroadcastView from "../../Result/view/ResultBroadcastView";
import RouteNavigator from "../RouteNavigator";
import TeamEliminatedView from "../../TeamEliminated/View";
import TeamRecordTable from "../../TeamRecordTable/View";
import ViewTeamLogo from "../../TeamLogo/View";

export type AppRouteDefinition = {
  path: string;
  element: React.ReactElement;
  isBroadcast?: boolean;
  isProtected?: boolean;
};

export const appRouteDefinitions: AppRouteDefinition[] = [
  { path: "/login", element: <LoginView /> },
  { path: "/register", element: <RegisterView /> },
  { path: "/routes", element: <RouteNavigator />, isProtected: true },
  { path: "/broadcast-theme", element: <BroadcastThemeView />, isProtected: true },
  { path: "/live-standings", element: <LiveStandingsView />, isBroadcast: true },
  { path: "/team-eliminated", element: <TeamEliminatedView />, isBroadcast: true },
  { path: "/last-four-teams", element: <LastTeamNotification />, isBroadcast: true },
  { path: "/match-number", element: <MatchNumber />, isBroadcast: true },
  { path: "/circle-analysis", element: <CircleAnalysis />, isBroadcast: true },
  { path: "/circle-analysis-control", element: <CircleAnalysisAdmin />, isProtected: true },
  { path: "/team-record", element: <TeamRecordTable />, isProtected: true },
  { path: "/team-logo", element: <ViewTeamLogo />, isProtected: true },
  { path: "/player-upload", element: <PlayerUploadView />, isProtected: true },
  { path: "/player-profile", element: <PlayerUploadProfile />, isProtected: true },
  { path: "/game-asset-upload", element: <GameAssetUploadView />, isProtected: true },
  { path: "/game-details", element: <GameDetailsView />, isProtected: true },
  { path: "/match-team-mappings", element: <MatchTeamMappingsView />, isProtected: true },
  { path: "/result", element: <ResultBroadcastView />, isBroadcast: true },
  { path: "/overall-result", element: <OverallResultView />, isBroadcast: true },
  { path: "/view-weapons", element: <ViewWeapons />, isProtected: true },
  { path: "/view-characters", element: <ViewCharacters />, isProtected: true },
  { path: "/view-skills", element: <ViewSkills />, isProtected: true },
  { path: "/view-roles", element: <ViewRoles />, isProtected: true },
  { path: "/view-equipment", element: <ViewEquipment />, isProtected: true },
];

export const broadcastRoutePaths = appRouteDefinitions
  .filter((route) => route.isBroadcast)
  .map((route) => route.path);
