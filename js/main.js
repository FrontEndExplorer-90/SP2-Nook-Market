// js/main.js

import { ensureApiKeyOnLoad } from "./utils/storage.js";

import { bindLogoutButtons, updateNavbarAuthState } from "./ui/renderHeader.js";

import { loadAllListings, loadSingleListingPage } from "./listings/displayListings.js";
import { setupCreateListingForm } from "./listings/createListing.js";
import { loadMyListings } from "./listings/renderListings.js";
import { loadEditListingPage, setupEditListingForm } from "./listings/editListing.js";

import {
  loadProfilePage,
  hydrateProfileFromAuth,
  hydrateBannerFromAuth,
} from "./profile/viewProfile.js";

import { setupProfileEditForm } from "./profile/updateProfile.js";
import { loadMyBidsPage } from "./bids/getBids.js";

import { setupLoginForm } from "./auth/loginPage.js";
import { setupRegisterForm } from "./auth/registerPage.js";


document.addEventListener("DOMContentLoaded", async () => {
  await ensureApiKeyOnLoad();

  bindLogoutButtons();
  updateNavbarAuthState();

  
  hydrateProfileFromAuth();
  hydrateBannerFromAuth();

  loadAllListings();
  loadSingleListingPage();

  setupCreateListingForm();

  loadMyListings();

  loadEditListingPage();
  setupEditListingForm();

  loadProfilePage();
  setupProfileEditForm();

  loadMyBidsPage();

  setupRegisterForm();
setupLoginForm();

});
