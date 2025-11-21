// Nook Market – main.js
// Auth (register/login/logout) + listings + profile wiring for Noroff API v2

const API_BASE = "https://v2.api.noroff.dev";
const AUTH_REGISTER = `${API_BASE}/auth/register`;
const AUTH_LOGIN = `${API_BASE}/auth/login`;
const AUTH_CREATE_API_KEY = `${API_BASE}/auth/create-api-key`; // for later

const STORAGE_KEY_AUTH = "nookMarketAuth";

// ---------- Storage helpers ----------

function saveAuth(data) {
  if (!data) return;
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data));
}

function getAuth() {
  const raw = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

// ---------- Auth helpers ----------

function getAuthUser() {
  const auth = getAuth();
  return auth && auth.data ? auth.data : null;
}

function getAccessToken() {
  const auth = getAuth();
  if (auth && auth.data && auth.data.accessToken) {
    return auth.data.accessToken;
  }
  return null;
}

function getAuthHeaders(includeJson = false) {
  const token = getAccessToken();
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// ---------- DOM bootstrapping ----------

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.querySelector("#register-form");
  const loginForm = document.querySelector("#login-form");

  if (registerForm) {
    setupRegisterForm(registerForm);
  }

  if (loginForm) {
    setupLoginForm(loginForm);
  }

  // Any button with data-logout-btn="true" will trigger logout
  document
    .querySelectorAll("[data-logout-btn='true']")
    .forEach((btn) => btn.addEventListener("click", handleLogout));

  hydrateProfileFromAuth();
  updateNavbarAuthState();

  loadAllListings();
  loadSingleListingPage();
  setupCreateListingForm();
  loadMyListings();
  loadProfilePage();
});


// ---------- Register ----------

function setupRegisterForm(form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = form.querySelector("#register-name");
    const emailInput = form.querySelector("#register-email");
    const passwordInput = form.querySelector("#register-password");
    const confirmInput = form.querySelector("#register-confirm-password");
    const avatarInput = form.querySelector("#register-avatar");

    let isValid = true;

    [nameInput, emailInput, passwordInput, confirmInput, avatarInput].forEach(
      (input) => input && input.classList.remove("is-invalid")
    );
    showFormError(form, "");

    const nameValue = nameInput.value.trim();
    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value.trim();
    const confirmValue = confirmInput.value.trim();
    const avatarUrl = avatarInput.value.trim();

    if (!nameValue || !/^[A-Za-z0-9_]+$/.test(nameValue)) {
      nameInput.classList.add("is-invalid");
      isValid = false;
    }

    // must end with @stud.noroff.no or @noroff.no
    const validDomain =
      emailValue.endsWith("@stud.noroff.no") || emailValue.endsWith("@noroff.no");

    if (!emailValue || !emailValue.includes("@") || !validDomain) {
      emailInput.classList.add("is-invalid");
      isValid = false;
    }

    if (passwordValue.length < 8) {
      passwordInput.classList.add("is-invalid");
      isValid = false;
    }

    if (confirmValue !== passwordValue || confirmValue.length < 8) {
      confirmInput.classList.add("is-invalid");
      isValid = false;
    }

    if (!isValid) {
      showFormError(form, "Please fix the highlighted fields.");
      return;
    }

    const body = {
      name: nameValue,
      email: emailValue,
      password: passwordValue,
    };

    if (avatarUrl) {
      body.avatar = {
        url: avatarUrl,
        alt: `Avatar for ${nameValue}`,
      };
    }

    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";
    }

    try {
      const response = await fetch(AUTH_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Register error:", data);
        const msg =
          (data && data.errors && data.errors.map((e) => e.message).join(" ")) ||
          data.message ||
          "Registration failed.";
        showFormError(form, msg);
      } else {
        alert("Account created successfully! Please log in.");
        window.location.href = "./login.html";
      }
    } catch (error) {
      console.error("Register exception:", error);
      showFormError(form, "Something went wrong. Please try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create account";
      }
    }
  });
}

// ---------- Login ----------

function setupLoginForm(form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = form.querySelector("#login-email");
    const passwordInput = form.querySelector("#login-password");

    let isValid = true;

    [emailInput, passwordInput].forEach((input) =>
      input.classList.remove("is-invalid")
    );
    showFormError(form, "");

    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value.trim();

    if (!emailValue || !emailValue.includes("@")) {
      emailInput.classList.add("is-invalid");
      isValid = false;
    }

    if (passwordValue.length < 8) {
      passwordInput.classList.add("is-invalid");
      isValid = false;
    }

    if (!isValid) {
      showFormError(form, "Please fix the highlighted fields.");
      return;
    }

    const body = {
      email: emailValue,
      password: passwordValue,
    };

    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";
    }

    try {
      const response = await fetch(AUTH_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login error:", data);
        const msg =
          (data && data.errors && data.errors.map((e) => e.message).join(" ")) ||
          data.message ||
          "Login failed.";
        showFormError(form, msg);
      } else {
        // v2 returns { data: { name, email, avatar, banner, accessToken, ... }, meta: {} }
        saveAuth(data);
        window.location.href = "./profile.html";
      }
    } catch (error) {
      console.error("Login exception:", error);
      showFormError(form, "Something went wrong. Please try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Log in";
      }
    }
  });
}

// ---------- Loading Profile ----------

async function loadProfilePage() {
  const profilePage = document.querySelector("#profile-page");
  if (!profilePage) return; // not on profile.html

  const notLoggedInAlert = document.querySelector("#profile-not-logged-in");

  const user = getAuthUser();

  if (!user || !user.name) {
    if (notLoggedInAlert) {
      notLoggedInAlert.classList.remove("d-none");
    }
    return;
  }

  // Top info (username/email/credits/avatar) is mostly handled by hydrateProfileFromAuth,
  // but we can sanity-set it here in case.
  const usernameEl = document.querySelector("#profile-username");
  const emailEl = document.querySelector("#profile-email");
  const creditsEl = document.querySelector("#profile-credits");
  const avatarEl = document.querySelector("#profile-avatar");

  if (usernameEl) usernameEl.textContent = user.name || "Adventurer";
  if (emailEl) emailEl.textContent = user.email || "";
  if (typeof user.credits === "number" && creditsEl) {
    creditsEl.textContent = `${user.credits} ✧`;
  }

  if (avatarEl) {
    if (user.avatar && user.avatar.url) {
      avatarEl.style.backgroundImage = `url("${user.avatar.url}")`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    } else {
      avatarEl.style.backgroundImage = "";
      avatarEl.textContent = (user.name || "NM").slice(0, 2).toUpperCase();
    }
  }

  // Load listings + bids in parallel
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
      `${API_BASE}/auction/profiles/${encodeURIComponent(
        username
      )}/listings?_bids=true&sort=endsAt&sortOrder=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("Failed to load profile listings", json);
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

    // Show only first 3 here as a preview
    const preview = listings.slice(0, 3);

    listContainer.innerHTML = preview
      .map((listing) => createProfileListingCard(listing))
      .join("");
  } catch (error) {
    console.error("Error loading profile listings", error);
    listContainer.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">
          Something went wrong while loading your listings.
        </p>
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
  if (ends) {
    if (ends > now) {
      statusLabel = "Active · " + getEndsLabel(listing.endsAt);
    } else {
      statusLabel = "Ended";
    }
  }

  const bidLabel = highestBid > 0 ? `${highestBid} ✧` : "No bids yet";

  return `
    <div class="col-12">
      <article class="card nook-card-hover h-100 bg-transparent border border-secondary-subtle">
        <div class="row g-0 align-items-center">
          <div class="col-4">
            <img
              src="${url}"
              class="img-fluid rounded-start nook-listing-image"
              alt="${alt}"
              loading="lazy"
            />
          </div>
          <div class="col-8">
            <div class="card-body py-3">
              <p class="small text-secondary text-uppercase mb-1">
                ${statusLabel}
              </p>
              <h3 class="h6 mb-1">${listing.title || "Untitled listing"}</h3>
              <p class="small text-secondary mb-2">
                ${truncateText(listing.description || "", 90)}
              </p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="small">Highest bid: <strong>${bidLabel}</strong></span>
                <a
                  href="./listing.html?id=${listing.id}"
                  class="btn btn-outline-light btn-sm"
                >
                  View
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}

// -------- My Bids --------

async function loadProfileBids(username) {
  const listEl = document.querySelector("#profile-my-bids");
  const emptyMessage = document.querySelector("#profile-my-bids-empty");

  if (!listEl) return;

  listEl.innerHTML =
    '<li class="small text-secondary">Fetching your bids…</li>';
  if (emptyMessage) emptyMessage.classList.add("d-none");

  try {
    const response = await fetch(
      `${API_BASE}/auction/profiles/${encodeURIComponent(
        username
      )}/bids?_listings=true&sort=created&sortOrder=desc`,
      {
        headers: getAuthHeaders(),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("Failed to load profile bids", json);
      listEl.innerHTML =
        '<li class="small text-danger">Couldn’t load your bids.</li>';
      return;
    }

    const bids = Array.isArray(json.data) ? json.data : [];

    if (!bids.length) {
      listEl.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("d-none");
      return;
    }

    // Show a few most recent bids
    const recent = bids.slice(0, 5);

    listEl.innerHTML = recent.map((bid) => createProfileBidItem(bid)).join("");
  } catch (error) {
    console.error("Error loading profile bids", error);
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
        <a
          href="./listing.html?id=${listing.id}"
          class="btn btn-outline-light btn-sm"
        >
          View
        </a>
      </div>
    </li>
  `;
}

// ---------- Profile hydration ----------

function hydrateProfileFromAuth() {
  const user = getAuthUser();
  if (!user) return;

  const usernameEl = document.querySelector("#profile-username");
  const emailEl = document.querySelector("#profile-email");
  const creditsEl = document.querySelector("#profile-credits");
  const avatarEl = document.querySelector("#profile-avatar");

  if (usernameEl && user.name) {
    usernameEl.textContent = user.name;
  }
  if (emailEl && user.email) {
    emailEl.textContent = user.email;
  }
  if (creditsEl && typeof user.credits === "number") {
    creditsEl.textContent = `${user.credits} ✧`;
  }

  if (avatarEl) {
    if (user.avatar && user.avatar.url) {
      avatarEl.style.backgroundImage = `url("${user.avatar.url}")`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    } else {
      // Fallback: show initials if no avatar image
      avatarEl.style.backgroundImage = "";
      avatarEl.textContent = (user.name || "NM").slice(0, 2).toUpperCase();
    }
  }
}


// ---------- Logout + error helper ----------

function handleLogout() {
  clearAuth();
  window.location.href = "../index.html";
}

function showFormError(form, message) {
  let alertBox = form.querySelector(".form-error-alert");

  if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.className = "form-error-alert alert alert-danger mt-3";
    form.appendChild(alertBox);
  }

  if (!message) {
    alertBox.textContent = "";
    alertBox.style.display = "none";
    return;
  }

  alertBox.style.display = "block";

  if (Array.isArray(message)) {
    alertBox.textContent = message.join(" ");
  } else {
    alertBox.textContent = message;
  }
}


function updateNavbarAuthState() {
  const user = getAuthUser();

  const loginItem = document.querySelector("#nav-login-item");
  const registerItem = document.querySelector("#nav-register-item");
  const creditsItem = document.querySelector("#nav-credits-item");
  const creditsAmount = document.querySelector("#nav-credits-amount");
  const navLogoutItem = document.querySelector("#nav-logout-item");
  const navLogoutBtn = document.querySelector("#nav-logout-btn");

  if (!user) {
    // Logged OUT
    if (loginItem) loginItem.classList.remove("d-none");
    if (registerItem) registerItem.classList.remove("d-none");

    if (creditsItem) creditsItem.classList.add("d-none");
    if (navLogoutItem) navLogoutItem.classList.add("d-none");

    return;
  }

  // Logged IN
  if (loginItem) loginItem.classList.add("d-none");
  if (registerItem) registerItem.classList.add("d-none");

  if (creditsItem) creditsItem.classList.remove("d-none");
  if (creditsAmount) {
    const amount = typeof user.credits === "number" ? user.credits : 0;
    creditsAmount.textContent = `${amount} ✧`;
  }

  if (navLogoutItem) navLogoutItem.classList.remove("d-none");
  if (navLogoutBtn) {
    // make sure it logs out
    navLogoutBtn.addEventListener("click", handleLogout);
  }
}
 
// ---------- LISTINGS: helpers ----------

const AUCTION_LISTINGS_URL = `${API_BASE}/auction/listings`;

// fallback if listing has no media
const FALLBACK_IMAGE =
  "https://i.postimg.cc/HWvz0myL/Logo-The-Nook-Market-redigert-redigert-redigert.webp";

function truncateText(text, maxLength = 120) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

function getPrimaryImage(listing) {
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

function getHighestBidAmount(listing) {
  const bids = Array.isArray(listing.bids) ? listing.bids : [];
  if (!bids.length) return 0;

  return bids.reduce((max, bid) => {
    if (typeof bid.amount !== "number") return max;
    return bid.amount > max ? bid.amount : max;
  }, 0);
}

function getEndsLabel(endsAt) {
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

function createListingCard(listing) {
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
          ${endsLabel
      ? `<p class="small text-secondary mt-2 mb-0">${endsLabel}</p>`
      : ""
    }
        </div>
      </article>
    </div>
  `;
}

async function loadAllListings() {
  const grid = document.querySelector("#listings-grid");
  const emptyMessage = document.querySelector("#listings-empty-message");

  if (!grid) return; // not on listings.html

  if (emptyMessage) {
    emptyMessage.classList.add("d-none");
  }

  grid.innerHTML = `
    <div class="col-12">
      <p class="text-secondary mb-0">
        Summoning listings from the archive…
      </p>
    </div>
  `;

  try {
    const response = await fetch(
      `${AUCTION_LISTINGS_URL}?_active=true&_seller=true&_bids=true&sort=endsAt&sortOrder=asc&limit=24&page=1`
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("Failed to load listings", json);
      grid.innerHTML = `
        <div class="col-12">
          <p class="text-danger mb-0">
            Couldn’t load listings right now. The magic circle fizzled. Try again later.
          </p>
        </div>
      `;
      return;
    }

    const listings = Array.isArray(json.data) ? json.data : [];

    if (!listings.length) {
      grid.innerHTML = "";
      if (emptyMessage) {
        emptyMessage.classList.remove("d-none");
      }
      return;
    }

    grid.innerHTML = listings.map(createListingCard).join("");
  } catch (error) {
    console.error("Error loading listings", error);
    grid.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">
          Something went wrong while loading listings.
        </p>
      </div>
    `;
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadSingleListingPage() {
  const detailSection = document.querySelector("#listing-detail");
  if (!detailSection) return; // not on listing.html

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

  if (titleEl) titleEl.textContent = "Loading listing…";
  if (errorBidEl) errorBidEl.textContent = "";

  try {
    const response = await fetch(
      `${AUCTION_LISTINGS_URL}/${listingId}?_seller=true&_bids=true`
    );
    const json = await response.json();

    if (!response.ok) {
      console.error("Failed to load listing", json);
      detailSection.innerHTML =
        '<p class="text-danger">Could not load this listing. It may have been removed.</p>';
      return;
    }

    const listing = json.data;

    // Title / description / seller
    if (titleEl) titleEl.textContent = listing.title || "Untitled listing";
    if (descEl)
      descEl.textContent =
        listing.description ||
        "This listing has no description. Mysterious, isn’t it?";
    if (sellerEl && listing.seller) {
      sellerEl.textContent = `Seller: ${listing.seller.name} (${listing.seller.email})`;
    }

    // Tags
    if (tagsEl) {
      tagsEl.innerHTML = "";
      if (Array.isArray(listing.tags) && listing.tags.length > 0) {
        listing.tags.forEach((tag) => {
          const span = document.createElement("span");
          span.className = "badge rounded-pill bg-secondary-subtle text-light";
          span.textContent = tag;
          tagsEl.appendChild(span);
        });
      }
    }

    // Gallery
    const media = Array.isArray(listing.media) ? listing.media : [];
    let primaryImage = getPrimaryImage(listing);

    if (mainImgEl) {
      mainImgEl.src = primaryImage.url;
      mainImgEl.alt = primaryImage.alt;
    }

    if (thumbsEl) {
      thumbsEl.innerHTML = "";
      media.forEach((item, index) => {
        if (!item || !item.url) return;
        const thumb = document.createElement("img");
        thumb.src = item.url;
        thumb.alt = item.alt || listing.title || "Listing image";
        thumb.className =
          "img-thumbnail nook-thumb-image border-0 rounded-3";
        thumb.style.width = "80px";
        thumb.style.height = "80px";
        thumb.style.objectFit = "cover";

        if (index === 0) {
          thumb.classList.add("opacity-100");
        } else {
          thumb.classList.add("opacity-75");
        }

        thumb.addEventListener("click", () => {
          if (mainImgEl) {
            mainImgEl.src = item.url;
            mainImgEl.alt = thumb.alt;
          }
        });

        thumbsEl.appendChild(thumb);
      });
    }

    // Highest bid + ends at
    const highestBid = getHighestBidAmount(listing);
    if (highestBidEl) highestBidEl.textContent = `${highestBid} ✧`;

    if (endsEl && listing.endsAt) {
      const endDate = new Date(listing.endsAt);
      endsEl.textContent = endDate.toLocaleString();
    }

    // Bid history
    if (bidsListEl) {
      const bids = Array.isArray(listing.bids) ? listing.bids : [];
      bidsListEl.innerHTML = "";

      if (!bids.length) {
        bidsListEl.innerHTML =
          '<li class="small text-secondary">No bids yet. Be the first to offer your credits.</li>';
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
    console.error("Error loading listing", error);
    detailSection.innerHTML =
      '<p class="text-danger">Something went wrong while loading this listing.</p>';
  }
}

function setupBidForm(listingId, currentHighestBid) {
  const form = document.querySelector("#bid-form");
  const amountInput = document.querySelector("#bid-amount");
  const errorEl = document.querySelector("#bid-error");

  if (!form || !amountInput) return;

  const token = getAccessToken();

  if (!token) {
    form.classList.add("opacity-50");
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    if (errorEl) {
      errorEl.textContent = "Log in or create an account to place a bid.";
    }
    return;
  }

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

    try {
      const response = await fetch(
        `${AUCTION_LISTINGS_URL}/${listingId}/bids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        console.error("Bid failed", json);
        if (errorEl) {
          const msg =
            (json.errors && json.errors.map((e) => e.message).join(" ")) ||
            "Could not place bid.";
          errorEl.textContent = msg;
        }
        return;
      }

      // Refresh page to show new bid + updated highest bid
      window.location.reload();
    } catch (error) {
      console.error("Error placing bid", error);
      if (errorEl) {
        errorEl.textContent =
          "Something went wrong while placing your bid. Try again in a moment.";
      }
    }
  });
}

// ---------- Create Listings ----------

function setupCreateListingForm() {
  const form = document.querySelector("#create-listing-form");
  if (!form) return; // not on create.html

  const titleInput = document.querySelector("#create-title");
  const descInput = document.querySelector("#create-description");
  const tagsInput = document.querySelector("#create-tags");
  const mediaInputs = Array.from(
    document.querySelectorAll(".create-media-url")
  );
  const endsAtInput = document.querySelector("#create-ends-at");
  const errorEl = document.querySelector("#create-error");

  // Make sure user is logged in
  const token = getAccessToken();
  if (!token) {
    if (errorEl) {
      errorEl.textContent =
        "You need to be logged in to create a listing. Please log in first.";
      errorEl.classList.remove("d-none");
    }
    form.classList.add("opacity-50");
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  // Set minimum end date = now
  if (endsAtInput) {
    const now = new Date();
    // For datetime-local input we use local time slice(0,16) -> YYYY-MM-DDTHH:MM
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    endsAtInput.min = localISO;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("d-none");
    }

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const tags =
      tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];

    const media = mediaInputs
      .map((input) => input.value.trim())
      .filter(Boolean)
      .map((url) => ({
        url,
        alt: title || "Listing image",
      }));

    const endsAtRaw = endsAtInput.value;
    if (!title || !endsAtRaw) {
      form.classList.add("was-validated");
      return;
    }

    const endsAt = new Date(endsAtRaw);
    if (Number.isNaN(endsAt.getTime()) || endsAt <= new Date()) {
      if (errorEl) {
        errorEl.textContent =
          "Please choose an end date that is in the future.";
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

    try {
      const response = await fetch(AUCTION_LISTINGS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        console.error("Create listing failed", json);
        if (errorEl) {
          const msg =
            (json.errors && json.errors.map((e) => e.message).join(" ")) ||
            "Could not create listing.";
          errorEl.textContent = msg;
          errorEl.classList.remove("d-none");
        }
        return;
      }

      // Success – go to the new listing
      const newId = json.data.id;
      window.location.href = `./listing.html?id=${newId}`;
    } catch (error) {
      console.error("Error creating listing", error);
      if (errorEl) {
        errorEl.textContent =
          "Something went wrong while creating your listing. Try again.";
        errorEl.classList.remove("d-none");
      }
    }
  });
}

async function loadMyListings() {
  const grid = document.querySelector("#my-listings-grid");
  const emptyMessage = document.querySelector("#my-listings-empty");

  if (!grid) return; // not on my-listings.html

  // Get logged-in user
  const user = getAuthUser();
  if (!user || !user.name) {
    grid.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">
          You need to be logged in to see your listings.
        </p>
      </div>
    `;
    if (emptyMessage) emptyMessage.classList.add("d-none");
    return;
  }

  const username = user.name;

  grid.innerHTML = `
    <div class="col-12">
      <p class="text-secondary mb-0">
        Fetching your listings from the archive…
      </p>
    </div>
  `;
  if (emptyMessage) emptyMessage.classList.add("d-none");

  try {
    const response = await fetch(
      `${API_BASE}/auction/profiles/${encodeURIComponent(
        username
      )}/listings?_active=true&_bids=true&sort=endsAt&sortOrder=asc`,
      {
        headers: getAuthHeaders(),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("Failed to load my listings", json);
      grid.innerHTML = `
        <div class="col-12">
          <p class="text-danger mb-0">
            Couldn’t load your listings right now. Try again in a bit.
          </p>
        </div>
      `;
      return;
    }

    const listings = Array.isArray(json.data) ? json.data : [];

    if (!listings.length) {
      grid.innerHTML = "";
      if (emptyMessage) emptyMessage.classList.remove("d-none");
      return;
    }

    grid.innerHTML = listings.map(createMyListingCard).join("");
  } catch (error) {
    console.error("Error loading my listings", error);
    grid.innerHTML = `
      <div class="col-12">
        <p class="text-danger mb-0">
          Something went wrong while loading your listings.
        </p>
      </div>
    `;
  }
}

function createMyListingCard(listing) {
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
              <!-- Edit page can be added later -->
              <!-- <a href="./edit.html?id=${listing.id}" class="btn btn-outline-light btn-sm">Edit</a> -->
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}
