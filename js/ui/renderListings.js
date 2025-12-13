// js/ui/renderListings.js

const FALLBACK_IMAGE =
  "https://i.postimg.cc/HWvz0myL/Logo-The-Nook-Market-redigert-redigert-redigert.webp";

export function truncateText(text, maxLength = 120) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function getPrimaryImage(listing) {
  if (Array.isArray(listing.media) && listing.media.length > 0) {
    const first = listing.media[0];
    if (first && first.url) {
      return {
        url: first.url,
        alt: first.alt || listing.title || "Listing image",
      };
    }
  }

  return {
    url: FALLBACK_IMAGE,
    alt: "The Nook Market placeholder image",
  };
}

export function getHighestBidAmount(listing) {
  const bids = Array.isArray(listing.bids) ? listing.bids : [];
  if (!bids.length) return 0;

  return bids.reduce((max, bid) => {
    if (typeof bid.amount !== "number") return max;
    return bid.amount > max ? bid.amount : max;
  }, 0);
}

export function getEndsLabel(endsAt) {
  if (!endsAt) return "";

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) return "";

  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return `${diffDays} days left`;
  if (diffDays === 1) return "Ends tomorrow";
  if (diffDays === 0) return "Ends today";
  return "Auction ended";
}

export function createListingCard(listing) {
  const { url, alt } = getPrimaryImage(listing);
  const highestBid = getHighestBidAmount(listing);
  const credits = highestBid || 0;

  const tag =
    Array.isArray(listing.tags) && listing.tags.length > 0
      ? listing.tags[0]
      : "Listing";

  const endsLabel = getEndsLabel(listing.endsAt);

  return `
    <div class="col-md-6 col-lg-3">
      <article class="card h-100 nook-card-hover bg-transparent border border-secondary-subtle">
        <img
          src="${url}"
          class="card-img-top nook-listing-image"
          alt="${alt}"
          loading="lazy"
        />
        <div class="card-body d-flex flex-column">
          <p class="small text-secondary text-uppercase mb-1">${tag}</p>
          <h3 class="h6 mb-2">${listing.title || "Untitled listing"}</h3>
          <p class="small text-secondary flex-grow-1">
            ${truncateText(listing.description || "")}
          </p>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="fw-semibold">${credits} ✧</span>
            <a href="./listing.html?id=${listing.id}" class="btn btn-outline-light btn-sm">
              View details
            </a>
          </div>
          ${
            endsLabel
              ? `<p class="small text-secondary mt-2 mb-0">${endsLabel}</p>`
              : ""
          }
        </div>
      </article>
    </div>
  `;
}

export function createMyListingCard(listing) {
  const { url, alt } = getPrimaryImage(listing);
  const highestBid = getHighestBidAmount(listing);
  const now = new Date();
  const ends = listing.endsAt ? new Date(listing.endsAt) : null;

  let statusLabel = "Draft";
  if (ends) {
    if (ends > now) {
      statusLabel = "Active · " + getEndsLabel(listing.endsAt);
    } else {
      statusLabel = "Ended";
    }
  }

  const bidLabel = highestBid > 0 ? `${highestBid} ✧` : "No bids yet";

  return `
    <div class="col-md-6 col-lg-4">
      <article class="card nook-card-hover h-100 bg-transparent border border-secondary-subtle">
        <img
          src="${url}"
          class="card-img-top nook-listing-image"
          alt="${alt}"
          loading="lazy"
        />
        <div class="card-body d-flex flex-column">
          <p class="small text-secondary text-uppercase mb-1">
            ${statusLabel}
          </p>
          <h2 class="h5 mb-2">${listing.title || "Untitled listing"}</h2>
          <p class="small text-secondary flex-grow-1">
            ${truncateText(listing.description || "", 140)}
          </p>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
              <div class="small text-secondary">Highest bid</div>
              <div class="fw-semibold">${bidLabel}</div>
            </div>
            <div class="btn-group">
              <a href="./listing.html?id=${listing.id}" class="btn btn-outline-light btn-sm">
                View
              </a>
              <a href="./edit.html?id=${listing.id}" class="btn btn-outline-light btn-sm">
                Edit
              </a>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}
