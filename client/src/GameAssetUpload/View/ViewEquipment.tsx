import AssetGalleryView from "../Components/AssetGalleryView";
import { GET_EQUIPMENT_UPLOADS } from "../../Routes/ApiRoutes/apiRoutes";

const ViewEquipment = () => (
  <AssetGalleryView
    title="Equipment Gallery"
    note="Review uploaded equipment IDs, names, and images."
    countLabel="Equipment"
    idLabel="ID"
    getUrl={GET_EQUIPMENT_UPLOADS}
  />
);

export default ViewEquipment;
