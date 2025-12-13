// js/listings/renderListings.js
import { PROFILES_BASE } from "../utils/api.js";
import { getAuthUser, getAuthHeaders } from "../utils/storage.js";
import { matchesQuery } from "../utils/filters.js";
import { createMyListingCard, getHighestBidAmount } from "../ui/renderListings.js";

export async function loadMyListings() {
  const grid = document.querySelector("#my-listings-grid");
  const emptyMessage = document.querySelector("#my-listings-empty");

  const searchInput = document.querySelector("#search-my-listings");
  const statusSelect = document.querySelector("#filter-status");
  const sortSelect = document.querySelector("#filter-sort");
  const clearBtn = document.querySelector("#clear-my-listings-filters");

  if (!grid) return;

  const user = getAuthUser();
  if (!user?.name) {
    grid.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">You need to be logged in to see your listings.</p>
      </div>
    `;
    if (emptyMessage) emptyMessage.classList.add("d-none");
    return;
  }

  const UPCOMING_DAYS = 3;

  const getStatus = (listing) => {
    const now = new Date();
    const ends = listing.endsAt ? new Date(listing.endsAt) : null;
    if (!ends || Number.isNaN(ends.getTime())) return "unknown";

    if (ends <= now) return "ended";

    const upcomingCutoff = new Date(now.getTime() + UPCOMING_DAYS * 24 * 60 * 60 * 1000);
    if (ends >= upcomingCutoff) return "upcoming";

    return "active";
  };

  const render = (items) => {
    if (!items.length) {
      grid.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("d-none");
      return;
    }
    if (emptyMessage) emptyMessage.classList.add("d-none");
    grid.innerHTML = items.map(createMyListingCard).join("");
  };

  grid.innerHTML = `
    <div class="col-12">
      <p class="text-secondary mb-0">Fetching your listings from the archive…</p>
    </div>
  `;
  if (emptyMessage) emptyMessage.classList.add("d-none");

  try {
    const response = await fetch(
      `${PROFILES_BASE}/${encodeURIComponent(user.name)}/listings?_bids=true&sort=endsAt&sortOrder=asc`,
      { headers: getAuthHeaders() }
    );

    const json = await response.json();

    if (!response.ok) {
      grid.innerHTML = `
        <div class="col-12">
          <p class="text-danger mb-0">Couldn’t load your listings right now. Try again in a bit.</p>
        </div>
      `;
      return;
    }

    const listings = Array.isArray(json.data) ? json.data : [];

    const applyAll = () => {
      const q = searchInput ? searchInput.value : "";
      const statusVal = statusSelect ? statusSelect.value : "";
      const sortVal = sortSelect ? sortSelect.value : "ending-soon";

      let result = listings.filter((l) => matchesQuery(l, q));

      if (statusVal) {
        result = result.filter((l) => getStatus(l) === statusVal);
      }

      result = [...result].sort((a, b) => {
        if (sortVal === "newest") {
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        }
        if (sortVal === "highest-bid") {
          return getHighestBidAmount(b) - getHighestBidAmount(a);
        }
        // default = ending soon
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      });

      render(result);
    };

    applyAll();

    if (searchInput && searchInput.dataset.bound !== "true") {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener("input", applyAll);
    }

    if (statusSelect && statusSelect.dataset.bound !== "true") {
      statusSelect.dataset.bound = "true";
      statusSelect.addEventListener("change", applyAll);
    }

    if (sortSelect && sortSelect.dataset.bound !== "true") {
      sortSelect.dataset.bound = "true";
      sortSelect.addEventListener("change", applyAll);
    }

    if (clearBtn && clearBtn.dataset.bound !== "true") {
      clearBtn.dataset.bound = "true";
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (statusSelect) statusSelect.value = "";
        if (sortSelect) sortSelect.value = "ending-soon";
        applyAll();
      });
    }
  } catch (error) {
    grid.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">Something went wrong while loading your listings.</p>
      </div>
    `;
  }
}
