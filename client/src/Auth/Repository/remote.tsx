import http from "../../AxiosFile/axios";
import {
  ASSIGN_USER_TOURNAMENT,
  GET_AUTH_ME,
  GET_AUTH_USERS,
  LOGIN_ADMIN,
  REGISTER_ADMIN,
  UPDATE_AUTH_USER,
} from "../../Routes/ApiRoutes/apiRoutes";
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
  message?: string;
  pendingApproval?: boolean;
  user?: AuthUser;
  data?: {
    token?: string;
    accessToken?: string;
    message?: string;
    pendingApproval?: boolean;
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

export const getAuthUsers = async () => {
  const response = await http.get(GET_AUTH_USERS);
  const users = response?.data?.data || response?.data?.users || response?.data || [];
  return Array.isArray(users) ? users as AuthUser[] : [];
};

export const updateAuthUser = async (
  id: string | number,
  payload: { role?: string; isActive?: boolean },
) => {
  const response = await http.patch(UPDATE_AUTH_USER(id), payload);
  return (response?.data?.user || response?.data?.data || response?.data) as AuthUser;
};

export const assignUserTournament = async (
  id: string | number,
  payload: { tournamentSlug: string; role?: string },
) => {
  const response = await http.post(ASSIGN_USER_TOURNAMENT(id), payload);
  return response?.data?.data || response?.data;
};
