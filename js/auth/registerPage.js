// js/auth/registerPage.js
import { registerUser } from "./register.js";
import { showFormError } from "../ui/alerts.js";

export function setupRegisterForm(formEl = document.querySelector("#register-form")) {
  const form = formEl;
  if (!form) return;

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = form.querySelector("#register-name");
    const emailInput = form.querySelector("#register-email");
    const passwordInput = form.querySelector("#register-password");
    const confirmInput = form.querySelector("#register-confirm-password");
    const avatarInput = form.querySelector("#register-avatar");

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value.trim() || "";
    const confirm = confirmInput?.value.trim() || "";
    const avatarUrl = avatarInput?.value.trim() || "";

    [nameInput, emailInput, passwordInput, confirmInput, avatarInput].forEach((i) =>
      i?.classList.remove("is-invalid")
    );
    showFormError(form, "");

    let valid = true;

    if (!name || !/^[A-Za-z0-9_]+$/.test(name)) {
      nameInput?.classList.add("is-invalid");
      valid = false;
    }

    const validDomain = email.endsWith("@stud.noroff.no") || email.endsWith("@noroff.no");
    if (!email || !email.includes("@") || !validDomain) {
      emailInput?.classList.add("is-invalid");
      valid = false;
    }

    if (!password || password.length < 8) {
      passwordInput?.classList.add("is-invalid");
      valid = false;
    }

    if (confirm !== password || confirm.length < 8) {
      confirmInput?.classList.add("is-invalid");
      valid = false;
    }

    if (!valid) {
      showFormError(form, "Please fix the highlighted fields.");
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account…";
    }

    try {
      await registerUser(email, password, name, avatarUrl);
      alert("Account created successfully! Please log in.");
      window.location.href = "./login.html";
    } catch (error) {
      showFormError(form, error.message || "Registration failed.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create account";
      }
    }
  });
}
