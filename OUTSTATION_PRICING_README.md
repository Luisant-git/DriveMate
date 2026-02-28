# Outstation Pricing - KM-Based Package Selection

## Overview
This feature automatically selects the appropriate Outstation package (8/10/12 hours) based on the distance (KM) between pickup and drop locations.

## Pricing Structure

| Hours | KM Distance Range | Minimum Charge | Extra Per Hour |
|-------|------------------|----------------|----------------|
| 8 Hours | 60 - 150 KM | ₹850 - ₹950 | ₹100 |
| 10 Hours | 151 - 300 KM | ₹950 - ₹1000 | ₹100 |
| 12 Hours | 300+ KM | ₹1000 - ₹1500 | ₹100 |

**Note:** Extra charges apply for:
- One Way Drop Return Ticket
- Food (for Outstation)

## How It Works

### Customer Flow:
1. Customer selects **Outstation** service type
2. Customer enters **Pickup Location**
3. Customer enters **Drop Location**
4. System automatically:
   - Calculates distance between locations
   - Determines appropriate package (8/10/12 hours)
   - Shows distance, duration, and fare estimate
   - Auto-selects the package in the dropdown

### Technical Implementation:

#### Frontend Components:
- **`distanceCalculator.ts`**: Calculates distance and determines package
- **`fareCalculator.ts`**: Calculates fare based on distance
- **`CustomerPortal.tsx`**: Updated to show distance info and auto-select package

#### Backend Components:
- **`distance.controller.js`**: API endpoint for distance calculation
- **`pricingPackage.controller.js`**: Updated to support KM-based pricing
- **`seed-outstation-pricing.js`**: Seeds database with pricing data

#### Database:
- **`PricingPackage`** model stores:
  - `packageType`: 'OUTSTATION'
  - `hours`: 8, 10, or 12
  - `minimumKm`: Distance threshold
  - `minimumCharge`: Base fare
  - `extraPerHour`: ₹100

## API Endpoints

### Calculate Distance
```
GET /api/distance/calculate?pickup=<location>&drop=<location>
```

**Response:**
```json
{
  "success": true,
  "distance": 250,
  "duration": 300,
  "distanceText": "250 km",
  "durationText": "5 hours"
}
```

### Get Pricing Estimate
```
GET /api/pricing-packages/estimate?packageType=OUTSTATION&hours=10&distance=250
```

**Response:**
```json
{
  "success": true,
  "estimate": 950,
  "pricing": {
    "id": "...",
    "packageType": "OUTSTATION",
    "hours": 10,
    "minimumKm": 150,
    "minimumCharge": 950,
    "extraPerHour": 100,
    "description": "10 Hours Package (151-300 KM)"
  }
}
```

## Setup Instructions

### 1. Seed Outstation Pricing
```bash
cd backend
node seed-outstation-pricing.js
```

### 2. Restart Backend Server
```bash
npm run dev
```

### 3. Test in Customer Portal
1. Open customer portal
2. Select "Outstation" service
3. Enter pickup and drop locations
4. Verify distance calculation and package auto-selection

## Features

✅ **Automatic Distance Calculation**: Uses Google Maps Distance Matrix API  
✅ **Smart Package Selection**: Auto-selects 8/10/12 hours based on KM  
✅ **Real-time Fare Estimate**: Shows pricing immediately after drop location  
✅ **Distance Display**: Shows KM and estimated travel time  
✅ **Package Override**: Users can still manually change package if needed  
✅ **Backend Validation**: Server validates distance-based pricing  

## Future Enhancements

- [ ] Add toll charges based on route
- [ ] Dynamic pricing based on demand
- [ ] Multi-day outstation packages
- [ ] Round-trip distance calculation
- [ ] Route optimization suggestions

## Troubleshooting

### Distance not calculating?
- Check Google Maps API key is valid
- Verify backend `/api/distance/calculate` endpoint is working
- Check browser console for errors

### Wrong package selected?
- Verify distance calculation is correct
- Check `getPackageByDistance()` logic in `distanceCalculator.ts`
- Ensure pricing packages are seeded correctly

### Pricing not showing?
- Verify pricing packages exist in database
- Check `/api/pricing-packages/estimate` endpoint
- Ensure `isActive: true` for pricing packages

## Support

For issues or questions, contact the development team.
