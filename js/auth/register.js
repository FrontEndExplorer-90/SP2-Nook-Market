// js/auth/register.js
import { AUTH_URL } from "../utils/api.js";

export async function registerUser(email, password, name, avatarUrl = "") {
  const body = { name, email, password };

  if (avatarUrl) {
    body.avatar = { url: avatarUrl, alt: `Avatar for ${name}` };
  }

  const response = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      (data?.errors && data.errors.map((e) => e.message).join(" ")) ||
      data?.message ||
      "Registration failed.";
    throw new Error(msg);
  }

  return data;
}
