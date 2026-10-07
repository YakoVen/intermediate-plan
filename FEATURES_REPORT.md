# 🚀 INTERMEDIATE PLAN — Features Report
> **Project:** `intermediate-plan` (d:\web\intermediate-plan)  
> **Tier:** 3 of 5  
> **Target Users:** Growing businesses needing customer accounts and advanced management  
> **Status:** 🟡 Scaffolded — needs development  
> **Last Updated:** October 1, 2026

---

## 📌 INHERITED FROM BASIC (Must carry over)
Everything from the Basic plan is the foundation. These features must be migrated and refined:

| # | Feature | Source |
|---|---------|--------|
| 1 | Landing page + all storefront sections | Migrate from Basic |
| 2 | Product catalog with search, filters, sorting | Migrate from Basic |
| 3 | Product detail page with image carousel | Migrate from Basic |
| 4 | **Shopping Cart** (multi-item, persistent) | Migrate from Basic |
| 5 | **Product Variants** (size, color, stock per variant) | Migrate from Basic |
| 6 | COD checkout form with dynamic delivery pricing | Migrate from Basic |
| 7 | **Coupon / Promo code system** | Migrate from Basic |
| 8 | **Stock / Inventory tracking** | Migrate from Basic |
| 9 | **Customer Reviews & Ratings** | Migrate from Basic |
| 10 | **SMS Notifications** | Migrate from Basic |
| 11 | WhatsApp order button + social sharing | Migrate from Basic |
| 12 | Admin dashboard (articles, orders, coupons, reviews) | Migrate & upgrade |
| 13 | Responsive design + mobile nav | Migrate from Basic |
| 14 | Server-side validation | Migrate from Basic |

---

## 🆕 NEW FEATURES TO BUILD

### 👤 A. Customer Authentication & Accounts — `Priority: 🔴 CRITICAL`
> The #1 differentiator from the Basic tier.

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 1 | **Firebase Auth for customers** | Email/password signup + Google OAuth login | 🔴 Critical |
| 2 | **Auth Context Provider** | Global state for current user session, role detection (admin vs customer) | 🔴 Critical |
| 3 | **Login / Register pages** | Clean forms with validation, password recovery flow | 🔴 Critical |
| 4 | **Protected routes middleware** | Redirect unauthenticated users from account pages; redirect non-admins from dashboard | 🔴 Critical |
| 5 | **`users` Firestore collection** | Store `id`, `email`, `displayName`, `phone`, `role`, `addresses[]`, `createdAt` | 🔴 Critical |
| 6 | **Guest vs. authenticated checkout** | Allow both flows — logged-in users get address auto-fill | 🔴 Critical |

### 📋 B. Customer Dashboard — `Priority: 🔴 CRITICAL`

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 7 | **Customer dashboard layout** | Sidebar nav: My Orders, My Addresses, My Profile | 🔴 Critical |
| 8 | **Order history page** | List all past orders with status, date, total, product thumbnails | 🔴 Critical |
| 9 | **Order detail page** | Full breakdown of a specific order: items, prices, shipping, status timeline | 🔴 Critical |
| 10 | **Saved addresses** | Add, edit, delete shipping addresses; select one at checkout | 🟠 High |
| 11 | **Profile management** | Edit name, phone, email, password | 🟠 High |

### 📍 C. Order Tracking System — `Priority: 🟠 HIGH`

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 12 | **`trackingHistory` on orders** | Array of `{ status, timestamp, note }` entries on each order document | 🟠 High |
| 13 | **Public tracking page** | `/track?id=ORDER-123` — anyone with the order ID can see the status pipeline | 🟠 High |
| 14 | **Visual status pipeline** | Step-by-step progress bar: Pending → Confirmed → Shipped → Delivered | 🟠 High |
| 15 | **Admin: add tracking notes** | When changing status, optionally add a note (e.g., tracking number) | 🟠 High |

### ❤️ D. Wishlist — `Priority: 🟠 HIGH`

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 16 | **Wishlist saved to account** | Heart icon on product cards; saved in user's Firestore document | 🟠 High |
| 17 | **Wishlist page** | View all saved products with "Add to Cart" button | 🟠 High |
| 18 | **Guest wishlist fallback** | Use localStorage for non-logged-in users | 🟡 Medium |

### 🛒 E. Abandoned Cart & Incomplete Order Recovery — `Priority: 🟠 HIGH`
> Recovers two distinct types of lost revenue, tracked and managed separately.

#### E1. Abandoned Cart Recovery
Targets customers who added items to their cart but never started or completed checkout.

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 19 | **Cart session tracking** | Save cart contents + customer contact info (email/phone) to Firestore as soon as they're entered in checkout form | 🟠 High |
| 20 | **Abandonment detection** | Mark a cart session as "abandoned" after 30–60 min of inactivity with no completed order | 🟠 High |
| 21 | **Recovery SMS notification** | Auto-send SMS to the customer's phone with a direct link back to their saved cart | 🟠 High |
| 22 | **Recovery email notification** | Auto-send email (if available) with cart contents, images, prices, and a one-click return link | 🟡 Medium |
| 23 | **Admin: abandoned cart list** | Dashboard view showing all abandoned carts: customer, items, cart value, time abandoned, recovery status | 🟠 High |
| 24 | **Admin: manual recovery action** | Admin can manually trigger a recovery SMS/email or mark a cart as resolved from the dashboard | 🟡 Medium |
| 25 | **Optional recovery incentive** | Optionally attach a discount code to the recovery message to sweeten the return | 🟢 Low |

#### E2. Incomplete / Failed Order Recovery
Targets orders that were submitted but failed due to technical errors, session timeouts, or checkout bugs — the customer *intended* to buy but was blocked.

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 26 | **Failed order detection** | Capture orders that entered the checkout flow but got a server error, timeout, or validation failure — saved as status `failed` in Firestore | 🟠 High |
| 27 | **Admin: failed orders list** | Separate tab/view in the dashboard showing failed orders with customer info, cart contents, error reason, and timestamp | 🟠 High |
| 28 | **Customer notification on failure** | Auto-send SMS/WhatsApp to inform the customer that their order had an issue and provide a retry link | 🟠 High |
| 29 | **Admin: retry / manual resolve** | Admin can contact the customer directly, manually create the order on their behalf, or mark it as resolved | 🟡 Medium |
| 30 | **Error reason logging** | Log the technical reason for failure (e.g., "Firestore write timeout", "validation failed: missing wilaya") to help debug recurring issues | 🟡 Medium |

### 💰 F. Discounts & Promotions — `Priority: 🟠 HIGH`
> A full discount engine, separate from and more powerful than the basic coupon system.
> **Coupons** = code the customer types. **Discounts** = automatic rules applied by the system.

#### F1. Automatic Discounts (Rule-Based, No Code Required)

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 31 | **Percentage discount** | e.g., "20% off all orders" — applied automatically at checkout when conditions are met | 🟠 High |
| 32 | **Fixed amount discount** | e.g., "500 DA off when cart total ≥ 3,000 DA" | 🟠 High |
| 33 | **Minimum order threshold** | Discount only applies if cart total reaches a set amount | 🟠 High |
| 34 | **Category-specific discount** | e.g., "15% off everything in Mode & Accessoires" | 🟡 Medium |
| 35 | **Product-specific discount** | Apply a discount to specific products (shown as a sale badge on product cards) | 🟡 Medium |
| 36 | **Free shipping discount** | Automatically waive delivery fees when cart meets a threshold | 🟡 Medium |
| 37 | **Discount scheduling** | Set start and end date/time for any discount (sale periods) | 🟠 High |
| 38 | **Discount stacking rules** | Control whether multiple discounts can combine on a single order | 🟡 Medium |

#### F2. Admin Discount Management

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 39 | **Discount manager UI** | Admin page to create, edit, activate/deactivate, and delete discount rules | 🟠 High |
| 40 | **Usage limits** | Set max total uses or max uses per customer for each discount | 🟡 Medium |
| 41 | **Active discounts overview** | Dashboard card showing currently active discounts and how many orders used each | 🟡 Medium |
| 42 | **Discount badge on product cards** | Show "−20%" or "SOLDES" badge on product thumbnails when a discount applies | 🟠 High |
| 43 | **Discount applied indicator at checkout** | Clear breakdown in cart/checkout showing which discount was applied and how much was saved | 🟠 High |

### 📧 G. Email Notifications (Customer + Admin) — `Priority: 🟡 MEDIUM`
> All emails go to the **customer** AND a copy/alert goes to the **admin email**.

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 44 | **Order confirmation email → Customer** | Auto-send to customer on order creation with full order summary | 🟡 Medium |
| 45 | **Order confirmation alert → Admin** | Notify admin email of every new order with customer name, items, total, wilaya | 🟡 Medium |
| 46 | **Shipping notification email → Customer** | Send when order status changes to "Shipped" with tracking info | 🟡 Medium |
| 47 | **Shipping update alert → Admin** | Confirm to admin that the shipping email was sent successfully | 🟢 Low |
| 48 | **Welcome email → Customer** | Send on new customer registration | 🟢 Low |
| 49 | **Abandoned cart alert → Admin** | Notify admin when a cart is detected as abandoned (with cart value and customer contact) | 🟡 Medium |
| 50 | **Failed order alert → Admin** | Immediate alert to admin when an order fails, with error details and customer info | 🟠 High |

### 🔍 H. Advanced Product Features — `Priority: 🟡 MEDIUM`

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 51 | **Related products section** | "You might also like" — same-category products on detail page | 🟡 Medium |
| 52 | **Product collections** | Curated groups like "Summer Sale", "New Arrivals" | 🟡 Medium |
| 53 | **Advanced filters** | Filter by brand, availability, rating, new arrivals | 🟡 Medium |
| 54 | **Per-product SEO** | Custom meta title, description, OG tags per product | 🟡 Medium |

### 📤 I. Bulk Operations & Exports — `Priority: 🟡 MEDIUM`

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 55 | **CSV product import** | Upload a CSV file to create/update products in bulk | 🟡 Medium |
| 56 | **CSV product export** | Download all products as CSV from dashboard | 🟡 Medium |
| 57 | **Order export to CSV/Excel** | Export filtered orders for accounting or shipping logistics | 🟡 Medium |

### 🖼️ J. Media & Performance — `Priority: 🟢 LOW`

| # | Feature | Details | Priority |
|---|---------|---------|----------|
| 58 | **Image optimization on upload** | Auto-compress and resize images server-side before storing | 🟢 Low |
| 59 | **Custom branded error pages** | Styled 404 and 500 error pages | 🟢 Low |
| 60 | **Delivery zone management** | Admin UI to configure zones, exclusions, and estimated timeframes | 🟢 Low |

---

## 📊 IMPLEMENTATION ORDER (Recommended)

```
Phase 1 (Core) — Auth + Customer Accounts
  ├── Firebase Auth setup (email + Google)
  ├── Auth Context Provider
  ├── Login / Register pages
  ├── Users collection + middleware
  ├── Customer dashboard (orders, profile, addresses)
  └── Migrate all Basic plan features

Phase 2 (Tracking + Recovery) — Order Tracking + Wishlist + Recovery
  ├── Tracking history data model
  ├── Public tracking page + visual pipeline
  ├── Wishlist system (account-based)
  ├── Admin tracking note updates
  ├── Cart session tracking (abandoned cart)
  ├── Abandonment detection + SMS/email recovery
  ├── Failed order detection + logging
  └── Admin: abandoned carts + failed orders views

Phase 3 (Discounts) — Full Discount Engine
  ├── Discount data model (Firestore `discounts` collection)
  ├── Automatic discount rules engine (percentage, fixed, shipping)
  ├── Discount scheduling + stacking logic
  ├── Admin discount manager UI
  ├── Discount badge on product cards
  └── Cart/checkout discount breakdown display

Phase 4 (Notifications) — Email System
  ├── Email service setup (Firebase Functions + Resend/SendGrid)
  ├── Order confirmation email (customer + admin)
  ├── Shipping notification email
  ├── Abandoned cart alert (customer recovery + admin alert)
  ├── Failed order alert (admin)
  └── Welcome email

Phase 5 (Advanced) — Bulk + Product + Media
  ├── CSV import/export for products
  ├── Order export
  ├── Related products + collections
  ├── Advanced filtering
  ├── Image optimization pipeline
  ├── Per-product SEO tools
  ├── Custom error pages
  └── Delivery zone management UI
```

---

## 📈 NEW FEATURE COUNT SUMMARY

| Category | New Features |
|----------|:-----------:|
| Customer Auth & Accounts | 6 |
| Customer Dashboard | 5 |
| Order Tracking | 4 |
| Wishlist | 3 |
| Abandoned Cart Recovery | 7 |
| Incomplete/Failed Order Recovery | 5 |
| Discounts & Promotions | 13 |
| Email Notifications (Customer + Admin) | 7 |
| Advanced Product Features | 4 |
| Bulk Operations & Exports | 3 |
| Media & Performance | 3 |
| **TOTAL NEW** | **60** |

> **Grand Total (Inherited 66 + New 60) = 126 features**

---

## ❌ REMOVED FROM THIS TIER

These were previously planned but have been removed:

| Feature | Reason | Moved To |
|---------|--------|----------|
| ~~Blog / Content Pages~~ | Removed by client decision | — |
| ~~Multi-language (FR/EN/AR)~~ | Removed by client decision | — |
| ~~RTL support (Arabic)~~ | Removed by client decision | — |
| ~~Locale-aware routes~~ | Removed by client decision | — |

---

## 🚫 FEATURES EXPLICITLY NOT IN THIS TIER
> These belong to higher tiers only:

* ❌ Online Payment Gateway — Stripe/PayPal/BaridiMob (→ Professional)
* ❌ Advanced Analytics Dashboard — charts, funnels (→ Professional)
* ❌ Flash Sales & Countdown Timers (→ Professional)
* ❌ Loyalty / Points Program (→ Professional)
* ❌ Product Bundles (→ Professional)
* ❌ PWA / Install as App (→ Professional)
* ❌ Multi-currency Display (→ Professional)
* ❌ Return/Refund Management (→ Professional)
* ❌ Multi-Store Support (→ Enterprise)
* ❌ REST/GraphQL API (→ Enterprise)
* ❌ AI Chatbot / AI Descriptions (→ Enterprise)
* ❌ Marketplace / Multi-vendor (→ Enterprise)
* ❌ Courier API Integrations (→ Enterprise)
