import React, { useState } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetStars, getGetStarsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Sparkles, ArrowUp, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getSpectralColor(type: string): string {
  const firstChar = type.charAt(0).toUpperCase();
  switch (firstChar) {
    case 'O': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'; // Blue
    case 'B': return 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]'; // Light blue
    case 'A': return 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'; // White
    case 'F': return 'bg-yellow-100 shadow-[0_0_10px_rgba(254,240,138,0.8)]'; // Yellow-white
    case 'G': return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]'; // Yellow
    case 'K': return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]'; // Orange
    case 'M': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'; // Red
    default: return 'bg-gray-300';
  }
}

export default function Stars() {
  const { lat, lon } = useSkyLocation();
  const [aboveHorizonOnly, setAboveHorizonOnly] = useState(true);
  
  const { data: stars, isLoading } = useGetStars(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetStarsQueryKey({ lat: lat!, lon: lon! }) } }
  );

  const filteredStars = React.useMemo(() => {
    if (!stars) return [];
    const filtered = aboveHorizonOnly ? stars.filter(s => s.altitude > 0) : stars;
    return filtered.sort((a, b) => a.magnitude - b.magnitude); // Brighter first (lower magnitude)
  }, [stars, aboveHorizonOnly]);

  return (
    <div className="flex flex-col gap-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-secondary" />
            Notable Stars
          </h1>
          <p className="text-muted-foreground mt-2">Brightest stars and constellations in your sky.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card/50 p-3 rounded-lg border border-border/50">
          <label htmlFor="horizon-filter" className="text-sm font-mono text-foreground cursor-pointer">
            Above Horizon Only
          </label>
          <Switch 
            id="horizon-filter" 
            checked={aboveHorizonOnly} 
            onCheckedChange={setAboveHorizonOnly} 
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-card/50" />
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredStars.map((star, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={star.name}
              >
                <Card className="p-5 bg-card/40 backdrop-blur border-border/50 hover:bg-card/60 transition-colors h-full flex flex-col hover-elevate">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSpectralColor(star.spectralType)}`} title={`Class ${star.spectralType}`} />
                        <h2 className="text-xl font-bold">{star.name}</h2>
                      </div>
                      <div className="text-sm text-primary font-mono mt-1">{star.constellation}</div>
                    </div>
                    {star.altitude > 30 && (
                      <div className="flex items-center text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 gap-1 whitespace-nowrap">
                        <ArrowUp className="w-3 h-3" /> High
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {star.description}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-background/50 rounded p-2">
                    <div>
                      <span className="text-muted-foreground block mb-1">MAG</span>
                      <span className="text-foreground">{star.magnitude.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">ALT</span>
                      <span className={star.altitude > 0 ? 'text-primary' : 'text-muted-foreground'}>{star.altitude.toFixed(0)}°</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">DIST</span>
                      <span className="text-foreground">{star.distanceLY} ly</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredStars.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground font-mono bg-card/20 rounded-xl border border-dashed border-border">
              No prominent stars currently in view with current filters.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
