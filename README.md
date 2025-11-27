# The Nook Market – Semester Project 2

The Nook Market is a cozy, fantasy-inspired auction site built for Noroff’s Auction API (v2).  
Users can register with their Noroff email, log in, create listings, bid on other people’s treasures, and manage their own auctions in a dedicated dashboard.

Think “fantasy library meets gamer cave” – books, gear, collectibles, and pixel trinkets.

---

## 🧙‍♀️ Tech Stack

- **HTML5** – semantic, accessible structure
- **CSS3 + Bootstrap 5.3** – layout + components, with custom theme and utility classes
- **Vanilla JavaScript (ES6)** – no frameworks
- **Noroff Auction API v2** – authentication, listings, bids, profiles
- **LocalStorage** – store auth token + API key

---

## ✨ Core Features (mapped to SP2 brief)

### Authentication

- Register with **Noroff email** (`@stud.noroff.no` / `@noroff.no`)
- Log in via `/auth/login`
- API key is automatically created via `/auth/create-api-key` after first login
- Auth data (token, API key, user info) saved in `localStorage` under `nookMarketAuth`
- Navbar updates on auth:
  - Logged out: **Log in** / **Sign up** buttons
  - Logged in: **Credits pill** + **Log out** button

### Listings

- View all active listings on **Listings** page
  - Data from: `GET /auction/listings?_active=true&_seller=true&_bids=true`
  - Shows title, description, image, tags, current highest bid, and time remaining
- View a **single listing** on `listing.html`
  - Data from: `GET /auction/listings/{id}?_seller=true&_bids=true`
  - Shows:
    - Seller name + email
    - Media gallery with main image + thumbnails
    - Tags
    - Current highest bid
    - End time
    - Bid history

### Bidding

- Logged-in users can place bids on listings they **do not own**
- Bid form validates:
  - User must be logged in
  - Bid must be **higher than current highest bid**
- Sends `POST /auction/listings/{id}/bids` with:
  - `Authorization: Bearer <token>`
  - `X-Noroff-API-Key: <apiKey>`

### Create / Edit / Delete Listings (Seller)

- **Create listing** (`create.html`)
  - Title (required)
  - Description (optional)
  - Tags (comma separated)
  - One or more image URLs
  - End date/time (`endsAt`) – must be in the future
  - Sends `POST /auction/listings`
- **My Listings** (`my-listings.html`)
  - Shows all listings owned by the logged-in user
  - Displays:
    - Status (Active / Ended / Draft)
    - Highest bid
    - View + Edit buttons
- **Edit listing** (`edit.html`)
  - Only accessible if the current user is the seller
  - Loads the existing listing details
  - Allows updating title, description, tags, media, and end date
  - Sends `PUT /auction/listings/{id}`
  - Includes **Delete** button → `DELETE /auction/listings/{id}`

### Profile & Credits

- **Profile page** (`profile.html`)
  - Shows:
    - Username
    - Email
    - Avatar (image or initials fallback)
    - Credits
  - **My Listings preview** – first few listings owned by the user
  - **My Bids preview** – recent bids with images and amounts
- **Profile edit**
  - Update avatar URL
  - Update bio
  - Sends `PUT /auction/profiles/{name}`
  - Updates local `nookMarketAuth` and re-hydrates UI

### My Bids page

- Dedicated **My Bids** page (`my-bids.html`)
- Uses `GET /auction/profiles/{name}/bids?_listings=true`
- Shows:
  - Listing image + title
  - Your bid amount
  - When you placed the bid
  - Link to view the listing

---

## 🗺️ Pages Overview

- `/index.html`  
  Landing page with:
  - Hero section (Browse listings / Create listing)
  - “Browse by vibe” cards filtering by tag
  - “Featured listings” section linking to real listing IDs

- `/pages/listings.html`  
  All active listings from the Auction API.

- `/pages/listing.html?id=…`  
  Single listing view with media gallery, bids, and bid form.

- `/pages/create.html`  
  Create a new listing (requires login).

- `/pages/edit.html?id=…`  
  Edit or delete an existing listing (only for the seller).

- `/pages/my-listings.html`  
  Manage your own listings (view + quick edit access).

- `/pages/my-bids.html`  
  See all bids the user has placed.

- `/pages/profile.html`  
  Profile, credits, avatar, bio, listing preview, recent bids.

- `/pages/login.html` / `/pages/register.html`  
  Auth forms for Noroff users.

---

## 🧩 Architecture & Structure

### Folder Structure

```text
root/
  index.html
  /pages
    listings.html
    listing.html
    create.html
    edit.html
    my-listings.html
    my-bids.html
    profile.html
    login.html
    register.html
  /css
    main.css
  /js
    main.js

