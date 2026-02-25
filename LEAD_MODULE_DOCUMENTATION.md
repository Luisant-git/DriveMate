# LEAD Module Implementation

## Overview
The LEAD module has been created with the same functionality as drivers but with separate packages and subscriptions. Leads can accept customer bookings for pickup and drop services.

## Database Schema Changes

### New Models Added:

1. **Lead Model** (`leads` table)
   - Same structure as Driver model
   - Fields: id, name, email, phone, password, aadharNo, licenseNo, photos, contact details, status, location, rating, etc.
   - Separate from drivers with own authentication

2. **LeadSubscriptionPlan Model** (`lead_subscription_plans` table)
   - Separate subscription plans for leads
   - Fields: name, duration, price, description, type (LOCAL/OUTSTATION/ALL_PREMIUM)

3. **LeadSubscription Model** (`lead_subscriptions` table)
   - Tracks lead subscriptions
   - Links leads to their subscription plans
   - Fields: leadId, planId, status, dates, amounts, payment details

4. **LeadBooking Model** (`lead_bookings` table)
   - Separate booking table for leads
   - Same structure as regular bookings
   - Fields: customerId, leadId, pickup/drop locations, booking details, status

5. **LeadBookingResponse Model** (`lead_booking_responses` table)
   - Tracks lead responses to bookings
   - Similar to driver booking responses

## Backend Files Created:

### Controllers:
1. **`backend/src/controllers/lead.controller.js`**
   - `registerLead()` - Lead registration
   - `loginLead()` - Lead authentication
   - `getAllLeads()` - Get all leads (admin)
   - `updateLeadStatus()` - Approve/reject leads
   - `updateLeadProfile()` - Lead profile updates

2. **`backend/src/controllers/leadSubscription.controller.js`**
   - `getAllLeadPlans()` - Get subscription plans
   - `createLeadPlan()` - Create new plan (admin)
   - `createLeadSubscription()` - Assign subscription to lead
   - `getLeadSubscriptions()` - Get lead's subscriptions

### Routes:
1. **`backend/src/routes/lead.routes.js`**
   - POST `/api/leads/register` - Register new lead
   - POST `/api/leads/login` - Lead login
   - GET `/api/leads` - Get all leads
   - PATCH `/api/leads/:id/status` - Update lead status
   - PATCH `/api/leads/profile` - Update lead profile

2. **`backend/src/routes/leadSubscription.routes.js`**
   - GET `/api/lead-subscriptions/plans` - Get all plans
   - POST `/api/lead-subscriptions/plans` - Create plan
   - POST `/api/lead-subscriptions` - Create subscription
   - GET `/api/lead-subscriptions/my-subscriptions` - Get lead subscriptions

### Middleware:
- **`authenticateLead()`** added to `backend/src/middleware/auth.js`
  - Validates JWT tokens for lead users
  - Checks user type is 'lead'

## Frontend Changes:

### Types:
- **`frontend/types.ts`**
  - Added `LEAD` to `UserRole` enum
  - Added `Lead` interface (same structure as Driver)

## Next Steps to Complete:

1. **Add routes to main server file**
   ```javascript
   import leadRoutes from './routes/lead.routes.js';
   import leadSubscriptionRoutes from './routes/leadSubscription.routes.js';
   
   app.use('/api/leads', leadRoutes);
   app.use('/api/lead-subscriptions', leadSubscriptionRoutes);
   ```

2. **Run Prisma migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_lead_module
   npx prisma generate
   ```

3. **Create Frontend Components** (similar to driver components):
   - LeadPortal.tsx - Main lead dashboard
   - LeadRegistration.tsx - Lead registration form
   - LeadLogin.tsx - Lead login page
   - LeadSubscriptionManagement.tsx - Subscription management
   - Admin components for lead management

4. **Create API Services** (frontend/api/):
   - lead.ts - Lead API calls
   - leadSubscription.ts - Subscription API calls

## Key Features:

✅ Separate authentication for leads
✅ Independent subscription plans and pricing
✅ Separate booking system
✅ Same pickup/drop functionality as drivers
✅ Admin can manage leads separately
✅ Leads can accept/reject bookings
✅ Subscription tracking and management

## Database Relationships:

- Lead → LeadSubscription (one-to-many)
- LeadSubscriptionPlan → LeadSubscription (one-to-many)
- Lead → LeadBooking (one-to-many)
- LeadBooking → LeadBookingResponse (one-to-many)
- Customer → LeadBooking (one-to-many)

## Usage:

Leads work exactly like drivers but are managed separately:
- Different subscription plans
- Different pricing structure
- Separate admin management
- Independent booking allocation
- Same customer service functionality
