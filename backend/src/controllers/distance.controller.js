import axios from 'axios';

export const calculateDistance = async (req, res) => {
  try {
    const { pickup, drop } = req.query;
    
    if (!pickup || !drop) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pickup and drop locations are required' 
      });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8';
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: pickup,
          destinations: drop,
          key: apiKey
        }
      }
    );
    
    const data = response.data;
    
    if (data.rows && data.rows[0]?.elements[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      
      res.json({
        success: true,
        distance: Math.round(element.distance.value / 1000), // Convert to KM
        duration: Math.round(element.duration.value / 60), // Convert to minutes
        distanceText: element.distance.text,
        durationText: element.duration.text
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Unable to calculate distance'
      });
    }
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to calculate distance' 
    });
  }
};
