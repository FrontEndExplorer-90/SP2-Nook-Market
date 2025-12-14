// js/utils/api.js

export const API_BASE = "https://api.noroff.dev/api/v2/auction";
export const AUTH_URL = `${API_BASE}/auth`;


export const API_V2_BASE = "https://v2.api.noroff.dev";
export const AUTH_V2_URL = `${API_V2_BASE}/auth`;
export const AUCTION_V2_URL = `${API_V2_BASE}/auction`;

export const LISTINGS_V2_URL = `${AUCTION_V2_URL}/listings`;
export const PROFILES_V2_URL = `${AUCTION_V2_URL}/profiles`;
export const API_KEY_V2_URL = `${AUTH_V2_URL}/create-api-key`;


export const STORAGE_KEY_AUTH = "nookMarketAuth";


export const AUCTION_LISTINGS_URL = LISTINGS_V2_URL;
export const AUTH_CREATE_API_KEY = API_KEY_V2_URL;
export const PROFILES_BASE = PROFILES_V2_URL;

export const FALLBACK_IMAGE =
  "https://via.placeholder.com/800x500?text=No+image";
