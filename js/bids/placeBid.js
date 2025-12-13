// js/bids/placeBid.js
import { AUCTION_LISTINGS_URL } from "../utils/app.js";
import { getAccessToken, getAuthHeaders } from "../utils/storage.js";
import { refreshAuthProfile } from "../profile/updateProfile.js";

  
export function setupBidForm(listingId, currentHighestBid) {
  const form = document.querySelector("#bid-form");
  const amountInput = document.querySelector("#bid-amount");
  const errorEl = document.querySelector("#bid-error");

  if (!form || !amountInput) return;

  const token = getAccessToken();

  if (!token) {
    form.classList.add("opacity-50");
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    if (errorEl) errorEl.textContent = "Log in or create an account to place a bid.";
    return;
  }

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";

    const rawValue = amountInput.value.trim();
    const amount = Number.parseInt(rawValue, 10);

    if (!Number.isFinite(amount) || amount <= currentHighestBid) {
      if (errorEl) {
        errorEl.textContent = `Bid must be higher than current highest bid (${currentHighestBid} ✧).`;
      }
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Placing bid…";
    }

    try {
      const response = await fetch(`${AUCTION_LISTINGS_URL}/${listingId}/bids`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ amount }),
      });

      const json = await response.json();

      if (!response.ok) {
        if (errorEl) {
          const msg =
            (json.errors && json.errors.map((e) => e.message).join(" ")) ||
            json.message ||
            "Could not place bid.";
          errorEl.textContent = msg;
        }
        return;
      }

      await refreshAuthProfile();
      window.location.reload();
    } catch (error) {
      if (errorEl) {
        errorEl.textContent =
          "Something went wrong while placing your bid. Try again in a moment.";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Place bid";
      }
    }
  });
}
