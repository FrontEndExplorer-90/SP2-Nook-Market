// js/utils/storage.js

import { STORAGE_KEY_AUTH, AUTH_CREATE_API_KEY } from "./app.js";

// ---------- Storage helpers ----------

export function saveAuth(data) {
  if (!data) return;
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data));
}

export function getAuth() {
  const raw = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

// ---------- Auth helpers ----------

export function getAuthUser() {
  const auth = getAuth();
  return auth && auth.data ? auth.data : null;
}

export function getAccessToken() {
  const auth = getAuth();
  if (auth && auth.data && auth.data.accessToken) {
    return auth.data.accessToken;
  }
  return null;
}

export function getApiKey() {
  const auth = getAuth();
  if (auth && auth.data && auth.data.apiKey) {
    return auth.data.apiKey;
  }
  return null;
}

export function getAuthHeaders(includeJson = false) {
  const headers = {};
  const token = getAccessToken();
  const apiKey = getApiKey();

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (apiKey) {
    headers["X-Noroff-API-Key"] = apiKey;
  }

  return headers;
}

// ---------- API Key helpers ----------

export async function ensureApiKey(authData) {
  if (!authData || !authData.data || !authData.data.accessToken) {
    return authData;
  }

  if (authData.data.apiKey) {
    return authData;
  }

  try {
    const response = await fetch(AUTH_CREATE_API_KEY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.data.accessToken}`,
      },
      body: JSON.stringify({ name: "NookMarketKey" }),
    });

    const json = await response.json();

    if (response.ok && json.data && json.data.key) {
      authData.data.apiKey = json.data.key;
      saveAuth(authData);
    } else {
      console.error("Could not create API key", json);
    }
  } catch (error) {
    console.error("Error creating API key", error);
  }

  return authData;
}

export async function ensureApiKeyOnLoad() {
  const auth = getAuth();
  if (!auth || !auth.data) return;

  const hasToken = !!auth.data.accessToken;
  const hasKey = !!auth.data.apiKey;

  if (hasToken && !hasKey) {
    await ensureApiKey(auth);
  }
}
