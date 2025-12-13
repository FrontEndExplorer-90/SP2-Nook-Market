// js/bids/getBids.js
import { API_BASE } from "../utils/app.js";
import { getAuthUser, getAuthHeaders } from "../utils/storage.js";
import { getPrimaryImage } from "../ui/renderListings.js";

export async function loadMyBidsPage() {
  const listEl = document.querySelector("#my-bids-list");
  const emptyMessage = document.querySelector("#my-bids-empty");
  const notLoggedInAlert = document.querySelector("#my-bids-not-logged-in");

  if (!listEl) return;

  const user = getAuthUser();

  if (!user?.name) {
    listEl.innerHTML = "";
    if (emptyMessage) emptyMessage.classList.add("d-none");
    if (notLoggedInAlert) notLoggedInAlert.classList.remove("d-none");
    return;
  }

  if (notLoggedInAlert) notLoggedInAlert.classList.add("d-none");
  listEl.innerHTML = '<li class="small text-secondary">Fetching your bids…</li>';
  if (emptyMessage) emptyMessage.classList.add("d-none");

  try {
    const response = await fetch(
      `${API_BASE}/auction/profiles/${encodeURIComponent(
        user.name
      )}/bids?_listings=true&sort=created&sortOrder=desc`,
      { headers: getAuthHeaders() }
    );

    const json = await response.json();

    if (!response.ok) {
      listEl.innerHTML =
        '<li class="small text-danger">Couldn’t load your bids right now.</li>';
      return;
    }

    const bids = Array.isArray(json.data) ? json.data : [];

    if (!bids.length) {
      listEl.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("d-none");
      return;
    }

    const recent = bids.slice(0, 50);
    listEl.innerHTML = recent.map(createMyBidItem).join("");
  } catch (error) {
    listEl.innerHTML =
      '<li class="small text-danger">Something went wrong while loading your bids.</li>';
  }
}

function createMyBidItem(bid) {
  const listing = bid.listing || {};
  const { url, alt } = getPrimaryImage(listing);
  const date = bid.created ? new Date(bid.created) : null;
  const dateLabel = date ? date.toLocaleString() : "";

  return `
    <li class="d-flex align-items-center gap-3 py-2 border-bottom border-secondary-subtle">
      <img
        src="${url}"
        alt="${alt}"
        class="rounded-3"
        style="width: 56px; height: 56px; object-fit: cover;"
      />
      <div class="flex-grow-1">
        <p class="small mb-1">
          <strong>${listing.title || "Listing"}</strong>
        </p>
        <p class="small text-secondary mb-0">
          Your bid: <strong>${bid.amount} ✧</strong>
          ${dateLabel ? ` · <span>${dateLabel}</span>` : ""}
        </p>
      </div>
      <div>
        <a href="./listing.html?id=${listing.id}" class="btn btn-outline-light btn-sm">
          View
        </a>
      </div>
    </li>
  `;
}
