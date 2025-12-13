// js/ui/renderHeader.js
import { getAuthUser } from "../utils/storage.js";
import { handleLogout } from "../auth/logout.js";

export function bindLogoutButtons() {
  document
    .querySelectorAll("[data-logout-btn='true']")
    .forEach((btn) => {
      if (btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", handleLogout);
    });

  const navLogoutBtn = document.querySelector("#nav-logout-btn");
  if (navLogoutBtn && navLogoutBtn.dataset.bound !== "true") {
    navLogoutBtn.dataset.bound = "true";
    navLogoutBtn.addEventListener("click", handleLogout);
  }
}

export function updateNavbarAuthState() {
  const user = getAuthUser();

  const loginItem = document.querySelector("#nav-login-item");
  const registerItem = document.querySelector("#nav-register-item");
  const creditsItem = document.querySelector("#nav-credits-item");
  const creditsAmount = document.querySelector("#nav-credits-amount");
  const navLogoutItem = document.querySelector("#nav-logout-item");

  if (!user) {
    // Logged OUT
    if (loginItem) loginItem.classList.remove("d-none");
    if (registerItem) registerItem.classList.remove("d-none");
    if (creditsItem) creditsItem.classList.add("d-none");
    if (navLogoutItem) navLogoutItem.classList.add("d-none");
    return;
  }

  // Logged IN
  if (loginItem) loginItem.classList.add("d-none");
  if (registerItem) registerItem.classList.add("d-none");

  if (creditsItem) creditsItem.classList.remove("d-none");
  if (creditsAmount) {
    const amount = typeof user.credits === "number" ? user.credits : 0;
    creditsAmount.textContent = `${amount} ✧`;
  }

  if (navLogoutItem) navLogoutItem.classList.remove("d-none");
}
