import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 30000 });

export const fetchPresets = () => api.get("/presets").then((r) => r.data.spots);
export const fetchWeather = (lat, lon, marine = true, startDate = null, endDate = null) => {
  const params = { lat, lon, marine };
  if (startDate && endDate) {
    params.start_date = startDate;
    params.end_date = endDate;
  }
  return api.get("/weather", { params }).then((r) => r.data);
};
export const geocode = (q) => api.get("/geocode", { params: { q } }).then((r) => r.data.results);

// --- Formatting helpers ---
export const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
export const degToCompass = (deg) => {
  if (deg == null) return "--";
  return COMPASS[Math.round(deg / 22.5) % 16];
};

// WMO weather code -> pt-BR label + lucide icon name
export const weatherCodeMap = (code) => {
  const m = {
    0: ["Céu limpo", "sun"],
    1: ["Predom. limpo", "sun"],
    2: ["Parcialmente nublado", "cloud-sun"],
    3: ["Nublado", "cloud"],
    45: ["Névoa", "cloud-fog"],
    48: ["Névoa gelada", "cloud-fog"],
    51: ["Garoa fraca", "cloud-drizzle"],
    53: ["Garoa", "cloud-drizzle"],
    55: ["Garoa intensa", "cloud-drizzle"],
    61: ["Chuva fraca", "cloud-rain"],
    63: ["Chuva", "cloud-rain"],
    65: ["Chuva forte", "cloud-rain-wind"],
    66: ["Chuva congelante", "cloud-rain"],
    67: ["Chuva congelante", "cloud-rain-wind"],
    71: ["Neve fraca", "cloud-snow"],
    73: ["Neve", "cloud-snow"],
    75: ["Neve forte", "cloud-snow"],
    80: ["Pancadas fracas", "cloud-rain"],
    81: ["Pancadas de chuva", "cloud-rain"],
    82: ["Pancadas fortes", "cloud-rain-wind"],
    95: ["Trovoada", "cloud-lightning"],
    96: ["Trovoada c/ granizo", "cloud-lightning"],
    99: ["Trovoada severa", "cloud-lightning"],
  };
  return m[code] || ["--", "cloud"];
};

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const fmtDay = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return `${WEEKDAYS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export const fmtHour = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}h`;
};

export const pressureTrend = (hourly) => {
  if (!hourly?.surface_pressure || !hourly?.time) return { dir: "estável", diff: 0 };
  const now = new Date();
  const idx = hourly.time.findIndex((t) => new Date(t) >= now);
  const i = idx < 0 ? 0 : idx;
  const cur = hourly.surface_pressure[i];
  const past = hourly.surface_pressure[Math.max(0, i - 3)];
  if (cur == null || past == null) return { dir: "estável", diff: 0 };
  const diff = cur - past;
  const dir = diff > 0.6 ? "subindo" : diff < -0.6 ? "caindo" : "estável";
  return { dir, diff: Math.round(diff * 10) / 10 };
};

export const currentHourIndex = (times) => {
  if (!times) return 0;
  const now = new Date();
  const idx = times.findIndex((t) => new Date(t) >= now);
  return idx < 0 ? 0 : idx;
};
