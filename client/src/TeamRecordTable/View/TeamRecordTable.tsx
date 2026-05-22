import TeamHookFormTable from "../Components/table";
import useTeamRecordController from "../Controller/useTeamRecordController";

const TeamRecordTable = () => {
  const {
    createTeamTable,
    updateTeamTable,
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
