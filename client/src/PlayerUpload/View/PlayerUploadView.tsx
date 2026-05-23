import PlayerUploadTable from "../Components/PlayerUploadTable";
import usePlayerUploadController from "../Controller/usePlayerUploadController";

const PlayerUploadView = () => {
  const { createPlayerUploads, error, loading, playerUploads } =
    usePlayerUploadController();
  return (
    <PlayerUploadTable
      createPlayerUploads={createPlayerUploads}
      playerUploads={playerUploads}
      error={error}
      loading={loading}
    />
  );
};

export default PlayerUploadView;
