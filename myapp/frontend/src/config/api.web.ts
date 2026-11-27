import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const apiHost =
  typeof window === "undefined" ? "localhost" : window.location.hostname;

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || `http://${apiHost}:5001/api`,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error?.response || error.message);
    return Promise.reject(error);
  },
);

export default API;
