import AssetGalleryView from "../Components/AssetGalleryView";
import { GET_SKILL_UPLOADS } from "../../Routes/ApiRoutes/apiRoutes";

const ViewSkills = () => (
  <AssetGalleryView
    title="Skill Gallery"
    note="Review uploaded skill IDs, names, and images."
    countLabel="Skills"
    idLabel="ID"
    getUrl={GET_SKILL_UPLOADS}
  />
);

export default ViewSkills;
