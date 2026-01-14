import prisma from '../config/database.js';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const createBooking = async (req, res) => {
  try {
    const { 
      pickupLocation, 
      dropLocation, 
      bookingType, 
      serviceType,
      startDateTime, 
      duration,
      vehicleType,
      carType,
      estimateAmount 
    } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'User not logged in' });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        pickupLocation,
        dropLocation,
        bookingType,
        serviceType,
        startDateTime: new Date(startDateTime),
        duration,
        vehicleType,
        carType,
        estimateAmount,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking request sent to drivers!'
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEstimate = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, vehicleType } = req.query;
    
    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ success: false, error: 'Pickup and drop locations required' });
    }

    // Validate that locations are not just single characters or too short
    if (pickupLocation.trim().length < 3 || dropLocation.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please select valid pickup and drop locations from autocomplete suggestions' 
      });
    }

    // Check if locations contain proper address components (city, state, etc.)
    const isValidLocation = (location) => {
      const hasComma = location.includes(',');
      const hasMinLength = location.length > 10;
      return hasComma && hasMinLength;
    };

    if (!isValidLocation(pickupLocation) || !isValidLocation(dropLocation)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please select complete addresses from the autocomplete dropdown' 
      });
    }

    // Get distance and duration from Google Maps
    const directionsResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(dropLocation)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (directionsResponse.data.status !== 'OK' || !directionsResponse.data.routes.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unable to calculate route. Please ensure both locations are valid addresses.' 
      });
    }

    const route = directionsResponse.data.routes[0].legs[0];
    const distanceKm = route.distance.value / 1000; // Convert meters to km
    const durationMin = route.duration.value / 60; // Convert seconds to minutes

    // Vehicle-specific pricing
    const vehiclePricing = {
      'Hatchback': { baseFare: 30, perKm: 7, perMin: 1, bookingFee: 10 },
      'Sedan': { baseFare: 40, perKm: 9, perMin: 1.2, bookingFee: 15 },
      'SUV': { baseFare: 50, perKm: 12, perMin: 1.5, bookingFee: 20 }
    };

    const pricing = vehiclePricing[vehicleType] || vehiclePricing['Hatchback'];
    
    // Calculate fare using Uber-like formula
    const baseFare = pricing.baseFare;
    const distanceFare = distanceKm * pricing.perKm;
    const timeFare = durationMin * pricing.perMin;
    const bookingFee = pricing.bookingFee;
    
    let totalFare = baseFare + distanceFare + timeFare + bookingFee;
    
    // Apply surge pricing (random between 1.0 to 1.8)
    const surgeFactor = 1 + (Math.random() * 0.8);
    if (surgeFactor > 1.3) {
      totalFare *= surgeFactor;
    }
    
    const estimate = Math.round(totalFare);
    
    res.json({
      success: true,
      estimate,
      currency: 'INR',
      breakdown: {
        baseFare: Math.round(baseFare),
        distanceFare: Math.round(distanceFare),
        timeFare: Math.round(timeFare),
        bookingFee,
        surgeFactor: surgeFactor > 1.3 ? Math.round(surgeFactor * 100) / 100 : null,
        distance: `${Math.round(distanceKm * 10) / 10} km`,
        duration: `${Math.round(durationMin)} min`
      }
    });
  } catch (error) {
    console.error('Estimate calculation error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate estimate' });
  }
};

export const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: req.user.id
      },
      include: {
        driver: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDriverBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        driverId: req.user.id
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Total Fare=Base Fare+(Distance Fare × km)+(Time Fare × min)+Booking Fee×Surge
// 2️⃣ Example

// Suppose you take UberGo for 5 km, 15 minutes in traffic:

// Base fare: ₹30

// Distance: 5 km × ₹7/km = ₹35

// Time: 15 min × ₹1/min = ₹15

// Booking fee: ₹10

// Total = 30 + 35 + 15 + 10 = ₹90
// (If surge pricing is active, multiply by surge factor, e.g., ×1.5 → ₹135)