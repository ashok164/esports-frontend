import AssetGalleryView from "../Components/AssetGalleryView";
import { GET_WEAPON_UPLOADS } from "../../Routes/ApiRoutes/apiRoutes";

const ViewWeapons = () => (
  <AssetGalleryView
    title="Weapon Gallery"
    note="Review uploaded weapon IDs, names, and images."
    countLabel="Weapons"
    idLabel="ID"
    getUrl={GET_WEAPON_UPLOADS}
  />
);

export default ViewWeapons;
