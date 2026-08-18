# Customer & Subscription Feature Updates

Summary of the recent customer portal and subscription package changes.

## 1. Round Trip Label Display

When a customer selects **Round Trip**, the "(Round trip)" label now appears so the trip type is always clear.

Changed in `frontend/pages/customer/CustomerPortal.tsx`:

- **Distance card** – shows `(Round trip)` next to duration & usage:

  `3h 30m • Round Trip (Round trip)`

- **Estimated fare** – shows `(Round trip)` next to the fare description:

  `Estimated fare ₹2,500 (Round trip)`

Label is controlled by a simple condition:

```tsx
{formData.tripType === 'Round Trip' ? ' (Round trip)' : ''}
```

## 2. Return Date & Time for Round Trips

Added a separate return (end) date and time for outstation round trips, so bookings show both going and return details.

- New `endDateTime` field added to the `Booking` model (`backend/prisma/schema.prisma`).
- `createBooking` now saves `endDateTime` (`backend/src/controllers/booking.controller.js`).
- Customer portal (`CustomerPortal.tsx`):
  - New **"From Date & Time"** / **"To Date & Time (Return)"** pickers when trip type is Round Trip.
  - Validation requires return date & time for round trips.
  - Booking cards show **"🚗 Going — date, time"** and **"🏠 Return — date, time"**.
- Return date/time also shown in admin `BookingWorkflow.tsx`, `Reports.tsx`, and driver `DriverBookingRequests.tsx`.

## 3. Subscription Package Categories

Added a `category` field to subscription plans for Silver / Gold / Platinum / Diamond tiers and category-based pricing display.

- New `category` field on `SubscriptionPlan` model (`backend/prisma/schema.prisma`).
- Backend (`backend/src/controllers/subscription.controller.js`):
  - `VALID_CATEGORIES = ['Silver', 'Gold', 'Platinum', 'Diamond']`.
  - Create/update plan accepts `category`, defaults to `Silver` when invalid.
  - Plans sorted by tier (Silver → Gold → Platinum), then duration.
- Seed scripts updated with categories (`seed-packages.js`, `seed-new-packages.js`, `seed-production.js`).
- Admin package manager (`ManagePackages.tsx`):
  - Category selector/filter (All, Silver, Gold, Platinum).
  - New package form has a **Category** dropdown.
  - Plans grouped & rendered under category headings with pricing.
- Admin & driver portals updated to display category.

## Files changed

| Area | Files |
| --- | --- |
| Backend | `backend/prisma/schema.prisma`, `backend/prisma/add_category_backfill.sql`, `backend/src/controllers/booking.controller.js`, `backend/src/controllers/subscription.controller.js`, seed scripts |
| Frontend | `frontend/pages/customer/CustomerPortal.tsx`, `frontend/pages/customer/CustomerBookingStatus.tsx`, `frontend/pages/admin/AdminPortal.tsx`, `frontend/pages/admin/ManagePackages.tsx`, `frontend/pages/admin/BookingWorkflow.tsx`, `frontend/pages/admin/Reports.tsx`, `frontend/pages/driver/DriverPortal.tsx`, `frontend/pages/driver/DriverBookingRequests.tsx` |
