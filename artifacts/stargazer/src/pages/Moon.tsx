import React from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetMoon, getGetMoonQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Moon as MoonIcon, Sunrise, Sunset, Navigation, Compass, Calendar, ArrowRight } from 'lucide-react';
import { formatLocalTime, formatLocalDate, getCompassDirection, getTzAbbr } from '@/lib/utils/astronomy';
import { motion } from 'framer-motion';

function MoonPhaseVisual({ phase }: { phase: number }) {
  // phase: 0=new moon, 0.25=first quarter, 0.5=full moon, 0.75=last quarter
  const r = 47;
  const cx = 50, cy = 50;

  // Illuminated fraction (0–1) from the phase angle
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

  // The terminator is an ellipse whose horizontal semi-axis shrinks from r (new/full)
  // to 0 (quarter) and whose side (left/right) indicates waxing vs waning.
  const termRx = r * Math.abs(1 - 2 * illum); // r·|cos(2π·phase)|

  const waxing = phase <= 0.5;
  const top = `${cx} ${cy - r}`;
  const bot = `${cx} ${cy + r}`;

  // Build the lit-area path:
  //   1. A semicircle arc along the bright edge (right for waxing, left for waning)
  //   2. An ellipse arc back along the terminator
  // Sweep flags (0=counterclockwise, 1=clockwise in SVG):
  //   Waxing crescent (illum ≤ 0.5): main=CW(1), terminator=CCW(0) → right sliver
  //   Waxing gibbous  (illum > 0.5): main=CW(1), terminator=CW(1)  → most of disk
  //   Waning gibbous  (illum ≥ 0.5): main=CCW(0), terminator=CW(1) → most of disk
  //   Waning crescent (illum < 0.5): main=CCW(0), terminator=CCW(0) → left sliver
  let path: string;
  if (waxing) {
    const ts = illum > 0.5 ? 1 : 0;
    path = `M ${top} A ${r} ${r} 0 0 1 ${bot} A ${termRx} ${r} 0 0 ${ts} ${top} Z`;
  } else {
    const ts = illum >= 0.5 ? 1 : 0;
    path = `M ${top} A ${r} ${r} 0 0 0 ${bot} A ${termRx} ${r} 0 0 ${ts} ${top} Z`;
  }

  return (
    <div className="relative w-48 h-48 mx-auto md:w-64 md:h-64">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_40px_rgba(180,210,255,0.15)]">
        <defs>
          <clipPath id="lit-clip">
            <path d={path} />
          </clipPath>
          <radialGradient id="disk-grad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e2d45" />
            <stop offset="100%" stopColor="#0a1220" />
          </radialGradient>
          <radialGradient id="lit-grad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f0f4ff" />
            <stop offset="100%" stopColor="#c8d8f0" />
          </radialGradient>
        </defs>

        {/* Dark moon disk */}
        <circle cx={cx} cy={cy} r={r} fill="url(#disk-grad)" />

        {/* Unlit surface craters (always visible, subtly) */}
        <circle cx="33" cy="34" r="9" fill="#12213a" opacity="0.7" />
        <circle cx="64" cy="41" r="13" fill="#12213a" opacity="0.6" />
        <circle cx="47" cy="69" r="10" fill="#12213a" opacity="0.6" />
        <circle cx="22" cy="60" r="6"  fill="#12213a" opacity="0.7" />
        <circle cx="58" cy="22" r="5"  fill="#12213a" opacity="0.5" />

        {/* Illuminated region */}
        <path d={path} fill="url(#lit-grad)" />

        {/* Crater texture clipped to lit area */}
        <g clipPath="url(#lit-clip)" opacity="0.18">
          <circle cx="33" cy="34" r="9"  fill="#4a6080" />
          <circle cx="64" cy="41" r="13" fill="#4a6080" />
          <circle cx="47" cy="69" r="10" fill="#4a6080" />
          <circle cx="22" cy="60" r="6"  fill="#4a6080" />
          <circle cx="58" cy="22" r="5"  fill="#4a6080" />
        </g>

        {/* Soft limb edge */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(180,210,255,0.10)" strokeWidth="2" />
      </svg>
    </div>
  );
}

export default function Moon() {
  const { lat, lon, timezone } = useSkyLocation();
  const tzLabel = getTzAbbr(timezone);
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
                    <div className="text-lg sm:text-xl font-mono">{formatLocalTime(moon.riseTime, timezone)} {tzLabel && <span className="text-xs text-muted-foreground">{tzLabel}</span>}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm"><Sunset className="w-4 h-4 shrink-0" /> Moonset</div>
                    <div className="text-lg sm:text-xl font-mono">{formatLocalTime(moon.setTime, timezone)} {tzLabel && <span className="text-xs text-muted-foreground">{tzLabel}</span>}</div>
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
                <div className="text-lg font-mono font-medium">{formatLocalDate(moon.nextFullMoon, timezone)} {tzLabel && <span className="text-xs text-muted-foreground">{tzLabel}</span>}</div>
              </div>
              <div className="bg-background rounded-xl border border-border p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2"><Calendar className="w-4 h-4"/> Next New Moon</div>
                <div className="text-lg font-mono font-medium">{formatLocalDate(moon.nextNewMoon, timezone)} {tzLabel && <span className="text-xs text-muted-foreground">{tzLabel}</span>}</div>
              </div>
            </motion.div>

          </div>
        </div>
      )}
    </div>
  );
}
