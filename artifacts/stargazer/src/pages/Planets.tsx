import React from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetPlanets, getGetPlanetsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Orbit, Sunrise, Sunset, Compass, Navigation } from 'lucide-react';
import { formatLocalTime, getCompassDirection, formatMagnitude } from '@/lib/utils/astronomy';
import { motion } from 'framer-motion';

export default function Planets() {
  const { lat, lon } = useSkyLocation();
  const { data: planets, isLoading } = useGetPlanets(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetPlanetsQueryKey({ lat: lat!, lon: lon! }) } }
  );

  const sortedPlanets = React.useMemo(() => {
    if (!planets) return [];
    return [...planets].sort((a, b) => {
      // Sort visible first, then by altitude
      if (a.isVisible && !b.isVisible) return -1;
      if (!a.isVisible && b.isVisible) return 1;
      return b.altitude - a.altitude;
    });
  }, [planets]);

  return (
    <div className="flex flex-col gap-6 pb-20">
      <header>
        <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
          <Orbit className="w-8 h-8 text-primary" />
          Planetary Positions
        </h1>
        <p className="text-muted-foreground mt-2">Current orbital geometry relative to your location.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-card/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedPlanets.map((planet, idx) => (
            <motion.div 
              key={planet.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`p-6 border-border/50 relative overflow-hidden transition-all ${planet.isVisible ? 'bg-card/80 border-primary/30 shadow-[0_0_15px_rgba(0,212,255,0.05)]' : 'bg-card/30 opacity-80'}`}>
                {/* Arc visualization in background */}
                <div className="absolute right-0 top-0 w-32 h-32 opacity-5 pointer-events-none translate-x-8 -translate-y-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full stroke-primary fill-none stroke-2">
                    <circle cx="50" cy="50" r="40" strokeDasharray="4 4" />
                    {planet.isVisible && <circle cx="10" cy="50" r="4" className="fill-primary stroke-none" />}
                  </svg>
                </div>

                <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{planet.name}</h2>
                      {planet.isVisible && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Visible Tonight</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-1 break-words">{planet.type} • {planet.constellation}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-mono text-secondary">{formatMagnitude(planet.magnitude)}</div>
                    <div className="text-xs text-muted-foreground uppercase">Magnitude</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 bg-background/50 p-4 rounded-lg border border-border/50">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 uppercase">
                      <Navigation className="w-3 h-3" /> Altitude
                    </div>
                    <div className={`font-mono ${planet.altitude > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {planet.altitude.toFixed(1)}°
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 uppercase">
                      <Compass className="w-3 h-3" /> Azimuth
                    </div>
                    <div className="font-mono">
                      {planet.azimuth.toFixed(0)}° {getCompassDirection(planet.azimuth)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 uppercase">
                      <Sunrise className="w-3 h-3" /> Rise
                    </div>
                    <div className="font-mono">{formatLocalTime(planet.riseTime)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 uppercase">
                      <Sunset className="w-3 h-3" /> Set
                    </div>
                    <div className="font-mono">{formatLocalTime(planet.setTime)}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-3">
                  <p className="text-muted-foreground leading-relaxed flex-1">{planet.description}</p>
                  <div className="text-right font-mono text-xs shrink-0 bg-accent px-3 py-2 rounded-md self-start sm:self-auto">
                    <span className="block text-muted-foreground">DISTANCE</span>
                    <span className="text-foreground">{planet.distanceAU.toFixed(2)} AU</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
