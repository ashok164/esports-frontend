import React from "react";
import TeamBannerManager from "./TeamBannerManager";

const NotificationTeamBannerView: React.FC = () => (
  <TeamBannerManager
    kind="notification"
    title="Notification Team Banner"
    description="Upload, edit, and delete notification team banner images."
  />
);

export default NotificationTeamBannerView;
