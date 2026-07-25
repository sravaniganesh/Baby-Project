import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "http://10.0.2.2:5001/api",
});

/* =========================================
   ✅ SET AUTH TOKEN (NEW ADDITIVE)
========================================= */
export const setAuthToken = (token: string | null) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

/* =========================================
   ✅ ATTACH TOKEN (INTERCEPTOR)
========================================= */
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    console.log("🔐 TOKEN:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================================
   ✅ RESPONSE DEBUG
========================================= */
API.interceptors.response.use(
  (res) => res,
  (error) => {
    console.log("❌ API ERROR:", error?.response || error.message);
    return Promise.reject(error);
  }
);

export default API;