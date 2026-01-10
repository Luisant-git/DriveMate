import prisma from '../config/database.js';
import axios from 'axios';

export const createRide = async (req, res) => {
  try {
    const {
      pickupLat,
      pickupLng,
      pickupAddress,
      dropoffLat,
      dropoffLng,
      dropoffAddress,
    } = req.body;
    const userId = req.user.userId;

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    // Calculate distance and fare
    const { distance, duration, fare } = await calculateRideDetails(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    );

    const ride = await prisma.ride.create({
      data: {
        customerId: customer.id,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        distance,
        duration,
        fare,
      },
      include: {
        customer: { include: { user: true } },
      },
    });

    res.status(201).json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const assignRide = async (req, res) => {
  try {
    const { rideId, driverId } = req.body;

    const ride = await prisma.ride.update({
      where: { id: rideId },
      data: {
        driverId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        customer: { include: { user: true } },
        driver: { include: { user: true } },
      },
    });

    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;

    const updateData = { status };
    
    if (status === 'STARTED') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const ride = await prisma.ride.update({
      where: { id: rideId },
      data: updateData,
    });

    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getPendingRides = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { status: 'REQUESTED' },
      include: {
        customer: { include: { user: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDriverRides = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    const rides = await prisma.ride.findMany({
      where: { driverId: driver.id },
      include: {
        customer: { include: { user: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRideTracking = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        trackingPoints: {
          orderBy: { timestamp: 'asc' },
        },
        driver: { include: { user: true } },
        customer: { include: { user: true } },
      },
    });

    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function calculateRideDetails(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  try {
    const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
    const origin = `${pickupLat},${pickupLng}`;
    const destination = `${dropoffLat},${dropoffLng}`;

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: { origin, destination, key: GOOGLE_KEY },
    });

    const route = response.data.routes[0];
    const leg = route.legs[0];
    
    const distance = leg.distance.value / 1000; // km
    const duration = leg.duration.value / 60; // minutes
    const fare = distance * 15; // ₹15 per km

    return { distance, duration, fare };
  } catch (error) {
    return { distance: 0, duration: 0, fare: 0 };
  }
}