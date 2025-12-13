// js/listings/createListing.js
import { AUCTION_LISTINGS_URL } from "../utils/api.js";

import { getAccessToken, getApiKey, getAuthHeaders } from "../utils/storage.js";

export function setupCreateListingForm() {
  const form = document.querySelector("#create-listing-form");
  if (!form) return;

  const titleInput = document.querySelector("#create-title");
  const descInput = document.querySelector("#create-description");
  const tagsInput = document.querySelector("#create-tags");
  const mediaInputs = Array.from(document.querySelectorAll(".create-media-url"));
  const endsAtInput = document.querySelector("#create-ends-at");
  const errorEl = document.querySelector("#create-error");

  const token = getAccessToken();
  const apiKey = getApiKey();

  if (!token || !apiKey) {
    if (errorEl) {
      errorEl.textContent =
        "You need to be logged in with a valid API key to create a listing. Try logging out and in again.";
      errorEl.classList.remove("d-none");
    }
    form.classList.add("opacity-50");
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  // Set minimum end date to now (local)
  if (endsAtInput) {
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    endsAtInput.min = localISO;
  }

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("d-none");
    }

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const tags =
      tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];

    const media = mediaInputs
      .map((input) => input.value.trim())
      .filter(Boolean)
      .map((url) => ({
        url,
        alt: title || "Listing image",
      }));

    const endsAtRaw = endsAtInput.value;
    if (!title || !endsAtRaw) {
      form.classList.add("was-validated");
      return;
    }

    const endsAt = new Date(endsAtRaw);
    if (Number.isNaN(endsAt.getTime()) || endsAt <= new Date()) {
      if (errorEl) {
        errorEl.textContent = "Please choose an end date that is in the future.";
        errorEl.classList.remove("d-none");
      }
      return;
    }

    const payload = {
      title,
      description: description || undefined,
      tags: tags.length ? tags : undefined,
      media: media.length ? media : undefined,
      endsAt: endsAt.toISOString(),
    };

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating…";
    }

    try {
      const response = await fetch(AUCTION_LISTINGS_URL, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        if (errorEl) {
          const msg =
            (json.errors && json.errors.map((e) => e.message).join(" ")) ||
            json.message ||
            "Could not create listing.";
          errorEl.textContent = msg;
          errorEl.classList.remove("d-none");
        }
        return;
      }

      const newId = json.data.id;
      window.location.href = `./listing.html?id=${newId}`;
    } catch (error) {
      if (errorEl) {
        errorEl.textContent =
          "Something went wrong while creating your listing. Try again.";
        errorEl.classList.remove("d-none");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create listing";
      }
    }
  });
}
