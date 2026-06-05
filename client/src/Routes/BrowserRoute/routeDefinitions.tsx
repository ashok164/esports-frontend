import React from "react";
import BooyahTeamStatsPage from "../../Result/view/BooyahTeamStatsPage";
import BroadcastThemeView from "../../BroadcastTheme/View";
import CircleAnalysis from "../../CircleAnalysis/View";
import CircleAnalysisAdmin from "../../CircleAnalysis/View/CircleAnalysisAdmin";
import CountryLogoView from "../../CountryLogo/View";
import GameAssetUploadView from "../../GameAssetUpload/View";
import GameDetailsView from "../../GameDetails/View";
import ViewCharacters from "../../GameAssetUpload/View/ViewCharacters";
import ViewEquipment from "../../GameAssetUpload/View/ViewEquipment";
import ViewRoles from "../../GameAssetUpload/View/ViewRoles";
import ViewSkills from "../../GameAssetUpload/View/ViewSkills";
import ViewWeapons from "../../GameAssetUpload/View/ViewWeapons";
import LastTeamNotification from "../../LastFourTeams/View/LastTeamNotification";
import LandingView from "../../Landing/view";
import LiveStandingsView from "../../LiveStandingsTable/View";
import LoginView, { RegisterView } from "../../Auth/View";
import MatchNumber from "../../MatchNumber/View";
import MvpPage from "../../Result/view/MvpPage";
import PlayersModeView from "../../PlayersMode/View";
import PlayerUploadProfile from "../../PlayerUpload/View/PlayerUploadProfile";
import PlayerUploadView from "../../PlayerUpload/View";
import OverallResultView from "../../Result/view/OverallResultView";
import ResultJsonControlView from "../../ResultJsonControl/View";
import ResultBroadcastView from "../../Result/view/ResultBroadcastView";
import ResultViewerPage from "../../Result/view/ResultViewerPage";
import RouteNavigator from "../RouteNavigator";
import TeamEliminatedView from "../../TeamEliminated/View";
import TeamRecordTable from "../../TeamRecordTable/View";
import { FullTeamBannerView, NotificationTeamBannerView } from "../../TeamBanner/View";
import TopFraggersPage from "../../Result/view/TopFraggersPage";
import TournamentManagerView, { TournamentRolesView } from "../../Tournaments/View";
import TournamentAssetsView from "../../TournamentAssets/View";
import TournamentLogoView, { TournamentLogoBroadcastView } from "../../TournamentLogo/View";
import ViewTeamLogo from "../../TeamLogo/View";
import ZoneShrinkControlView, { ZoneShrinkBroadcastView } from "../../ZoneShrink/View";

export type AppRouteDefinition = {
  path: string;
  element: React.ReactElement;
  isBroadcast?: boolean;
  isProtected?: boolean;
};

export const appRouteDefinitions: AppRouteDefinition[] = [
  { path: "/", element: <LandingView /> },
  { path: "/login", element: <LoginView /> },
  { path: "/register", element: <RegisterView /> },
  { path: "/routes", element: <RouteNavigator />, isProtected: true },
  { path: "/tournaments", element: <TournamentManagerView />, isProtected: true },
  { path: "/roles", element: <TournamentRolesView />, isProtected: true },
  { path: "/broadcast-theme", element: <BroadcastThemeView />, isProtected: true },
  { path: "/live-standings", element: <LiveStandingsView />, isBroadcast: true },
  { path: "/players-mode", element: <PlayersModeView />, isBroadcast: true },
  { path: "/team-eliminated", element: <TeamEliminatedView />, isBroadcast: true },
  { path: "/last-four-teams", element: <LastTeamNotification />, isBroadcast: true },
  { path: "/match-number", element: <MatchNumber />, isBroadcast: true },
  { path: "/zone-shrink", element: <ZoneShrinkBroadcastView />, isBroadcast: true },
  { path: "/circle-analysis", element: <CircleAnalysis />, isBroadcast: true },
  { path: "/zone-shrink-control", element: <ZoneShrinkControlView />, isProtected: true },
  { path: "/circle-analysis-control", element: <CircleAnalysisAdmin />, isProtected: true },
  { path: "/team-record", element: <TeamRecordTable />, isProtected: true },
  { path: "/country-logo", element: <CountryLogoView />, isProtected: true },
  { path: "/team-logo", element: <ViewTeamLogo />, isProtected: true },
  { path: "/full-team-banner", element: <FullTeamBannerView />, isProtected: true },
  { path: "/notification-team-banner", element: <NotificationTeamBannerView />, isProtected: true },
  { path: "/tournament-logo", element: <TournamentLogoView />, isProtected: true },
  { path: "/tournament-logo-live", element: <TournamentLogoBroadcastView />, isBroadcast: true },
  { path: "/player-upload", element: <PlayerUploadView />, isProtected: true },
  { path: "/player-profile", element: <PlayerUploadProfile />, isProtected: true },
  { path: "/game-asset-upload", element: <GameAssetUploadView />, isProtected: true },
  { path: "/tournament-assets", element: <TournamentAssetsView />, isProtected: true },
  { path: "/game-details", element: <GameDetailsView />, isProtected: true },
  { path: "/result-json-control", element: <ResultJsonControlView />, isProtected: true },
  { path: "/result-viewer", element: <ResultViewerPage />, isProtected: true },
  { path: "/result-mvp", element: <MvpPage />, isProtected: true },
  { path: "/result-booyah-team-stats", element: <BooyahTeamStatsPage />, isProtected: true },
  { path: "/result-top-fraggers", element: <TopFraggersPage />, isProtected: true },
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
