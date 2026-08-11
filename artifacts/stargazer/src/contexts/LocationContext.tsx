import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SkyLocation {
  lat: number | null;
  lon: number | null;
  locationName: string;
}

interface LocationContextType extends SkyLocation {
  setLocation: (lat: number, lon: number, name?: string) => void;
  detectLocation: () => Promise<void>;
  isDetecting: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<SkyLocation>(() => {
    try {
      const stored = localStorage.getItem('stargazer-location');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse location from localStorage', e);
    }
    return { lat: null, lon: null, locationName: '' };
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('stargazer-location', JSON.stringify(location));
  }, [location]);

  const setLocation = (lat: number, lon: number, name: string = 'Custom Location') => {
    setLocationState({ lat, lon, locationName: name });
    setError(null);
  };

  const detectLocation = async () => {
    setIsDetecting(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsDetecting(false);
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = pos.coords;
      
      // Simple reverse geocoding via free API or just a generic name
      // We will just use generic name for now, or coordinates
      const name = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
      
      setLocationState({
        lat: latitude,
        lon: longitude,
        locationName: `GPS: ${name}`
      });
    } catch (err: any) {
      setError(err.message || 'Failed to detect location. Please try entering it manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <LocationContext.Provider value={{ ...location, setLocation, detectLocation, isDetecting, error }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useSkyLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useSkyLocation must be used within a LocationProvider');
  }
  return context;
}
