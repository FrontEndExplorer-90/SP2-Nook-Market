// js/listings/displayListings.js
import { AUCTION_LISTINGS_URL } from "../utils/api.js" ; 

import { getAuthUser } from "../utils/storage.js";
import { getQueryParam, matchesQuery } from "../utils/filters.js";
import { createListingCard, getPrimaryImage, getHighestBidAmount } from "../ui/renderListings.js";
import { setupBidForm } from "../bids/placeBid.js";

export async function loadAllListings() {
  const grid = document.querySelector("#listings-grid");
  const emptyMessage = document.querySelector("#listings-empty-message");

  const form = document.querySelector("#listings-search-form");
  const input = document.querySelector("#listings-search-input");

  if (!grid) return;

  const render = (items) => {
    if (!items.length) {
      grid.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("d-none");
      return;
    }
    if (emptyMessage) emptyMessage.classList.add("d-none");
    grid.innerHTML = items.map(createListingCard).join("");
  };

  if (emptyMessage) emptyMessage.classList.add("d-none");

  grid.innerHTML = `
    <div class="col-12">
      <p class="text-secondary mb-0">
        Summoning listings from the archive…
      </p>
    </div>
  `;

  try {
    const tagFilter = getQueryParam("tag");

    let url =
      `${AUCTION_LISTINGS_URL}` +
      `?_active=true&_seller=true&_bids=true&sort=endsAt&sortOrder=asc&limit=24&page=1`;

    if (tagFilter) url += `&_tag=${encodeURIComponent(tagFilter)}`;

    const response = await fetch(url);
    const json = await response.json();

    if (!response.ok) {
      grid.innerHTML = `
        <div class="col-12">
          <p class="text-danger mb-0">
            Couldn’t load listings right now. Try again later.
          </p>
        </div>
      `;
      return;
    }

    const listings = Array.isArray(json.data) ? json.data : [];
    render(listings);

    if (form && input && form.dataset.bound !== "true") {
      form.dataset.bound = "true";

      const applyFilter = () => {
        const filtered = listings.filter((l) => matchesQuery(l, input.value));
        render(filtered);
      };

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        applyFilter();
      });

      input.addEventListener("input", applyFilter);
    }
  } catch (error) {
    grid.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">
          Something went wrong while loading listings.
        </p>
      </div>
    `;
  }
}

export async function loadSingleListingPage() {
  const detailSection = document.querySelector("#listing-detail");
  if (!detailSection) return;

  const listingId = getQueryParam("id");
  if (!listingId) {
    detailSection.innerHTML =
      '<p class="text-danger">No listing ID provided in the URL.</p>';
    return;
  }

  const titleEl = document.querySelector("#listing-title");
  const descEl = document.querySelector("#listing-description");
  const sellerEl = document.querySelector("#listing-seller");
  const tagsEl = document.querySelector("#listing-tags");
  const mainImgEl = document.querySelector("#listing-image-main");
  const thumbsEl = document.querySelector("#listing-thumbnails");
  const highestBidEl = document.querySelector("#listing-highest-bid");
  const endsEl = document.querySelector("#listing-time-remaining");
  const bidsListEl = document.querySelector("#listing-bids");
  const errorBidEl = document.querySelector("#bid-error");
  const editBtn = document.querySelector("#listing-edit-btn");

  if (titleEl) titleEl.textContent = "Loading listing…";
  if (errorBidEl) errorBidEl.textContent = "";

  try {
    const response = await fetch(`${AUCTION_LISTINGS_URL}/${listingId}?_seller=true&_bids=true`);
    const json = await response.json();

    if (!response.ok) {
      detailSection.innerHTML =
        '<p class="text-danger">Could not load this listing. It may have been removed.</p>';
      return;
    }

    const listing = json.data;

    // show edit button only for seller
    const currentUser = getAuthUser();
    if (editBtn && currentUser && listing.seller?.name === currentUser.name) {
      editBtn.classList.remove("d-none");
      editBtn.href = `./edit.html?id=${listing.id}`;
    } else if (editBtn) {
      editBtn.classList.add("d-none");
    }

    if (titleEl) titleEl.textContent = listing.title || "Untitled listing";
    if (descEl) {
      descEl.textContent =
        listing.description || "This listing has no description.";
    }
    if (sellerEl && listing.seller) {
      sellerEl.textContent = `Seller: ${listing.seller.name} (${listing.seller.email})`;
    }

    // tags
    if (tagsEl) {
      tagsEl.innerHTML = "";
      if (Array.isArray(listing.tags) && listing.tags.length > 0) {
        listing.tags.forEach((tag) => {
          const span = document.createElement("span");
          span.className = "nook-tag-pill";
          span.textContent = tag;
          tagsEl.appendChild(span);
        });
      }
    }

    // images
    const media = Array.isArray(listing.media) ? listing.media : [];
    const primaryImage = getPrimaryImage(listing);

    if (mainImgEl) {
      mainImgEl.src = primaryImage.url;
      mainImgEl.alt = primaryImage.alt;
    }

    if (thumbsEl) {
      thumbsEl.innerHTML = "";
      media.forEach((item, index) => {
        if (!item?.url) return;

        const thumb = document.createElement("img");
        thumb.src = item.url;
        thumb.alt = item.alt || listing.title || "Listing image";
        thumb.className = "img-thumbnail nook-thumb-image border-0 rounded-3";
        thumb.style.width = "80px";
        thumb.style.height = "80px";
        thumb.style.objectFit = "cover";
        thumb.classList.add(index === 0 ? "opacity-100" : "opacity-75");

        thumb.addEventListener("click", () => {
          if (mainImgEl) {
            mainImgEl.src = item.url;
            mainImgEl.alt = thumb.alt;
          }
        });

        thumbsEl.appendChild(thumb);
      });
    }

    // bids
    const highestBid = getHighestBidAmount(listing);
    if (highestBidEl) highestBidEl.textContent = `${highestBid} ✧`;

    if (endsEl && listing.endsAt) {
      endsEl.textContent = new Date(listing.endsAt).toLocaleString();
    }

    if (bidsListEl) {
      const bids = Array.isArray(listing.bids) ? listing.bids : [];
      bidsListEl.innerHTML = "";

      if (!bids.length) {
        bidsListEl.innerHTML =
          '<li class="small text-secondary">No bids yet. Be the first.</li>';
      } else {
        const sorted = [...bids].sort(
          (a, b) => new Date(a.created) - new Date(b.created)
        );

        sorted.forEach((bid) => {
          const li = document.createElement("li");
          li.className =
            "d-flex justify-content-between align-items-center small py-1 border-bottom border-secondary-subtle";

          const date = new Date(bid.created);
          li.innerHTML = `
            <span>${bid.bidder?.name || "Unknown bidder"}</span>
            <span>${bid.amount} ✧</span>
            <span class="text-secondary">${date.toLocaleString()}</span>
          `;
          bidsListEl.appendChild(li);
        });
      }
    }

    setupBidForm(listingId, highestBid);
  } catch (error) {
    detailSection.innerHTML =
      '<p class="text-danger">Something went wrong while loading this listing.</p>';
  }
}
