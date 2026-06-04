import PlayerUploadTable from "../Components/PlayerUploadTable";
import usePlayerUploadController from "../Controller/usePlayerUploadController";

const PlayerUploadView = () => {
  const { createPlayerUploads, error, loading, playerUploads, tournamentAssetOptions } =
    usePlayerUploadController();
  return (
    <PlayerUploadTable
      createPlayerUploads={createPlayerUploads}
      playerUploads={playerUploads}
      error={error}
      loading={loading}
      tournamentAssetOptions={tournamentAssetOptions}
    />
  );
};

export default PlayerUploadView;
