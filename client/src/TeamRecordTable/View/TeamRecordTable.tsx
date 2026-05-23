import TeamHookFormTable from "../Components/table";
import useTeamRecordController from "../Controller/useTeamRecordController";

const TeamRecordTable = () => {
  const {
    createTeamTable,
    updateTeamTable,
    reorderTeamTable,
    deleteTeamTable,
    openTeamLogos,
    teams,
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
        openTeamLogos={openTeamLogos}
        teams={teams}
        isLoading={isLoading}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
};

export default TeamRecordTable;
