import http from "../../AxiosFile/axios";
import { GET_AUTH_ME, LOGIN_ADMIN, REGISTER_ADMIN } from "../../Routes/ApiRoutes/apiRoutes";
import { AuthUser } from "./authStorage";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  // username: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  accessToken?: string;
  user?: AuthUser;
  data?: {
    token?: string;
    accessToken?: string;
    user?: AuthUser;
  };
};

export type MeResponse = {
  user?: AuthUser;
  data?: {
    user?: AuthUser;
  };
};

export const loginAdmin = async (payload: LoginPayload) => {
  const response = await http.post(LOGIN_ADMIN, payload);
  return response.data as LoginResponse;
};

export const registerAdmin = async (payload: RegisterPayload) => {
  const response = await http.post(REGISTER_ADMIN, payload);
  return response.data as LoginResponse;
};

export const getCurrentUser = async () => {
  const response = await http.get(GET_AUTH_ME);
  return response.data as MeResponse;
};
