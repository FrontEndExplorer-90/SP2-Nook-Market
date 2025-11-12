import { AUTH_URL } from "../utils/api.js";

export async function loginUser(email, password) {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data = await response.json();
  return data;
}
