import axios from "axios";

export const createHttpClient = (baseURL: string) => {
  return axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      "Content-Type": "application/json"
    },
    validateStatus: () => true
  });
};