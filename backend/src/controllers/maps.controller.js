import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      res.json({
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
      });
    } else {
      res.status(404).json({ error: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDirections = async (req, res) => {
  try {
    const { origin, destination } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      res.json(response.data);
    } else {
      res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const findNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // This would typically query your database for nearby drivers
    // For now, returning mock data
    const nearbyDrivers = [
      {
        id: 'd1',
        name: 'Ragul V',
        lat: parseFloat(lat) + 0.01,
        lng: parseFloat(lng) + 0.01,
        rating: 4.8,
        distance: '0.5 km'
      },
      {
        id: 'd2',
        name: 'Suresh Singh',
        lat: parseFloat(lat) - 0.01,
        lng: parseFloat(lng) - 0.01,
        rating: 4.2,
        distance: '1.2 km'
      }
    ];

    res.json({ drivers: nearbyDrivers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};