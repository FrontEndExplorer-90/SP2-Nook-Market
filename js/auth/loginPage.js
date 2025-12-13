// js/auth/loginPage.js
import { loginUser } from "./login.js";
import { showFormError } from "../ui/alerts.js";
import { saveAuth, ensureApiKeyOnLoad } from "../utils/storage.js";
import { refreshAuthProfile } from "../profile/updateProfile.js";

export function setupLoginForm(formEl = document.querySelector("#login-form")) {
  const form = formEl;
  if (!form) return;

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = form.querySelector("#login-email");
    const passwordInput = form.querySelector("#login-password");

    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value.trim() || "";

    // reset UI
    [emailInput, passwordInput].forEach((i) => i?.classList.remove("is-invalid"));
    showFormError(form, "");

    let valid = true;
    if (!email || !email.includes("@")) {
      emailInput?.classList.add("is-invalid");
      valid = false;
    }
    if (!password || password.length < 8) {
      passwordInput?.classList.add("is-invalid");
      valid = false;
    }

    if (!valid) {
      showFormError(form, "Please fix the highlighted fields.");
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in…";
    }

    try {
      const data = await loginUser(email, password);

      // store auth response (token etc.)
      saveAuth(data);

      // ensure API key exists (your storage helper should create it if missing)
      await ensureApiKeyOnLoad();

      // refresh profile so credits/avatar/banner load correctly
      await refreshAuthProfile();

      window.location.href = "./profile.html";
    } catch (error) {
      showFormError(form, error.message || "Login failed.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Log in";
      }
    }
  });
}
