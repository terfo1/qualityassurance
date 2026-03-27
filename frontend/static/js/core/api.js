const TOKEN_KEY = "novacart_token";

function formatErrorDetail(detail) {
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || "Invalid value").join(", ");
  }
  if (typeof detail === "string") {
    return detail;
  }
  return "Request failed";
}

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(formatErrorDetail(payload?.detail));
  }
  return payload;
}

export const jsonHeaders = { "Content-Type": "application/json" };
