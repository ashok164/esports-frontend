import TeamHookFormTable from "../Components/table";
import useTeamRecordController from "../Controller/useTeamRecordController";

const TeamRecordTable = () => {
  const {
    createTeamTable,
    updateTeamTable,
    reorderTeamTable,
    deleteTeamTable,
    togglePlayingTeam,
    openTeamLogos,
    teams,
    countryLogos,
    isLoading,
    isSaving,
    error,
  } = useTeamRecordController();
  return (
    <>
      <TeamHookFormTable
        createTeamTable={createTeamTable}
        updateTeamTable={updateTeamTable}
        reorderTeamTable={reorderTeamTable}
        deleteTeamTable={deleteTeamTable}
        togglePlayingTeam={togglePlayingTeam}
        openTeamLogos={openTeamLogos}
        teams={teams}
        countryLogos={countryLogos}
        isLoading={isLoading}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
};

export default TeamRecordTable;
