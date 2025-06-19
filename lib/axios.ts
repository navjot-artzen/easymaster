import axios, { AxiosRequestHeaders, Method } from "axios";
interface apiProps {
  url: string;
  payload?: any;
  headers?: AxiosRequestHeaders;
  method: Method;
}
interface ApiError extends Error {
  statusCode?: number;
}
export const fetchApi = async ({ url, method, payload, headers }: apiProps) => {
  try {
    const response = await axios({
      url,
      method,
      headers,
      data: payload,
    });

    console.log(
      `Fetch axios status response: ${response?.status}`
    );
 
    return { ok: true, ...response.data };
  } catch (error: any) {
    const statusCode = error?.response?.status || 500;

    const errorData =
      error?.response?.data || error?.message || "Error in fetchApi";

    const customError: ApiError = new Error(`Error: ${errorData}`);
    customError.statusCode = statusCode;
    return { ok: false, statusCode, error: errorData };
  }
};
