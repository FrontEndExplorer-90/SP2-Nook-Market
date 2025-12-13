// js/auth/logout.js
import { clearAuth } from "../utils/storage.js";

export function handleLogout() {
  clearAuth();
  window.location.href = "../index.html";
}
