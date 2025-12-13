// js/profile/updateProfile.js
import { API_BASE } from "../utils/app.js";
import { getAuth, saveAuth, getAuthHeaders, getAuthUser } from "../utils/storage.js";
import { hydrateProfileFromAuth } from "./viewProfile.js";
import { updateNavbarAuthState } from "../ui/renderHeader.js";

export async function refreshAuthProfile() {
  const auth = getAuth();
  const user = auth?.data;
  if (!user?.name) return null;

  try {
    const response = await fetch(
      `${API_BASE}/auction/profiles/${encodeURIComponent(user.name)}`,
      { headers: getAuthHeaders() }
    );

    const json = await response.json();

    if (!response.ok || !json?.data) {
      console.warn("Could not refresh profile", json);
      return null;
    }

    auth.data = { ...auth.data, ...json.data };
    saveAuth(auth);

    hydrateProfileFromAuth();
    updateNavbarAuthState();

    return auth.data;
  } catch (error) {
    console.warn("refreshAuthProfile failed", error);
    return null;
  }
}

export function setupProfileEditForm() {
  const form = document.querySelector("#profile-edit-form");
  if (!form) return;

  const avatarInput = document.querySelector("#profile-avatar-url");
  const bannerInput = document.querySelector("#profile-banner-url");
  const bioInput = document.querySelector("#profile-bio");

  const errorEl = document.querySelector("#profile-edit-error");
  const successEl = document.querySelector("#profile-edit-success");
  const resetBtn = document.querySelector("#profile-edit-reset");

  const user = getAuthUser();
  if (!user) {
    form.classList.add("opacity-50");
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    if (errorEl) {
      errorEl.textContent = "You need to be logged in to edit your profile.";
      errorEl.classList.remove("d-none");
    }
    return;
  }

  if (avatarInput) avatarInput.value = user.avatar?.url || "";
  if (bannerInput) bannerInput.value = user.banner?.url || "";
  if (bioInput) bioInput.value = user.bio || "";

  const clearMessages = () => {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("d-none");
    }
    if (successEl) successEl.classList.add("d-none");
  };

  if (resetBtn && resetBtn.dataset.bound !== "true") {
    resetBtn.dataset.bound = "true";
    resetBtn.addEventListener("click", () => {
      clearMessages();
      if (avatarInput) avatarInput.value = user.avatar?.url || "";
      if (bannerInput) bannerInput.value = user.banner?.url || "";
      if (bioInput) bioInput.value = user.bio || "";
    });
  }

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();

    const payload = {};

    if (avatarInput?.value.trim()) {
      payload.avatar = {
        url: avatarInput.value.trim(),
        alt: `Avatar of ${user.name}`,
      };
    }

    if (bannerInput?.value.trim()) {
      payload.banner = {
        url: bannerInput.value.trim(),
        alt: `Banner of ${user.name}`,
      };
    }

    if (bioInput?.value.trim()) {
      payload.bio = bioInput.value.trim();
    }

    if (!Object.keys(payload).length) {
      if (errorEl) {
        errorEl.textContent = "Nothing to update yet.";
        errorEl.classList.remove("d-none");
      }
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving…";
    }

    try {
      const response = await fetch(
        `${API_BASE}/auction/profiles/${encodeURIComponent(user.name)}`,
        {
          method: "PUT",
          headers: getAuthHeaders(true),
          body: JSON.stringify(payload),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        if (errorEl) {
          const msg =
            (json.errors && json.errors.map((e) => e.message).join(" ")) ||
            json.message ||
            "Could not update profile.";
          errorEl.textContent = msg;
          errorEl.classList.remove("d-none");
        }
        return;
      }

      const auth = getAuth();
      if (auth?.data) {
        auth.data = {
          ...auth.data,
          ...json.data,
        };
        saveAuth(auth);
      }

      hydrateProfileFromAuth();
      updateNavbarAuthState();

      if (successEl) successEl.classList.remove("d-none");
    } catch (error) {
      if (errorEl) {
        errorEl.textContent =
          "Something went wrong while saving your changes.";
        errorEl.classList.remove("d-none");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save changes";
      }
    }
  });
}
