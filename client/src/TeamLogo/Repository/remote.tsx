import http from "../../AxiosFile/axios";
import { GET_TEAM_DETAILS } from "../../Routes/ApiRoutes/apiRoutes";

export const getTeamLogo = async () => {
  const response = await http.get(GET_TEAM_DETAILS);
  return response?.data?.data
};
