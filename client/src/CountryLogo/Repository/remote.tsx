import http from "../../AxiosFile/axios";
import {
  CREATE_COUNTRY_LOGO,
  DELETE_COUNTRY_LOGO,
  GET_COUNTRY_LOGOS,
  UPDATE_COUNTRY_LOGO,
} from "../../Routes/ApiRoutes/apiRoutes";

export type CountryLogo = {
  id: number | string;
  name: string;
  countryLogo: string;
  path?: string;
  filename?: string;
  created_at?: string;
  updated_at?: string;
};

export const getCountryLogosApi = async (): Promise<CountryLogo[]> => {
  const response = await http.get(GET_COUNTRY_LOGOS);
  return response?.data?.data || [];
};

export const createCountryLogoApi = async (data: FormData) => {
  const response = await http.post(CREATE_COUNTRY_LOGO, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response?.data;
};

export const updateCountryLogoApi = async (id: string | number, data: FormData) => {
  const response = await http.put(UPDATE_COUNTRY_LOGO(id), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response?.data;
};

export const deleteCountryLogoApi = async (id: string | number) => {
  const response = await http.delete(DELETE_COUNTRY_LOGO(id));
  return response?.data;
};
