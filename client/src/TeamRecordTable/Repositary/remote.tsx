import http from "../../AxiosFile/axios";
import {
  CREATE_TEAM_TABLE,
  DELETE_TEAM_DETAILS,
  GET_TEAM_DETAILS,
  UPDATE_TEAM_DETAILS,
} from "../../Routes/ApiRoutes/apiRoutes";

export const createTeamTableApi = async (data: FormData) => {
  try {
    const apiCall = await http.post(CREATE_TEAM_TABLE, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return apiCall;
  } catch (err) {
    console.log("API ERROR:", err);
    throw err;
  }
};

export const getTeamTableApi = async () => {
  const response = await http.get(GET_TEAM_DETAILS);
  return response?.data?.data || [];
};

export const updateTeamTableApi = async (id: string | number, data: FormData) => {
  const response = await http.put(UPDATE_TEAM_DETAILS(id), data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response;
};

export const deleteTeamTableApi = async (id: string | number) => {
  const response = await http.delete(DELETE_TEAM_DETAILS(id));
  return response;
};
