import { AUTH_URL } from "../utils/api.js";

export async function registerUser(email, password, name) {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name, 
      email,
      password
    })
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  const data = await response.json();
  return data;
}
