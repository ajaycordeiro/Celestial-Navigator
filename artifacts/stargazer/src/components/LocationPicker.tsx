import React, { useState } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Crosshair, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LocationPicker() {
  const { lat, lon, locationName, setLocation, detectLocation, isDetecting, error } = useSkyLocation();
  const [manualInput, setManualInput] = useState('');
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    // Simple parsing for "lat, lon" format
    const parts = manualInput.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setLocation(parts[0], parts[1], `Custom: ${parts[0]}, ${parts[1]}`);
      setManualInput('');
    } else {
      // In a real app we'd geocode the city name here.
      // For now, if they enter something else, we just alert.
      alert('Please enter coordinates in "latitude, longitude" format, e.g., "51.5, -0.1".');
    }
  };

  return (
    <div className="bg-card/50 border border-card-border rounded-xl p-6 backdrop-blur-sm max-w-xl mx-auto shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Navigation className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-mono text-foreground glow-text">Initialize Observatory</h2>
          <p className="text-sm text-muted-foreground">Set your coordinates to compute celestial positions.</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20 text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Button 
          onClick={detectLocation} 
          disabled={isDetecting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all"
        >
          {isDetecting ? (
            <span className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 animate-spin" /> Detecting Signal...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Auto-Detect via GPS
            </span>
          )}
        </Button>
        
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">or manual override</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            placeholder="e.g. 51.5074, -0.1278"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="font-mono bg-background/50 border-input placeholder:text-muted-foreground/50"
          />
          <Button type="submit" variant="secondary" className="font-mono text-secondary-foreground shadow-[0_0_10px_rgba(255,165,0,0.2)]">
            Set
          </Button>
        </form>
        
        {lat !== null && lon !== null && (
          <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground font-mono flex items-center justify-between">
            <span>Current Lock: {locationName}</span>
            <span className="text-primary/70">{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
          </div>
        )}
      </div>
    </div>
  );
}
