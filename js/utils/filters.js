// js/utils/filters.js

export function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function matchesQuery(listing, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;

  const title = (listing.title || "").toLowerCase();
  const desc = (listing.description || "").toLowerCase();
  const tags = Array.isArray(listing.tags) ? listing.tags.join(" ").toLowerCase() : "";

  return title.includes(q) || desc.includes(q) || tags.includes(q);
}
