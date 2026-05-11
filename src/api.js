const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://ryan.alwaysdata.net/api";
const API_ORIGIN = API_BASE_URL.replace("/api", "");

export const authConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const fileUrl = (filename) => {
  if (!filename) return "/logo192.png";
  if (String(filename).startsWith("http")) return filename;
  return `${API_ORIGIN}/static/images/${filename}`;
};

export default API_BASE_URL;
