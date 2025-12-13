// js/listings/editListing.js
import { AUCTION_LISTINGS_URL } from "../utils/app.js";
import { getQueryParam } from "../utils/filters.js";
import { getAccessToken, getAuthUser, getAuthHeaders } from "../utils/storage.js";

export async function loadEditListingPage() {
  const form = document.querySelector("#edit-listing-form");
  if (!form) return;

  const errorEl = document.querySelector("#edit-error");

  const listingId = getQueryParam("id");
  const token = getAccessToken();
  const user = getAuthUser();

  if (!listingId) {
    if (errorEl) {
      errorEl.textContent = "No listing ID found in the URL.";
      errorEl.classList.remove("d-none");
    }
    form.classList.add("opacity-50");
    return;
  }

  if (!token || !user) {
    if (errorEl) {
      errorEl.textContent = "You need to be logged in to edit a listing.";
      errorEl.classList.remove("d-none");
    }
    form.classList.add("opacity-50");
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  try {
    const response = await fetch(
      `${AUCTION_LISTINGS_URL}/${listingId}?_seller=true&_bids=true`,
      { headers: getAuthHeaders() }
    );

    const json = await response.json();

    if (!response.ok) {
      if (errorEl) {
        const msg =
          (json.errors && json.errors.map((e) => e.message).join(" ")) ||
          json.message ||
          "Couldn’t load listing.";
        errorEl.textContent = msg;
        errorEl.classList.remove("d-none");
      }
      form.classList.add("opacity-50");
      return;
    }

    const listing = json.data;

    // Only allow seller to edit
    if (!listing.seller || listing.seller.name !== user.name) {
      if (errorEl) {
        errorEl.textContent = "You can only edit your own listings.";
        errorEl.classList.remove("d-none");
      }
      form.classList.add("opacity-50");
      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    // store listingId for submit handler
    form.dataset.listingId = listing.id;

    // populate fields
    const titleInput = document.querySelector("#edit-title");
    const descInput = document.querySelector("#edit-description");
    const tagsInput = document.querySelector("#edit-tags");
    const mediaInputs = Array.from(document.querySelectorAll(".edit-media-url"));
    const endsAtInput = document.querySelector("#edit-ends-at");

    if (titleInput) titleInput.value = listing.title || "";
    if (descInput) descInput.value = listing.description || "";
    if (tagsInput) tagsInput.value = (listing.tags || []).join(", ");

    if (mediaInputs.length) {
      const media = Array.isArray(listing.media) ? listing.media : [];
      mediaInputs.forEach((input, index) => {
        const item = media[index];
        input.value = item && item.url ? item.url : "";
      });
    }

    if (endsAtInput && listing.endsAt) {
      const endDate = new Date(listing.endsAt);
      if (!Number.isNaN(endDate.getTime())) {
        const localISO = new Date(
          endDate.getTime() - endDate.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        endsAtInput.value = localISO;
      }
    }
  } catch (error) {
    if (errorEl) {
      errorEl.textContent =
        "Something went wrong while loading the listing. Try again.";
      errorEl.classList.remove("d-none");
    }
  }
}

export function setupEditListingForm() {
  const form = document.querySelector("#edit-listing-form");
  if (!form) return;

  const errorEl = document.querySelector("#edit-error");
  const successEl = document.querySelector("#edit-success");
  const deleteBtn = document.querySelector("#delete-listing-btn");

  function clearMessages() {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("d-none");
    }
    if (successEl) successEl.classList.add("d-none");
  }

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();

    const listingId = form.dataset.listingId;
    const token = getAccessToken();

    if (!listingId || !token) {
      if (errorEl) {
        errorEl.textContent = "Missing listing or auth data. Try reloading the page.";
        errorEl.classList.remove("d-none");
      }
      return;
    }

    const titleInput = document.querySelector("#edit-title");
    const descInput = document.querySelector("#edit-description");
    const tagsInput = document.querySelector("#edit-tags");
    const mediaInputs = Array.from(document.querySelectorAll(".edit-media-url"));
    const endsAtInput = document.querySelector("#edit-ends-at");

    const title = titleInput ? titleInput.value.trim() : "";
    const description = descInput ? descInput.value.trim() : "";

    const tags =
      (tagsInput
        ? tagsInput.value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []) || [];

    const media = mediaInputs
      .map((input) => input.value.trim())
      .filter(Boolean)
      .map((url) => ({ url, alt: title || "Listing image" }));

    const endsAtRaw = endsAtInput ? endsAtInput.value : "";
    if (!title || !endsAtRaw) {
      form.classList.add("was-validated");
      if (errorEl) {
        errorEl.textContent = "Title and end date are required.";
        errorEl.classList.remove("d-none");
      }
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
      submitBtn.textContent = "Saving…";
    }

    try {
      const response = await fetch(`${AUCTION_LISTINGS_URL}/${listingId}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        if (errorEl) {
          const msg =
            (json.errors && json.errors.map((e) => e.message).join(" ")) ||
            json.message ||
            "Could not update listing.";
          errorEl.textContent = msg;
          errorEl.classList.remove("d-none");
        }
        return;
      }

      if (successEl) {
        successEl.textContent = "Listing updated successfully.";
        successEl.classList.remove("d-none");
      }

      const newId = json.data.id || listingId;
      window.location.href = `./listing.html?id=${newId}`;
    } catch (error) {
      if (errorEl) {
        errorEl.textContent =
          "Something went wrong while saving your changes. Try again.";
        errorEl.classList.remove("d-none");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save changes";
      }
    }
  });

  // Delete listing
  if (deleteBtn && deleteBtn.dataset.bound !== "true") {
    deleteBtn.dataset.bound = "true";

    deleteBtn.addEventListener("click", async () => {
      clearMessages();

      const listingId = form.dataset.listingId;
      const token = getAccessToken();
      if (!listingId || !token) return;

      const ok = window.confirm(
        "Are you sure you want to delete this listing? This cannot be undone."
      );
      if (!ok) return;

      try {
        const response = await fetch(`${AUCTION_LISTINGS_URL}/${listingId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!response.ok && response.status !== 204) {
          const json = await response.json().catch(() => ({}));
          if (errorEl) {
            const msg =
              (json.errors && json.errors.map((e) => e.message).join(" ")) ||
              json.message ||
              "Could not delete listing.";
            errorEl.textContent = msg;
            errorEl.classList.remove("d-none");
          }
          return;
        }

        window.location.href = "./my-listings.html";
      } catch (error) {
        if (errorEl) {
          errorEl.textContent =
            "Something went wrong while deleting your listing. Try again.";
          errorEl.classList.remove("d-none");
        }
      }
    });
  }
}
