import AssetUploadSection from "../Components/AssetUploadSection";
import {
  CREATE_ROLE_UPLOAD,
  DELETE_ROLE_UPLOAD,
  GET_ROLE_UPLOADS,
  UPDATE_ROLE_UPLOAD,
} from "../../Routes/ApiRoutes/apiRoutes";

const RoleUploadSection = () => (
  <AssetUploadSection
    title="Role Upload"
    note="Bulk upload role images now, then add IDs and names later through update."
    nameLabel="Role Name"
    codeLabel="Role ID"
    createUrl={CREATE_ROLE_UPLOAD}
    getUrl={GET_ROLE_UPLOADS}
    updateUrl={UPDATE_ROLE_UPLOAD}
    deleteUrl={DELETE_ROLE_UPLOAD}
  />
);

export default RoleUploadSection;
