// js/utils/authGuard.js
import { getAuth } from "./storage.js";

export function requireAuth(redirectTo = "./login.html") {
  const auth = getAuth();

  if (!auth || !auth.data?.accessToken) {
    window.location.href = redirectTo;
    return false;
  }

  return true;
}
