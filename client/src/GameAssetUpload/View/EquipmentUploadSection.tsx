import AssetUploadSection from "../Components/AssetUploadSection";
import {
  CREATE_EQUIPMENT_UPLOAD,
  DELETE_EQUIPMENT_UPLOAD,
  GET_EQUIPMENT_UPLOADS,
  UPDATE_EQUIPMENT_UPLOAD,
} from "../../Routes/ApiRoutes/apiRoutes";

const EquipmentUploadSection = () => (
  <AssetUploadSection
    title="Equipment Upload"
    note="Bulk upload equipment images now, then add IDs and names later through update."
    nameLabel="Equipment Name"
    codeLabel="Equipment ID"
    createUrl={CREATE_EQUIPMENT_UPLOAD}
    getUrl={GET_EQUIPMENT_UPLOADS}
    updateUrl={UPDATE_EQUIPMENT_UPLOAD}
    deleteUrl={DELETE_EQUIPMENT_UPLOAD}
  />
);

export default EquipmentUploadSection;
