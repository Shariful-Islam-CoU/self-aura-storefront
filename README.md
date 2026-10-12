# Self Aura Storefront

Customer-facing e-commerce website for the Self Aura brand. This is a
**separate Next.js application** from the internal Management Web App
(`self_aura_frontend`). It consumes the shared REST API provided by
`self_aura_backend`.

```
Customer Browser
      ↓
self_aura_storefront (Next.js)
      ↓ REST API
self_aura_backend (Express + MongoDB)
```

> **Status:** Foundation + real catalogue + cart. The Shop/Category pages are
> wired to the backend Product/Category APIs (search, category filter, sort,
> pagination, URL state). A full client-side cart (header, preview, `/cart`)
> and the customer Checkout flow — **Cash on Delivery plus manual bKash/Nagad
> payment instructions, transaction-id capture and order submission** — are
> implemented and wired to the backend Order API. Merchant payment numbers and
> method availability are fetched at runtime from the backend's public
> `GET /api/public/payment-settings` endpoint. The **catalogue reads are
> public too**: the backend serves `/api/catalogue/*` outside `authenticate`
> (see §5 "Public catalogue reads and the management API"), so Shop/Category/
> Product pages load real data for anonymous visitors. Order creation is
> currently
> blocked only by a backend auth gate (see §5 "Known backend limitation: no
> public order route / guest checkout"). A **customer account area**
> (`/account`, `/account/orders`, `/account/orders/[orderNumber]`) ships as
> private `noindex` routes under the storefront chrome with account
> navigation, typed to the backend's real order/shipment wire shapes. Because
> the backend has **no customer authentication** yet (all auth/order/shipment
> endpoints are management-only; the public surface is the catalogue plus
> `GET /api/public/payment-settings`), these pages render an honest "customer
> accounts aren't available yet" state — no profile, order, or tracking data
> is fabricated (see §5 "Known backend limitation: no customer authentication"). A
> **wishlist** (heart toggle on every product card + the details page, a live
> header count, and a private `noindex` `/wishlist` page) is complete as well,
> backed by a centralized provider that persists **only product ids** in
> `localStorage` and re-fetches current product data from the real catalogue on
> render (see §5 "Wishlist (`/wishlist`)"). A **Reviews & Ratings** section is
> integrated into the product details page below the purchase block, with a
> reusable accessible star component, rating summary + distribution, a
> customer review list with backend pagination and sorting, and write / edit /
> delete flows. It issues **zero** review requests today because the backend
> has no review API at all, so the section renders an honest "not available yet"
> state rather than invented ratings (see §5 "Known backend limitation: no
> review or rating API").

## Prerequisites

- Node.js (modern LTS)
- The Self Aura backend running locally (see `self_aura_backend/`)

## 1. Installation

```bash
cd self_aura_storefront
npm install
```

## 2. Environment variables

Copy the example file and adjust values as needed:

```bash
cp .env.example .env.local
```

| Variable                       | Required | Default                     | Description                                                          |
| ------------------------------ | -------- | --------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | yes      | `http://localhost:5000/api` | Base URL of the Self Aura backend REST API. Also the origin product images are resolved against and an allow-listed `next/image` host |
| `NEXT_PUBLIC_SITE_URL`         | no       | `http://localhost:3001`     | Public origin of this storefront (SEO/metadata)                      |
| `NEXT_PUBLIC_MEDIA_HOSTS`      | no       | *(empty)*                   | Extra trusted image origins, comma-separated. Allow-list only — wildcards are deliberately unsupported |

Only `NEXT_PUBLIC_`-prefixed variables are exposed to the browser. Merchant
bKash/Nagad payment numbers are **not** configured here: they are managed in
the Management App (Payment Settings) and served to the storefront at runtime
through the backend's public `GET /api/public/payment-settings` endpoint
(never hardcoded in this project). Backend, MongoDB, and JWT secrets must
**never** be added to this project.

### Expected backend URL

The backend (`self_aura_backend`) listens on **port 5000** by default
(`PORT` env var, fallback `5000`) and mounts all routes under `/api`
(health check at `GET http://localhost:5000/api/health`). Therefore the
default `NEXT_PUBLIC_API_URL` above is correct unless the backend runs on a
different host/port.

## 3. Development command

```bash
npm run dev
```

Runs on **port 3001** (the Management App uses 3000, so the two projects
can run side by side). Open http://localhost:3001.

## 4. Production build

```bash
npm run build
npm run start
```

## 5. Backend API dependency

The catalogue is implemented with a clean data flow:

```
Shop / Category page  →  src/services/catalogService.ts  →  src/lib/api/client.ts  →  backend
```

Endpoints used (all under `NEXT_PUBLIC_API_URL`, e.g. `http://localhost:5000/api`):

- `GET /catalogue/products` — search (`search`), category filter (`category`, an
  ObjectId), sort (`sortBy` ∈ `createdAt|name|sellingPrice|stock`,
  `sortOrder` ∈ `asc|desc`), pagination (`page`, `limit`, max 48). **Public, no
  auth.** The endpoint only ever returns published products, so the storefront
  never sends a visibility filter.
- `GET /catalogue/products/slug/:slug` — product details for
  `/products/[slug]`. **Public, no auth.**
- `GET /catalogue/products/id/:id` — product by ObjectId, used by the
  browser-local wishlist (which stores ids). **Public, no auth.**
- `GET /catalogue/categories` — category navigation; published categories only.
  **Public, no auth.**
- `GET /catalogue/categories/slug/:slug` — single category, used by
  `/categories/[slug]`. **Public, no auth.**
- `GET /public/payment-settings` — customer-safe merchant payment
  configuration: `{ bkash: { enabled, number }, nagad: { enabled, number },
  cod: { enabled } }`. Drives which payment methods the checkout offers and
  the bKash/Nagad receiving numbers shown in the instructions. A disabled
  method returns an empty number and is never offered; numbers are never
  hardcoded in the storefront.
- `POST /orders` — order creation (checkout, Cash on Delivery / manual bKash /
  Nagad). The storefront sends only product ids + quantities + delivery
  details + payment method (+ the customer-claimed `transactionId` and
  optional `senderPhone` for manual methods, `source: 'website'`); the backend
  re-reads prices/stock, computes totals, assigns the real order number
  (`SA-…`), auto-creates the manual payment record and deducts stock.

### Public catalogue reads and the management API

The backend splits the catalogue into two surfaces:

- **`/api/catalogue/*` — public.** Read-only, mounted outside
  `authenticate`. Only published (`isActive`) products and categories are
  reachable, and the responses are an allow-list: `id`, `name`, `slug`, `sku`,
  `description`, `category{id,name,slug}`, `images`, `sellingPrice`, `stock`,
  a derived `lowStock` boolean and `createdAt`. Cost price, the internal
  `lowStockThreshold`, `isActive`, supplier/purchase data, internal notes and
  admin/audit metadata are **never** sent. The list query schema does not
  accept `isActive` or `lowStock`, so a public caller cannot widen the result
  set, and `limit` is capped at 48.
- **`/api/products`, `/api/categories` — management.** Unchanged and still
  behind `authenticate` + `requirePermission`. The dashboard keeps the richer
  payload (`costPrice`, `lowStockThreshold`) and its own `isActive` / `lowStock`
  filters.

Because `lowStockThreshold` is never published, the backend sends a derived
`lowStock` boolean instead and `src/features/products/lib/availability.ts`
maps `stock` + `lowStock` to the three UI states — the "Low stock" badge is
unchanged, the internal reorder point is not.

Other backend facts the storefront adapts to:

- Product images are plain URL strings (`images: string[]`). They are mapped
  to a display shape (`ProductImage[]`) in
  `src/features/products/lib/catalogMappers.ts`. `next/image` remote
  patterns in `next.config.ts` currently allow any HTTPS host plus localhost
  (dev); tighten them to the final image provider when known. Products
  without images render a clean local placeholder.
- The backend has **no compare-at price / discount field** — the storefront
  never fabricates discounts.
- Category pages use slugs in the URL (`/categories/[slug]`). The category itself
  is now resolved directly via `GET /catalogue/categories/slug/:slug`; the
  backend still filters *products* by category **ObjectId**, so the resolved id
  is used as `category=<id>`.
- Publication is the backend's job. The public catalogue endpoints return
  published products/categories only, so the storefront sends no visibility
  filter. If the backend later gains a richer publication model, only
  `catalogService` needs updating.

### Product search, filtering and sorting (`/shop`, `/categories/[slug]`)

Discovery is a single URL-driven state machine shared by both pages:

```
/shop?search=abaya&category=<id>&sort=price-asc&page=2
```

Every control writes to the URL and the server component re-renders. There is
no client-side filtering and no second product-fetching path, so refresh, a
shared link and Back/Forward all reproduce exactly the same results.

**URL contract** (`src/features/products/lib/catalogParams.ts`)

| Param      | Values                                  | Notes |
| ---------- | --------------------------------------- | ----- |
| `search`   | free text, trimmed, ≤ `MAX_SEARCH_LENGTH` (60) | maps to the backend's own `search` param |
| `category` | Mongo ObjectId (24 hex)                | anything else is discarded, never forwarded |
| `sort`     | `newest` \| `price-asc` \| `price-desc` \| `name-asc` | unknown values fall back to `newest` |
| `page`     | integer ≥ 1, ≤ 6 digits                 | `2.5`, `12abc`, `1e9`-style and `0` are discarded |

`MAX_SEARCH_LENGTH` (60) is deliberately stricter than the API's own 200-character
limit, so a term the storefront builds can never be rejected by the server. The
same value is set as `maxLength` on both search inputs, so the cap is visible to
the customer at the point of typing rather than silently truncating on submit.

Defaults are never written into the URL, so `/shop` stays clean and canonical.
All values are encoded via `URLSearchParams`, so a search term can never inject
a second parameter, a fragment, or a `javascript:` URL. Changing search, sort or
category always resets `page` to 1; "Clear all" returns to a bare `/shop`.
Out-of-range pages redirect to the last real page.

**Only backend-supported controls are exposed.** The public catalogue's
`publicProductListQuerySchema` accepts `search`, `category`, `sortBy`,
`sortOrder`, `page` and `limit`. Everything shown here maps 1:1 onto
those — there are no invented parameters, no invented endpoints and no
client-side approximation of anything the server cannot do.

**Sorting** uses the backend's real `sortBy`/`sortOrder` pair:

| UI option      | `sortBy`      | `sortOrder` |
| -------------- | ------------- | ----------- |
| Newest         | `createdAt`   | `desc`      |
| Price: Low→High| `sellingPrice`| `asc`       |
| Price: High→Low| `sellingPrice`| `desc`      |
| Name: A–Z      | `name`        | `asc`       |

**Two filters are deliberately absent:**

- **No price filter.** The backend has no `minPrice`/`maxPrice`. `sellingPrice`
  is only a *sort* key. A price range UI would have to filter an already-paged
  server response in the browser, which cannot produce correct totals or
  pagination — so it is not offered rather than faked.
- **No availability / "in stock only" filter.** The backend exposes `stock` only
  as a sort key; there is no `inStock` or `available` filter.

**Two backend parameters are deliberately unreachable:** `isActive` and
`lowStock`. They exist only on the management endpoint (`lowStock` maps to
`$expr: { $lte: ['$stock', '$lowStockThreshold'] }`, which exposes the internal
reorder threshold). The public schema does not accept them at all, so they can
never be sent from the storefront — not merely hidden.

**Layout** — desktop (`lg+`) is a sticky left sidebar beside the results;
mobile collapses to a `[Filters]` button in the toolbar that opens a slide-over
drawer containing the *same* `CatalogFilterPanel` component, so the two
placements cannot drift. The panel is a plain `<Link>` list with zero client
JavaScript, which makes filters crawlable and pre-fetchable.

**Search input** holds a local draft and only commits on submit (Enter, the
Search key, or the clear button). Typing four characters fires one request, not
four, and the input state stays separable from the committed query. An unchanged
submit is a no-op rather than a duplicate history entry.

**Result counts** come from the backend's real `pagination.total` — never a
client-side tally. Above the grid a `role="status"` line reads e.g.
`Search results for "abaya" · 3 products`.

**SEO** — `/shop` and the category pages stay indexable. Only variants carrying
a `search` term emit `robots: { index: false, follow: true }`: a search URL is
built from arbitrary customer input, so indexing them would let a crawler walk
an unbounded set of near-duplicate pages from junk terms, while still following
their links. `sort` and `page` stay indexable because they are a small, finite
set per search.

**Error states** — the pages catch their own catalogue failures and render
status-aware copy from `toCatalogErrorView` (401/403, 400, 404, 429, 5xx,
network/offline). Backend messages, status codes and stack traces never reach
the customer, and a `Try again` link is always offered. `error.tsx` remains as a
last-resort net.

`generateMetadata` is deliberately guarded so a failed catalogue read can never
throw from metadata generation — metadata runs outside the route's error
boundary, so a throw there blanks the entire route instead of showing an error
state.

### Header search entry point

The masthead search button (`src/components/navigation/HeaderSearch.tsx`)
opens a slide-down panel with a full-width, auto-focused, labelled field on
every page, and submits to `/shop?search=…`. It is a disclosure rather than a
permanent header field because the masthead is a fixed three-zone grid — a
~200px input beside the nav and three action icons crowds the layout below
1280px. Escape closes the panel and returns focus to the trigger.

### Product details (`/products/[slug]`)

The details page resolves a product by slug from the public catalogue and
renders a premium gallery + information layout with a real backend-stock
availability, quantity selector, and an Add to Bag action.

- **Slug lookup:** a direct indexed read,
  `GET /catalogue/products/slug/:slug` (unpublished or unknown products both
  return `404`, so the route calls `notFound()`). This replaced an earlier
  approach that paged through the whole catalogue with `limit=100` until the
  slug matched — one request instead of a scan.
- **Related products** ("You may also like") use the existing backend category
  filter: newest 4 products from the same category, excluding the current
  product. When the product has no category the section is omitted.
- **Customer-safe fields only:** the public endpoint already omits cost price,
  reorder thresholds, supplier data and admin metadata, and the storefront
  view model has no slot for them either. The details page renders name, price,
  availability, description, category and SKU. No compare-at price/discount is
  invented — the backend doesn't expose one.
- **Add to Bag:** the details page adds to the real cart (see "Shopping cart"
  below). `src/features/cart/services/cartService.ts` remains the typed action
  seam the future Cart/checkout API extends.

### Reviews & Ratings (on `/products/[slug]`)

A Reviews & Ratings section sits below the product information and purchase
block and above related products, so it reads as the closing part of the
product story. It is built in `src/features/reviews/`.

> **The backend has no review or rating API at all** — see §5 "Known backend
> limitation: no review or rating API". The section therefore issues **zero**
> review requests and renders an honest "not available yet" state. Every
> component, type, service call and state transition below is implemented and
> typed; it is gated behind two documented capability flags rather than
> fabricated.

- **Capability flags** (`src/features/reviews/constants.ts`):
  - `REVIEWS_AVAILABLE = false` — the backend serves no reviews, so
    `useProductReviews` performs no network calls and the section shows the
    unavailable panel. Set to `true` to activate the live read experience.
  - `REVIEWS_SUBMISSION_AVAILABLE = false` — writing additionally requires a
    customer session so a review can be attributed and ownership enforced
    server-side, and the backend has no customer authentication. While
    `false`, guests see "Please sign in to write a review." linking to the
    existing `/login` route.
- **`StarRating`** (`components/StarRating.tsx`) is the single reusable star
  primitive, in two modes from one component. Read-only renders
  `role="img"` with an `aria-label` of "4.7 out of 5 stars"; interactive is a
  real radio group, so screen readers announce position/checked state and arrow
  keys work with no custom key handling. Stars use a clipped overlay so a
  fractional average (4.7) shows four full stars plus a 70%-filled fifth
  instead of a misleading whole-star rounding. State is carried by the filled
  glyph **and** radio semantics, never by colour alone.
- **Rating summary** (`components/RatingSummary.tsx`) shows the average, the
  review count and — only when the backend actually returns them — the per-star
  distribution. With no reviews the average is `null`, never `0`, so an unrated
  product reads "No reviews yet." rather than "terrible". An all-zero
  distribution is treated as "not provided" and the bars are omitted.
- **Review list** renders only customer-safe fields. The mapper in
  `lib/reviewMappers.ts` is the single place a backend payload becomes a
  renderable review, and it copies through display name, rating, comment, the
  verified-purchase flag, the own-review flag and timestamps. Email, phone, the
  internal customer `_id` and any admin/moderation data are never read, so they
  cannot reach the UI even if the backend adds them later. Review text renders
  as plain text — no `dangerouslySetInnerHTML` anywhere in the feature.
- **Verified Purchase** appears only when the backend asserts it. It is never
  inferred from local order or checkout state, which would be a frontend-only
  business rule.
- **"Is this my review?"** comes from the backend-supplied `isOwnReview` flag,
  never from the storefront comparing customer ids. The flag also drives the
  "Your review" state and the availability of Edit / Delete.
- **Pagination and sorting are the backend's job.** The storefront sends
  `page`, `limit` (5) and `sortBy`, and renders **Load more** based on the
  returned `pagination.totalPages`. It never re-sorts a page it already
  fetched, and never requests an unbounded review set.
- **No optimistic reviews.** Create, update and delete all call the backend
  first; only after it confirms is the list and summary re-read. There is no
  optimistic row to roll back, and the backend stays the source of truth. The
  submit button is disabled for the whole in-flight request, so a double click
  cannot create two reviews.
- **Duplicate reviews** are a backend concern: a `409` maps to "You've already
  reviewed this product" pointing at the existing review's Edit action, and the
  UI never offers a second create form when a review already exists.
- **Edit and delete** are only surfaced on the customer's own review. Delete
  requires an explicit "Delete this review?" confirmation (Cancel / Delete),
  matching the cart's clear-cart confirmation pattern.
- **Validation** mirrors the expected backend contract (rating 1–5, non-empty
  text) for fast feedback only; the backend re-validates everything. A rating of
  `0`, negative, fractional or above 5 is rejected with a clear message. No
  character limit is invented — the textarea's counter is a UI affordance and
  long text is never rejected client-side.
- **Errors are never raw.** `services/reviewService.ts` maps every status to
  customer-friendly copy: 401 (sign in), 403 (purchase required), 409 (already
  reviewed), 400 (field-level validation, using our own messages), 404, 502/503
  and network/server failures. Stack traces and backend messages never render.
- **Loading** uses a dedicated skeleton for the summary block and the list, in
  its own `aria-live` region — the product page above it renders immediately and
  is never blocked by reviews.

### Shopping cart (`/cart`)

A centralized, client-side cart shared by the details page, the header icon
and the cart page — one state, no duplication.

- **State:** `CartProvider` (Context + reducer in `src/features/cart/`) is
  mounted once in the root layout. Lines store a customer-safe product
  snapshot (`id`, `slug`, `name`, `sellingPrice`, first image, `stock` and the
  backend-derived `lowStock` flag) so the cart renders without refetching the
  catalogue. Adding an
  existing product merges (no duplicate lines); quantity is clamped to `>= 1`
  and to the snapshot stock. The snapshot is advisory only — the backend
  re-validates price, stock and totals when the order is created.
- **Persistence:** `cartStorage` reads/writes `localStorage`
  (`self_aura.cart.v1`), SSR-safe and validated entry-by-entry. Malformed
  entries are dropped, never crashed on. Hydration happens client-side after
  mount, so there are no hydration mismatches and the header never flashes a
  wrong count.
- **Header:** the cart icon links to `/cart`, shows the total quantity badge
  (updating immediately on add / quantity change / remove / clear), and
  reveals a lightweight preview on desktop hover/focus.
- **Cart page:** items list + order summary, quantity steppers, remove,
  subtotal (price × quantity, summed), clear-cart with confirmation, and an
  empty state with a Continue Shopping path.
- **Stock handling:** the cart works from the add-time snapshot. If a saved
  line later points to an unavailable product (inactive / zero stock) it is
  flagged "Unavailable", its quantity is locked, it blocks checkout, and it
  can be removed. The backend remains the authority: it re-validates
  availability, price, stock and totals when the order is created.

### Wishlist (`/wishlist`)

A saved-products list, wired to the same centralized-state pattern as the cart:
one heart toggle everywhere, one live count, one page.

- **State:** `WishlistProvider` (Context + reducer in `src/features/wishlist/`)
  is mounted once in the root layout next to `CartProvider` and exposes
  `isInWishlist`, `addToWishlist`, `removeFromWishlist`, `toggleWishlist`,
  `wishlistCount` and `wishlistProductIds` through the `useWishlist` hook. There
  is no second, competing wishlist anywhere.
- **Persistence:** `wishlistStorage` reads/writes `localStorage`
  (`self_aura.wishlist.v1`) with the exact shape `{ "productIds": [...] }` —
  **product ids only**, never product data, prices, or any customer/payment
  detail. Reads are SSR-guarded and validated entry-by-entry (strings only,
  duplicates collapsed, capped at 200); malformed data is dropped rather than
  crashing, and storage failures (private mode/quota) are swallowed so the
  wishlist still works for the session. The key is removed when the wishlist
  becomes empty. Hydration is client-only and after mount, so there is no
  hydration mismatch and the header never flashes a wrong count.
- **Reusable toggle:** `WishlistToggle` is the single place a wishlist action
  happens, in two variants — an `icon` heart (product cards, a DOM sibling of
  the product link so it never triggers navigation) and a labelled `button`
  ("Add to Wishlist" / "Remove from Wishlist") on the details page. Saved state
  is conveyed by a filled heart **and** `aria-pressed` plus a name-specific
  label ("Add/Remove {product} to/from wishlist"), so it is never colour-only
  and never a bare icon. Toggles are instant — local state, no request.
- **Header:** the heart links to `/wishlist` on desktop and mobile and shows a
  saved-count badge (99+ cap) that updates immediately on every toggle.
- **Wishlist page:** a private (`noindex`) route under the `(store)` chrome.
  Saved ids are resolved to **current** product data by fetching each one from
  the real catalogue (`GET /catalogue/products/id/:id` via
  `catalogService.fetchProductById`),
  so prices, stock and availability are never stale or trusted from storage.
  Each card offers Add to bag; an out-of-stock product keeps
  its row but shows "Currently unavailable" instead of the button.
- **Unavailable items are not auto-deleted:** a saved id the catalogue no
  longer returns (unpublished or deleted) renders a removable "no longer
  available" row — the customer decides when to drop it. If the catalogue
  itself cannot be
  reached, the page shows a friendly retry state instead (a temporary outage
  must not look like mass deletion).
- **Demo products are not wishlistable:** the homepage "Preview" placeholder
  cards have non-backend ids, so they render no heart rather than persisting an
  id that could never resolve to a real product.

### Checkout and orders (`/checkout`, `/order-success/[orderNumber]`)

A premium, storefront-styled checkout (not an admin dashboard) with three
payment methods — **Cash on Delivery** and **manual bKash/Nagad**. No online
gateways, coupons or shipping calculators yet.

- **Flow:** `Proceed to checkout` (cart summary) → `/checkout` → review →
  `Place Order` → `POST /api/orders` → on backend confirmation the cart is
  cleared and we navigate to `/order-success/<real-order-number>`.
- **Collected details match the backend schema exactly:** full name + phone
  (Bangladesh friendly: `01XXXXXXXXX` / `+8801XXXXXXXXX`, never corrupted),
  address line, area, city, postal code, country (default Bangladesh), and
  optional delivery instructions → order `note`. No email is collected — the
  order payload has no email field.
- **Delivery:** a single "Standard delivery" option (the backend exposes no
  customer-selectable method). `source` is sent as `website`.
- **Payment methods:**
  - **Cash on Delivery** — no transaction id. Payment stays `unpaid` until
    Self Aura receives payment; the order is never marked paid just because it
    was created (matches the backend default payment status for COD).
  - **bKash / Nagad (manual)** — selecting the method reveals a payment
    instructions panel: Self Aura's receiving number (fetched from the
    backend's public `GET /api/public/payment-settings` endpoint at checkout,
    never hardcoded or read from env), the exact order amount, a 5-step guide,
    a required **Transaction ID** field and an optional sender phone. Whether a
    method appears at all is also backend-driven: disabled channels are simply
    not offered, and if the settings cannot be fetched the checkout falls back
    to Cash on Delivery with a clear notice + retry. The transaction id is a
    **customer claim, not proof of payment** — Self Aura verifies it after the
    order is submitted (`"Your payment will be verified by Self Aura after the
    order is submitted."`). The storefront never marks a payment verified
    automatically and never stores PINs/OTPs/passwords or card details.
  - **Method switching isolates data:** selecting a different method clears
    any captured transaction id/sender phone, so a bKash id can never leak
    onto a COD (or Nagad) order.
- **Backend is authoritative:** the request carries item product-ids +
  quantities only. Prices, stock, line totals, delivery charges and the final
  total are computed by the backend at order creation; everything shown in
  the summary/review is labelled for review only ("Send ৳X to …" uses the
  current checkout amount, but the backend confirms the real total).
  Stock/price/inactive failures map to a friendly "Some items are no longer
  available" state with a Return to cart action.
- **Submission safety:** the Place Order button disables while submitting and
  a ref guard prevents duplicate submissions; form values survive failures;
  the cart is cleared **only after** the backend confirms order creation —
  failed orders keep the cart intact. Nothing submits automatically.
- **Success page:** shows the real backend order number, customer, delivery
  summary, payment method, payment status and backend totals. COD copy is
  "Your order has been placed successfully."; manual copy is "Your order has
  been placed and your payment is awaiting verification." plus the
  "verified by Self Aura" note. Details are passed via `sessionStorage` (no
  public `GET /orders/:id` exists) with a graceful fallback to the URL order
  number. Actions: Continue Shopping and Back to Home. Both routes are
  `noindex`.

### Manual payments are wired to the backend

The backend Order API now supports bKash/Nagad: the order `paymentMethod`
enum includes `bkash`/`nagad`, `createOrderSchema` accepts a required
`transactionId` (min 6, max 200 chars) and an optional `senderPhone` for
manual methods, and the backend auto-creates the manual **Payment** record
(`submitted`, awaiting verification) inside the order transaction.
`checkoutService.toBackendPaymentMethod` maps `cod → cash_on_delivery`,
`bkash → bkash`, `nagad → nagad`, and `buildCreateOrderRequest` forwards the
customer-claimed transaction id + optional sender phone plus `source:
'website'`. Nothing is ever auto-verified.

### Payment number configuration

Merchant bKash/Nagad numbers and the enabled state of every payment method
are managed in the Management App (Payment Settings → ApplicationSettings
keys) and served to the storefront through the backend's public
`GET /api/public/payment-settings` endpoint. The checkout fetches them at
mount: manual methods are only offered when enabled, their instruction
numbers come from the response, and a disabled channel is never shown. No
`NEXT_PUBLIC_*` payment-number variables exist anymore — a number can change
in the Management App without a storefront rebuild.

### Known backend limitation: no public order route / guest checkout

Every order route in `self_aura_backend` is **authentication and permission
gated** (`orders.create`), and `createOrderSchema` requires `customer` — the
ObjectId of an existing, active customer record. The storefront has no
customer-authentication bridge (by design) and guests have no customer id, so
today `Place Order` reaches the backend and receives a friendly
"checkout isn't available yet" state while the cart stays intact. The
storefront never fabricates a customer id or order number.

This is a backend gap (the backend was intentionally not modified in this
task). Enabling guest checkout requires a public (or customer-authenticated)
order route that accepts guest delivery details and either creates/links a
customer record server-side or makes `customer` optional for
`source: 'website'` orders. The storefront already targets the exact
`createOrderSchema` wire shape for all three payment methods, so only the
backend route needs enabling — no further storefront changes are required.

### Customer account, My Orders and order tracking (`/account`, `/account/orders`, `/account/orders/[orderNumber]`)

Premium, private (`noindex`) customer account routes under the storefront
chrome (header/footer + account navigation — not admin styling):

- **Layout:** `/account/*` uses its own layout (`src/app/account/layout.tsx`)
  with `AccountNav` (Overview / My Orders / Sign in) — a sidebar on desktop,
  stacked above the content on mobile. The `/login` and `/register` pages are
  unchanged and keep their focused centered chrome.
- **Honest state:** the backend has no customer authentication, so the
  storefront cannot load a customer's profile, orders or tracking. Each
  account page therefore renders a premium "not available yet" panel with
  clear next steps (start shopping / sign in / create an account). Nothing is
  fabricated: no fake profile, no invented order numbers, dates, totals or
  tracking events.
- **Wire contracts (typed, backend-faithful):**
  - `src/types/order.ts` — `OrderResponse` (including the backend's
    `transactionId` / `senderPhone` manual-payment fields) and `OrderListData`
    (orders + the backend's pagination shape).
  - `src/types/shipment.ts` — `ShipmentResponse`, `ShipmentEventResponse`
    (status history/timeline), `ShipmentStatus`, `DeliveryFailureReason` and
    the courier/address refs, mirroring the backend Shipment API.
  - `src/features/account/constants.ts` — customer-safe labels + badge
    variants for every real backend enum value (payment methods, payment
    statuses, order statuses, shipment statuses, delivery failure reasons).
    Unknown values are never silently mapped; the checkout success page reuses
    the shared payment method/status maps.
- **Route protection / ownership:** by design these pages only ever show the
  authenticated customer's own data. Today there is nothing to authenticate
  against, so the pages present the honest placeholder rather than a redirect
  loop; when the backend exposes customer auth + customer-scoped read APIs,
  the same routes switch to real data behind the account shell.

### Known backend limitation: no customer authentication

The backend has **no customer authentication** whatsoever:

- Auth endpoints (`/api/auth/*`) register/login **management** users
  (`owner | manager | staff`) only — there is no customer role, no OTP/phone
  verification, and no customer-session model.
- Every order (`/api/orders*`), shipment (`/api/shipments*`) and customer
  (`/api/customers*`) endpoint is management-auth + permission gated
  (`orders.view`, `shipments.view`, …). `GET /api/orders` can filter by
  `customer=<ObjectId>`, but only a management JWT can call it — there is no
  customer-safe way to list a customer's own orders, open one order, or read
  its shipment tracking.
- The only public endpoint is `GET /api/public/payment-settings`.

The storefront therefore cannot authenticate customers or fetch customer data
honestly. Per project rules no backend change was made here and no endpoint
was guessed. Enabling this feature area requires backend work (a natural
follow-up task):

1. Customer authentication (e.g. phone-based register/login/OTP or another
   customer-safe session) plus a customer-scoped `me`/profile endpoint.
2. Customer-safe order reads: list own orders (filters + pagination), open
   one order by orderNumber with ownership enforced server-side, and a
   customer-safe payment-verification status signal.
3. Customer-safe tracking: shipments by order (courier, tracking number,
   status history/timeline) or a backend-provided external tracking URL —
   never a storefront-constructed URL.
4. Logout / session management matching the chosen auth model.

The storefront already ships the typed contracts, customer-safe status maps
and the private route shell these integrate with.

### Known backend limitation: no wishlist API

`self_aura_backend` has **no wishlist / favourite / saved-item functionality at
all** — no route, controller, service, model or field anywhere in the backend
source (verified by searching the full backend for `wishlist`, `favorite`,
`favourit` and `saved item`). There is also no customer identity to attach a
wishlist to (see §5 "Known backend limitation: no customer authentication").

**Wishlist persistence mode: LocalStorage.**

The storefront therefore keeps the wishlist in the browser
(`self_aura.wishlist.v1`, product ids only) and re-fetches current product data
from the real catalogue on render. It was chosen over inventing a fake API
because calling a non-existent endpoint would be a fabricated backend contract,
and no guessed route is ever called.

What this means for a customer:

- A wishlist survives refreshes, restarts and re-visits **in that browser**,
  including for guests.
- It does **not** follow the customer to another device or browser, and it is
  not merged when a guest later becomes a customer — there is no account yet to
  merge it into.
- Clearing site data removes it.

The design leaves the change to server persistence small: `WishlistProvider` and
`wishlistStorage` are the only modules that know where ids live, and no
component touches storage directly. When the backend gains a wishlist API (a
customer-scoped wishlist endpoint alongside customer auth, mirroring
`cartService`/`checkoutService` for the cart), a sync/migration layer in the
provider is the whole change — the toggle, header and `/wishlist` page keep
their current contracts.

### Known backend limitation: no review or rating API

`self_aura_backend` has **no product review or rating functionality at all**.
Verified by inspection, not assumption:

- no `Review` model — `src/models/` contains no review/rating schema (searching
  for `*review*` / `*rating*` / `*feedback*` / `*testimonial*` returns nothing);
- no `/reviews` mount in `src/routes/index.ts` — the router mounts 20 route
  modules and none is a review module;
- no review controller, service, repository or validator;
- no `averageRating`, `reviewCount` or per-star distribution on
  `ProductResponse` — confirmed in `src/utils/productMappers.ts` and
  `src/types/product.ts`, so the product payload carries no rating data at all.

There is also no customer identity to attribute a review to (see §5 "Known
backend limitation: no customer authentication"), so even the write side has no
author.

**Consequence for a customer:** every product page shows an honest
"No reviews yet." panel explaining that customer reviews for the product aren't
available yet. No average, count, distribution, review text, author name or
verified-purchase badge is ever invented, and no request is made to an endpoint
that does not exist — the storefront makes **zero** review network calls.

This is also why the public product route stays the one thing that *could* have
been affected but is not: `/products/[slug]` keeps its SEO-friendly, indexable
metadata and no `noindex` was added. Reviews are part of the public product page,
and the section's absence is a backend fact, not a privacy decision.

**Deliberately not done:**

- No review API was invented, and no guessed route is ever called.
- No `AggregateRating` / `Review` structured data was emitted. The existing
  architecture has no structured-data support and the backend provides no
  reliable rating data, so emitting it would be inventing markup.
- No client-side sorting, filtering or averaging was added to fake an ordering
  the backend does not support. Sorting and pagination are delegated entirely.

**To turn it on,** the backend needs a customer review API — a
`GET /products/:id/reviews` read (paged, with a per-star distribution and a
customer-safe display name), plus `POST` / `PATCH` / `DELETE /reviews/:id` with
server-side ownership enforcement and (if the business requires it) a
verified-purchase check. The storefront side is already complete and typed
end-to-end against that contract: `src/types/review.ts` holds the wire shapes,
`src/features/reviews/services/reviewService.ts` is the only module that knows
the endpoint paths, and `mapReviewResponse` is the only place a payload becomes
renderable data. Point the service at the real routes and set
`REVIEWS_AVAILABLE = true` (plus `REVIEWS_SUBMISSION_AVAILABLE = true` once
customer auth exists) — no component changes are required.

## 6. Placeholder imagery

The homepage, category, and product cards use abstract, editorial-style
placeholder PNGs under `public/images/` (generated locally — no external
images, no fake product photos). Regenerate them anytime with:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/generate-placeholders.ps1
```

When real Self Aura campaign/product assets are ready, replace the PNGs with
the same filenames (or update the `src` paths in the components). The demo
catalogue is intentionally generic and labelled "Preview". Real product
photography now comes from the backend's media API (see below) and never from
these files.

## Product images

Product imagery is served by the Self Aura backend. A product carries an ordered
image list and **the first entry (`sortOrder === 0`) is the primary image** —
there is no `isPrimary` flag anywhere in the system, so "the main photo" and "the
top of the list" can never disagree.

The public catalogue returns only `{ url, alt, sortOrder }` per image. No storage
key, MIME type, pixel size or server path is ever exposed to a customer.

### Adapting wire shapes

`src/features/products/lib/catalogMappers.ts` is the only place that converts the
API payload into display images. It does three things, once, for every product:

1. sorts by `sortOrder` and re-numbers densely, so position 0 is unambiguously the
   primary image;
2. resolves root-relative URLs (`/media/<key>`) against the API origin — without
   this, `next/image` would request the *storefront's* origin and every uploaded
   product image would 404;
3. **drops** any entry whose URL cannot be resolved to a safe `http(s)` or
   root-relative URL, so an unrenderable entry can never become a broken card.

`src/features/products/lib/media.ts` holds the helpers (`resolveMediaUrl`,
`getPrimaryImage`, `normalizeOrder`). Both are unit-tested.

### One image component for every surface

`ProductImageFrame` (`src/components/product/ProductImageFrame.tsx`) is the only
image renderer in the customer-facing product surfaces — the grid card, the gallery
main image and thumbnails, cart lines, the checkout summary and the order
confirmation. It guarantees:

- **no layout shift** — the box is sized by an explicit aspect ratio before any
  bytes arrive, with a skeleton in it;
- **graceful degradation** — a failed load, or a missing image, swaps to the shared
  styled `ProductImageFallback` rather than a browser broken-image glyph;
- **one code path**, so no surface invents its own broken state.

### Product card and gallery

- **`ProductCard`** — 4:5 box, primary image only, responsive `sizes`, hover zoom,
  demo cards badged "Preview".
- **`ProductGallery`** — main image with prev/next controls, a thumbnail rail
  (vertical on desktop, horizontally scrollable on mobile), an `n / m` counter, and
  arrow-key / `Home` / `End` navigation scoped to the gallery. The thumbnail rail
  is a `tablist` with a roving tabindex, so a ten-image gallery adds one tab stop,
  not ten. With a single image the rail and arrows are omitted entirely; with no
  images the styled fallback is shown.

### `next/image` configuration

`next.config.ts` builds `images.remotePatterns` from `NEXT_PUBLIC_API_URL` plus any
origins in `NEXT_PUBLIC_MEDIA_HOSTS`. This is an **allow-list of specific origins** —
the previous `{ protocol: "https", hostname: "**" }` wildcard was removed, because it
let any site on the internet be used as an image source. `unoptimized` is **not** set
globally: images are optimised through the Next pipeline, which is why every call
site passes an explicit `sizes`.

## Scripts

| Script    | Description                     |
| --------- | ------------------------------- |
| `dev`     | Next.js dev server (port 3001)  |
| `build`   | Production build                |
| `start`   | Serve the production build      |
| `lint`    | ESLint                         |
| `test`    | Unit + component tests (vitest + Testing Library) |
| `lint`  | ESLint (flat config, strict)    |#   s e l f - a u r a - s t o r e f r o n t  
 