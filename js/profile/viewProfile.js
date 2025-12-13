// js/profile/viewProfile.js
import { PROFILES_BASE } from "../utils/api.js";

import { getAuthUser, getAuthHeaders } from "../utils/storage.js";
import { getPrimaryImage, getHighestBidAmount, getEndsLabel, truncateText } from "../ui/renderListings.js";

export function hydrateProfileFromAuth() {
  const user = getAuthUser();
  if (!user) return;

  const usernameEl = document.querySelector("#profile-username");
  const emailEl = document.querySelector("#profile-email");
  const creditsEl = document.querySelector("#profile-credits");
  const avatarEl = document.querySelector("#profile-avatar");
  const navCreditsEl = document.querySelector("#nav-credits-amount");
  const bannerEl = document.querySelector("#profile-banner");

  if (usernameEl && user.name) usernameEl.textContent = user.name;
  if (emailEl && user.email) emailEl.textContent = user.email;

  if (creditsEl && typeof user.credits === "number") creditsEl.textContent = `${user.credits} ✧`;
  if (navCreditsEl && typeof user.credits === "number") navCreditsEl.textContent = `${user.credits} ✧`;

  if (avatarEl) {
    if (user.avatar?.url) {
      avatarEl.style.backgroundImage = `url("${user.avatar.url}")`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    } else {
      avatarEl.style.backgroundImage = "";
      avatarEl.textContent = (user.name || "NM").slice(0, 2).toUpperCase();
    }
  }

  if (bannerEl) {
    if (user.banner?.url) {
      bannerEl.style.backgroundImage = `url("${user.banner.url}")`;
      bannerEl.style.backgroundSize = "cover";
      bannerEl.style.backgroundPosition = "center";
    } else {
      bannerEl.style.backgroundImage = "none";
    }
  }
}

export function hydrateBannerFromAuth() {
  const user = getAuthUser();
  if (!user) return;

  const bannerEl = document.querySelector("#profile-banner");
  if (!bannerEl) return;

  if (user.banner?.url) {
    bannerEl.style.backgroundImage = `url("${user.banner.url}")`;
    bannerEl.style.backgroundSize = "cover";
    bannerEl.style.backgroundPosition = "center";
  } else {
    bannerEl.style.backgroundImage = "";
  }
}

export async function loadProfilePage() {
  const profilePage = document.querySelector("#profile-page");
  if (!profilePage) return;

  const notLoggedInAlert = document.querySelector("#profile-not-logged-in");
  const user = getAuthUser();

  if (!user?.name) {
    if (notLoggedInAlert) notLoggedInAlert.classList.remove("d-none");
    return;
  }

  if (notLoggedInAlert) notLoggedInAlert.classList.add("d-none");

  // Render base info (also safe to call hydration)
  hydrateProfileFromAuth();
  hydrateBannerFromAuth();

  await Promise.all([loadProfileListings(user.name), loadProfileBids(user.name)]);
}

async function loadProfileListings(username) {
  const listContainer = document.querySelector("#profile-my-listings");
  const emptyMessage = document.querySelector("#profile-my-listings-empty");
  if (!listContainer) return;

  listContainer.innerHTML = `
    <div class="col-12">
      <p class="text-secondary mb-0">Fetching your listings…</p>
    </div>
  `;
  if (emptyMessage) emptyMessage.classList.add("d-none");

  try {
    const response = await fetch(
      `${PROFILES_BASE}/${encodeURIComponent(username)}/listings?_bids=true&sort=endsAt&sortOrder=asc`,
      { headers: getAuthHeaders() }
    );

    const json = await response.json();

    if (!response.ok) {
      listContainer.innerHTML = `
        <div class="col-12">
          <p class="text-danger mb-0">Couldn’t load your listings.</p>
        </div>
      `;
      return;
    }

    const listings = Array.isArray(json.data) ? json.data : [];
    if (!listings.length) {
      listContainer.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("d-none");
      return;
    }

    const preview = listings.slice(0, 3);
    listContainer.innerHTML = preview.map(createProfileListingCard).join("");
  } catch (error) {
    listContainer.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">Something went wrong while loading your listings.</p>
      </div>
    `;
  }
}

function createProfileListingCard(listing) {
  const { url, alt } = getPrimaryImage(listing);
  const highestBid = getHighestBidAmount(listing);
  const now = new Date();
  const ends = listing.endsAt ? new Date(listing.endsAt) : null;

  let statusLabel = "Draft";
  if (ends) statusLabel = ends > now ? "Active · " + getEndsLabel(listing.endsAt) : "Ended";

  const bidLabel = highestBid > 0 ? `${highestBid} ✧` : "No bids yet";

  return `
    <div class="col-12">
      <article class="card nook-card-hover h-100 bg-transparent border border-secondary-subtle">
        <div class="row g-0 align-items-center">
          <div class="col-4">
            <img src="${url}" class="img-fluid rounded-start nook-listing-image" alt="${alt}" loading="lazy" />
          </div>
          <div class="col-8">
            <div class="card-body py-3">
              <p class="small text-secondary text-uppercase mb-1">${statusLabel}</p>
              <h3 class="h6 mb-1">${listing.title || "Untitled listing"}</h3>
              <p class="small text-secondary mb-2">${truncateText(listing.description || "", 90)}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="small">Highest bid: <strong>${bidLabel}</strong></span>
                <a href="./listing.html?id=${listing.id}" class="btn btn-outline-light btn-sm">View</a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}

async function loadProfileBids(username) {
  const listEl = document.querySelector("#profile-my-bids");
  const emptyMessage = document.querySelector("#profile-my-bids-empty");
  if (!listEl) return;

  listEl.innerHTML = '<li class="small text-secondary">Fetching your bids…</li>';
  if (emptyMessage) emptyMessage.classList.add("d-none");

  try {
    const response = await fetch(
      `${PROFILES_BASE}/${encodeURIComponent(username)}/bids?_listings=true&sort=created&sortOrder=desc`,
      { headers: getAuthHeaders() }
    );

    const json = await response.json();

    if (!response.ok) {
      listEl.innerHTML = '<li class="small text-danger">Couldn’t load your bids.</li>';
      return;
    }

    const bids = Array.isArray(json.data) ? json.data : [];
    if (!bids.length) {
      listEl.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("d-none");
      return;
    }

    const recent = bids.slice(0, 5);
    listEl.innerHTML = recent.map(createProfileBidItem).join("");
  } catch (error) {
    listEl.innerHTML =
      '<li class="small text-danger">Something went wrong while loading your bids.</li>';
  }
}

function createProfileBidItem(bid) {
  const listing = bid.listing || {};
  const { url, alt } = getPrimaryImage(listing);
  const date = bid.created ? new Date(bid.created) : null;
  const dateLabel = date ? date.toLocaleString() : "";

  return `
    <li class="d-flex align-items-center gap-3 py-2 border-bottom border-secondary-subtle">
      <img src="${url}" alt="${alt}" class="rounded-3" style="width:56px;height:56px;object-fit:cover;" />
      <div class="flex-grow-1">
        <p class="small mb-1"><strong>${listing.title || "Listing"}</strong></p>
        <p class="small text-secondary mb-0">
          Your bid: <strong>${bid.amount} ✧</strong>
          ${dateLabel ? ` · <span>${dateLabel}</span>` : ""}
        </p>
      </div>
      <div>
        <a href="./listing.html?id=${listing.id}" class="btn btn-outline-light btn-sm">View</a>
      </div>
    </li>
  `;
}
