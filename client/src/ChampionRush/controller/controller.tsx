import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { useProjectTheme } from "../../Theme";

export default function useChampionRushController() {
  const { championRushTeams, loading } = useLiveStandingsController();
  const { broadcastSettings, isLoading } = useProjectTheme();
  return {
    teams: championRushTeams,
    loading: loading || isLoading,
    enabled: broadcastSettings.championRushEnabled,
  };
}
