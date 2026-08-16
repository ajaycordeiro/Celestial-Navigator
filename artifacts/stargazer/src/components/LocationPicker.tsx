import React, { useState, useEffect, useRef } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Crosshair, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

function buildShortName(result: NominatimResult): string {
  const a = result.address;
  const city = a.city || a.town || a.village;
  const parts = [city, a.state, a.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : result.display_name.split(',').slice(0, 3).join(',').trim();
}

export function LocationPicker({ onDone }: { onDone?: () => void } = {}) {
  const { lat, lon, locationName, setLocation, detectLocation, isDetecting, error } = useSkyLocation();

  // City search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Manual lat/lon fallback
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Nominatim search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!res.ok) throw new Error('Search failed');
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setDropdownOpen(data.length > 0);
      } catch {
        setSearchError('Could not reach search service. Try manual coordinates.');
        setResults([]);
        setDropdownOpen(false);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelectResult = (result: NominatimResult) => {
    const name = buildShortName(result);
    setLocation(parseFloat(result.lat), parseFloat(result.lon), name);
    setQuery('');
    setResults([]);
    setDropdownOpen(false);
    onDone?.();
  };

  const handleDetect = async () => {
    await detectLocation();
    onDone?.();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const parts = manualInput.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setLocation(parts[0], parts[1], `${parts[0].toFixed(4)}°, ${parts[1].toFixed(4)}°`);
      setManualInput('');
      setShowManual(false);
      onDone?.();
    } else {
      alert('Enter coordinates as "latitude, longitude", e.g. "51.5, -0.1".');
    }
  };

  return (
    <div className="bg-card/50 border border-card-border rounded-xl p-6 backdrop-blur-sm max-w-xl mx-auto shadow-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Navigation className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-mono text-foreground glow-text">Initialize Observatory</h2>
          <p className="text-sm text-muted-foreground">Set your location to compute celestial positions.</p>
        </div>
      </div>

      {(error || searchError) && (
        <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20 text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || searchError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {/* GPS button */}
        <Button
          onClick={handleDetect}
          disabled={isDetecting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all"
        >
          {isDetecting ? (
            <span className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 animate-spin" /> Detecting Signal…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Auto-Detect via GPS
            </span>
          )}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="flex-shrink-0 mx-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">or search by city</span>
          <div className="flex-grow border-t border-border" />
        </div>

        {/* City search */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="e.g. London, Dubai, Phoenix AZ…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setDropdownOpen(true)}
              className="pl-9 font-mono bg-background/50 border-input placeholder:text-muted-foreground/50"
              autoComplete="off"
            />
            {searching && (
              <Crosshair className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {dropdownOpen && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card/95 backdrop-blur shadow-xl overflow-hidden">
              {results.map(r => (
                <button
                  key={r.place_id}
                  onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors border-b border-border/40 last:border-0 flex flex-col gap-0.5"
                >
                  <span className="font-medium text-foreground">{buildShortName(r)}</span>
                  <span className="text-xs text-muted-foreground truncate">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual lat/lon toggle */}
        <button
          type="button"
          onClick={() => setShowManual(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono mx-auto"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showManual ? 'rotate-180' : ''}`} />
          Enter coordinates manually
        </button>

        {showManual && (
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              placeholder="e.g. 51.5074, -0.1278"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              className="font-mono bg-background/50 border-input placeholder:text-muted-foreground/50"
            />
            <Button type="submit" variant="secondary" className="font-mono text-secondary-foreground shadow-[0_0_10px_rgba(255,165,0,0.2)] shrink-0">
              Set
            </Button>
          </form>
        )}

        {/* Current lock */}
        {lat !== null && lon !== null && (
          <div className="mt-2 pt-4 border-t border-border/50 text-xs text-muted-foreground font-mono flex items-center justify-between gap-2">
            <span className="truncate">📍 {locationName}</span>
            <span className="text-primary/70 shrink-0">{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
          </div>
        )}
      </div>
    </div>
  );
}
