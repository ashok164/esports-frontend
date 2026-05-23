import AssetUploadSection from "../Components/AssetUploadSection";
import {
  CREATE_CHARACTER_UPLOAD,
  DELETE_CHARACTER_UPLOAD,
  GET_CHARACTER_UPLOADS,
  UPDATE_CHARACTER_UPLOAD,
} from "../../Routes/ApiRoutes/apiRoutes";

const CharacterUploadSection = () => (
  <AssetUploadSection
    title="Bulk Character Upload"
    note="Bulk upload character images now, then add IDs and names later through update."
    nameLabel="Character Name"
    codeLabel="Character ID"
    createUrl={CREATE_CHARACTER_UPLOAD}
    getUrl={GET_CHARACTER_UPLOADS}
    updateUrl={UPDATE_CHARACTER_UPLOAD}
    deleteUrl={DELETE_CHARACTER_UPLOAD}
  />
);

export default CharacterUploadSection;
