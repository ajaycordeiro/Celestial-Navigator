import React from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetMoon, getGetMoonQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Moon as MoonIcon, Sunrise, Sunset, Navigation, Compass, Calendar, ArrowRight } from 'lucide-react';
import { formatLocalTime, getCompassDirection, formatLocalDate } from '@/lib/utils/astronomy';
import { motion } from 'framer-motion';

function MoonPhaseVisual({ phase }: { phase: number }) {
  // Phase is 0 to 1
  // 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  
  // We'll draw an SVG representing the moon.
  // Using paths to draw the crescent/gibbous shapes.
  const isWaxing = phase <= 0.5;
  const mappedPhase = isWaxing ? phase * 2 : (phase - 0.5) * 2; // 0 to 1 for half cycle
  
  // Create the svg path for the terminator line
  // If it's 0 (new) or 1 (full for waxing), it's a circle edge
  const radius = 50;
  const cx = 50;
  const cy = 50;
  
  // A simple approximation for the moon phase shadow
  // We use SVG masking to show the illuminated part
  
  return (
    <div className="relative w-48 h-48 mx-auto md:w-64 md:h-64 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
      <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-15deg]">
        <defs>
          <filter id="moon-mask">
            {/* The whole moon circle */}
            <circle cx="50" cy="50" r="48" fill="white" />
            
            {/* The shadow part */}
            {/* Simple trick: a black circle moving across to simulate phase.
                Not perfectly accurate but gives a good visual vibe without complex math */}
            {isWaxing ? (
              // Waxing: shadow moves from right to left
              <ellipse 
                cx={50 + (1 - mappedPhase * 2) * 50} 
                cy="50" 
                rx={Math.abs(1 - mappedPhase * 2) * 48} 
                ry="48" 
                fill={mappedPhase < 0.5 ? "black" : "white"} 
              />
            ) : (
              // Waning: shadow moves from left to right
              <ellipse 
                cx={50 - (1 - mappedPhase * 2) * 50} 
                cy="50" 
                rx={Math.abs(1 - mappedPhase * 2) * 48} 
                ry="48" 
                fill={mappedPhase < 0.5 ? "white" : "black"} 
              />
            )}
            
            {/* Base left/right shading to combine with the ellipse */}
            {isWaxing ? (
              <rect x="0" y="0" width={50} height="100" fill="black" />
            ) : (
              <rect x="50" y="0" width={50} height="100" fill="black" />
            )}
          </filter>
        </defs>
        
        {/* Background (unilluminated part) */}
        <circle cx="50" cy="50" r="48" className="fill-background stroke-border stroke-1" />
        
        {/* Illuminated part */}
        <circle cx="50" cy="50" r="48" className="fill-slate-200" filter="url(#moon-mask)" />
        
        {/* Craters texture (very subtle overlay) */}
        <circle cx="30" cy="30" r="8" className="fill-black/10" filter="url(#moon-mask)"/>
        <circle cx="70" cy="40" r="12" className="fill-black/10" filter="url(#moon-mask)"/>
        <circle cx="45" cy="70" r="10" className="fill-black/10" filter="url(#moon-mask)"/>
        <circle cx="20" cy="60" r="5" className="fill-black/10" filter="url(#moon-mask)"/>
      </svg>
    </div>
  );
}

export default function Moon() {
  const { lat, lon } = useSkyLocation();
  const { data: moon, isLoading } = useGetMoon(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetMoonQueryKey({ lat: lat!, lon: lon! }) } }
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-sans flex items-center gap-3">
          <MoonIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          Lunar Telemetry
        </h1>
        <p className="text-muted-foreground mt-2">Current phase and orbital parameters.</p>
      </header>

      {isLoading || !moon ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-xl bg-card/50" />
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl bg-card/50" />
            <Skeleton className="h-32 rounded-xl bg-card/50" />
            <Skeleton className="h-32 rounded-xl bg-card/50" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-card/30 border border-border/50 rounded-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
            
            <MoonPhaseVisual phase={moon.phase} />
            
            <div className="mt-8 text-center relative z-10">
              <h2 className="text-3xl font-bold tracking-tight">{moon.phaseName}</h2>
              <p className="text-primary font-mono mt-1 text-lg glow-text">{moon.illumination.toFixed(1)}% Illuminated</p>
            </div>
          </motion.div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 bg-card/60 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
                <h3 className="text-sm font-mono text-muted-foreground uppercase mb-4 tracking-wider">Positional Data</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm"><Navigation className="w-4 h-4 shrink-0" /> Altitude</div>
                    <div className="text-xl sm:text-2xl font-mono">{moon.altitude.toFixed(1)}°</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm"><Compass className="w-4 h-4 shrink-0" /> Azimuth</div>
                    <div className="text-xl sm:text-2xl font-mono">{moon.azimuth.toFixed(0)}° <span className="text-sm text-primary">{getCompassDirection(moon.azimuth)}</span></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm"><Sunrise className="w-4 h-4 shrink-0" /> Moonrise</div>
                    <div className="text-lg sm:text-xl font-mono">{formatLocalTime(moon.riseTime)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm"><Sunset className="w-4 h-4 shrink-0" /> Moonset</div>
                    <div className="text-lg sm:text-xl font-mono">{formatLocalTime(moon.setTime)}</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-card/60 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
                <h3 className="text-sm font-mono text-muted-foreground uppercase mb-4 tracking-wider">Orbital Metrics</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <div className="text-muted-foreground mb-1 text-sm">Distance from Earth</div>
                    <div className="text-lg sm:text-2xl font-mono text-secondary glow-text-secondary break-words">{moon.distanceKm.toLocaleString()} <span className="text-sm">km</span></div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 text-sm">Age of Cycle</div>
                    <div className="text-lg sm:text-2xl font-mono">{moon.age.toFixed(1)} <span className="text-sm">days</span></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4 mt-auto"
            >
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-primary text-sm mb-2"><Calendar className="w-4 h-4"/> Next Full Moon</div>
                <div className="text-lg font-mono font-medium">{formatLocalDate(moon.nextFullMoon)}</div>
              </div>
              <div className="bg-background rounded-xl border border-border p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2"><Calendar className="w-4 h-4"/> Next New Moon</div>
                <div className="text-lg font-mono font-medium">{formatLocalDate(moon.nextNewMoon)}</div>
              </div>
            </motion.div>

          </div>
        </div>
      )}
    </div>
  );
}
