# Service Area Management - Setup Instructions

## What This Feature Does
Admin can define service areas (like Bangalore with 50km radius). When customers select pickup/drop locations outside these areas, they see "Sorry, service not available in this area."

## Files Created/Modified

### Backend:
1. **Database Schema** - `backend/prisma/schema.prisma`
   - Added `ServiceArea` model with name, city, state, radius, latitude, longitude

2. **Controller** - `backend/src/controllers/serviceArea.controller.js`
   - CRUD operations for service areas
   - `checkServiceAvailability()` - checks if location is within service radius

3. **Routes** - `backend/src/routes/serviceArea.routes.js`
   - GET /api/service-areas - List all areas
   - POST /api/service-areas - Create area
   - PUT /api/service-areas/:id - Update area
   - DELETE /api/service-areas/:id - Delete area
   - GET /api/service-areas/check?latitude=X&longitude=Y - Check availability

4. **App.js** - `backend/src/app.js`
   - Added service area routes

### Frontend:
1. **Admin Component** - `frontend/components/admin/ServiceAreaManagement.tsx`
   - UI to add/edit/delete service areas
   - Toggle active/inactive status
   - Shows area name, city, state, radius

2. **API Helper** - `frontend/api/serviceArea.ts`
   - `checkServiceAvailability()` function

3. **Customer Portal** - `frontend/pages/customer/CustomerPortal.tsx`
   - Added validation before booking
   - Checks both pickup and drop locations
   - Shows error if service not available

4. **Admin Portal** - `frontend/pages/admin/AdminPortal.tsx`
   - Added "SERVICE_AREAS" tab

## Setup Steps

### 1. Update Database
Run this command in backend folder:
```bash
cd backend
npx prisma db push
```

### 2. Add Sample Service Area
After starting the backend server, you can add Bangalore as a service area:
- Name: Bangalore Central
- City: Bangalore
- State: Karnataka
- Radius: 50 (km)
- Latitude: 12.9716
- Longitude: 77.5946

## How It Works

1. **Admin adds service area:**
   - Goes to Admin Portal → SERVICE_AREAS tab
   - Clicks "Add Service Area"
   - Enters area details (name, city, radius, center coordinates)
   - Saves

2. **Customer books ride:**
   - Enters pickup location
   - Enters drop location
   - Clicks "Request Driver"
   - System converts addresses to coordinates
   - Checks if both locations are within any active service area
   - If outside: Shows "Sorry, service not available in [pickup/drop] area"
   - If inside: Proceeds with booking

## Example Service Areas

**Bangalore:**
- Latitude: 12.9716
- Longitude: 77.5946
- Radius: 50 km

**Mysore:**
- Latitude: 12.2958
- Longitude: 76.6394
- Radius: 30 km

**Chennai:**
- Latitude: 13.0827
- Longitude: 80.2707
- Radius: 40 km
