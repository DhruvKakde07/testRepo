import { fetchAuthSession } from "aws-amplify/auth";

const API_URL = import.meta.env.VITE_API_URL;

async function request(path, { method = "GET", body } = {}) {
  if (!API_URL) throw new Error("VITE_API_URL is not configured.");

  const { tokens } = await fetchAuthSession();
  const token = tokens?.accessToken?.toString();
  if (!token) throw new Error("You are not signed in.");

  const headers = { Authorization: `Bearer ${token}` };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const listItems = () => request("/items");
export const addItem = (text) => request("/items", { method: "POST", body: { text } });
export const deleteItem = (id) =>
  request(`/items/${encodeURIComponent(id)}`, { method: "DELETE" });
