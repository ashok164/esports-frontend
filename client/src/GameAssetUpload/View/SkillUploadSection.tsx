import AssetUploadSection from "../Components/AssetUploadSection";
import {
  CREATE_SKILL_UPLOAD,
  DELETE_SKILL_UPLOAD,
  GET_SKILL_UPLOADS,
  UPDATE_SKILL_UPLOAD,
} from "../../Routes/ApiRoutes/apiRoutes";

const SkillUploadSection = () => (
  <AssetUploadSection
    title="Skill Upload"
    note="Bulk upload skill images now, then add IDs and names later through update."
    nameLabel="Skill Name"
    codeLabel="Skill ID"
    createUrl={CREATE_SKILL_UPLOAD}
    getUrl={GET_SKILL_UPLOADS}
    updateUrl={UPDATE_SKILL_UPLOAD}
    deleteUrl={DELETE_SKILL_UPLOAD}
  />
);

export default SkillUploadSection;
