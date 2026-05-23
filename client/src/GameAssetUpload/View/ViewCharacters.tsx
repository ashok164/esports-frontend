import AssetGalleryView from "../Components/AssetGalleryView";
import { GET_CHARACTER_UPLOADS } from "../../Routes/ApiRoutes/apiRoutes";

const ViewCharacters = () => (
  <AssetGalleryView
    title="Character Gallery"
    note="Review uploaded character IDs, names, and images."
    countLabel="Characters"
    idLabel="ID"
    getUrl={GET_CHARACTER_UPLOADS}
  />
);

export default ViewCharacters;
