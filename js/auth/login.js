// js/auth/login.js
import { AUTH_V2_URL } from "../utils/api.js";

export async function loginUser(email, password) {
  const response = await fetch(`${AUTH_V2_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      (data?.errors && data.errors.map((e) => e.message).join(" ")) ||
      data?.message ||
      "Login failed.";
    throw new Error(msg);
  }

  return data;
}
