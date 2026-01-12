import React, { useEffect, useRef } from 'react';

interface RouteMapProps {
  pickup: string;
  drop: string;
  apiKey: string;
}

const RouteMap: React.FC<RouteMapProps> = ({ pickup, drop, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#8a8a8a" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#ccebd7" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#b3d9ff" }]
    }
  ];

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !pickup || !drop) return;

      // Initialize map
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 11.6643, lng: 78.1460 }, // Salem coordinates as default
        zoom: 13,
        styles: mapStyles,
        disableDefaultUI: true
      });

      // Initialize directions service and renderer
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#000000',
          strokeWeight: 4,
        },
      });

      directionsRendererRef.current.setMap(mapInstanceRef.current);

      // Calculate and display route
      calculateRoute();
    };

    const calculateRoute = () => {
      if (!directionsServiceRef.current || !directionsRendererRef.current) return;

      directionsServiceRef.current.route(
        {
          origin: pickup,
          destination: drop,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            directionsRendererRef.current?.setDirections(result);
          } else {
            console.error('Directions request failed due to ' + status);
          }
        }
      );
    };

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      // Cleanup
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [pickup, drop, apiKey]);

  return (
    <div 
      ref={mapRef} 
      className="absolute inset-0 w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};

export default RouteMap;