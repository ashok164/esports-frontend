import AssetGalleryView from "../Components/AssetGalleryView";
import { GET_ROLE_UPLOADS } from "../../Routes/ApiRoutes/apiRoutes";

const ViewRoles = () => (
  <AssetGalleryView
    title="Role Gallery"
    note="Review uploaded role IDs, names, and images."
    countLabel="Roles"
    idLabel="ID"
    getUrl={GET_ROLE_UPLOADS}
  />
);

export default ViewRoles;
