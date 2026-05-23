import AssetUploadSection from "../Components/AssetUploadSection";
import {
  CREATE_WEAPON_UPLOAD,
  DELETE_WEAPON_UPLOAD,
  GET_WEAPON_UPLOADS,
  UPDATE_WEAPON_UPLOAD,
} from "../../Routes/ApiRoutes/apiRoutes";

const WeaponUploadSection = () => (
  <AssetUploadSection
    title="Weapon Upload"
    note="Bulk upload weapon images now, then add IDs and names later through update."
    nameLabel="Weapon Name"
    codeLabel="Weapon ID"
    createUrl={CREATE_WEAPON_UPLOAD}
    getUrl={GET_WEAPON_UPLOADS}
    updateUrl={UPDATE_WEAPON_UPLOAD}
    deleteUrl={DELETE_WEAPON_UPLOAD}
  />
);

export default WeaponUploadSection;
