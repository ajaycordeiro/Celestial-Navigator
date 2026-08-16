import { useState, useMemo } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetAnalemma, getGetAnalemmaQueryKey } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { LocationPicker } from '@/components/LocationPicker';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Sun, MapPin, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Seasonal dot colour
function seasonColor(month: number): string {
  if (month === 11 || month <= 1) return '#60A5FA'; // winter – blue
  if (month <= 4)                 return '#4ADE80'; // spring – green
  if (month <= 7)                 return '#FBBF24'; // summer – amber
  return '#F97316';                                  // autumn – orange
}

const SEASONS = [
  { label: 'Winter', color: '#60A5FA' },
  { label: 'Spring', color: '#4ADE80' },
  { label: 'Summer', color: '#FBBF24' },
  { label: 'Autumn', color: '#F97316' },
];

const DENSITIES = ['Daily', 'Weekly', 'Monthly'] as const;
type Density = typeof DENSITIES[number];

// Custom scatter dot
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
  if (payload.isToday) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="none" stroke="#22d3ee" strokeWidth={1.5} opacity={0.4} />
        <circle cx={cx} cy={cy} r={6} fill="#FFFFFF" stroke="#22d3ee" strokeWidth={1.5} />
      </g>
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={density === 'Monthly' ? 5 : density === 'Weekly' ? 4 : 3}
      fill={seasonColor(payload.month)}
      opacity={payload.isAboveHorizon ? 0.85 : 0.18}
    />
  );
}

// Recharts tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-card border border-border/70 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="font-semibold text-foreground mb-1">{p.date}</p>
      <p className="text-muted-foreground">
        Altitude <span className={cn('font-bold', p.isAboveHorizon ? 'text-primary' : 'text-destructive')}>{p.altitude}°</span>
      </p>
      <p className="text-muted-foreground">
        Azimuth <span className="text-foreground font-bold">{p.azimuth}°</span>
      </p>
      <p className="text-muted-foreground">
        Declination <span className="text-secondary">{p.declination}°</span>
      </p>
      {p.isToday && <p className="text-primary mt-1 font-semibold">◉ Today</p>}
    </div>
  );
}

// Module-level density reference (needed inside CustomDot which can't close over state easily)
let density: Density = 'Daily';

export default function Analemma() {
  const { lat, lon, locationName } = useSkyLocation();
  const [hourUTC, setHourUTC] = useState(12);
  const [activeDensity, setActiveDensity] = useState<Density>('Daily');
  density = activeDensity;
  const year = new Date().getFullYear();

  const { data, isLoading } = useGetAnalemma(
    { lat: lat!, lon: lon!, hour: hourUTC, year },
    {
      query: {
        enabled: !!lat && !!lon,
        queryKey: getGetAnalemmaQueryKey({ lat: lat!, lon: lon!, hour: hourUTC, year }),
        staleTime: 10 * 60 * 1000,
      },
    }
  );

  const filteredPoints = useMemo(() => {
    if (!data?.points) return [];
    if (activeDensity === 'Daily')   return data.points;
    if (activeDensity === 'Weekly')  return data.points.filter(p => p.dayOfYear % 7 === 1);
    return data.points.filter(p => new Date(p.date + 'T00:00:00Z').getUTCDate() === 1);
  }, [data, activeDensity]);

  const todayPoint = data?.points.find(p => p.isToday);
  const aboveCount = filteredPoints.filter(p => p.isAboveHorizon).length;
  const totalCount  = filteredPoints.length;

  const pad = (n: number) => String(n).padStart(2, '0');
  const displayTime = `${pad(hourUTC)}:00 UTC`;

  const axisStyle = { fill: '#64748b', fontSize: 11, fontFamily: 'monospace' };

  if (!lat || !lon) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh]">
        <LocationPicker />
      </div>
    );
  }

  return (
    <div className="flex-1 relative pb-20">
      <div className="absolute inset-0 starfield pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Sun className="w-7 h-7 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-sans tracking-tight">Sun Analemma</h1>
            </div>
            <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              {locationName}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-card/40 px-3 py-2 rounded-lg border border-border/50">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Sun's position at the same clock time, every day of {year}
          </div>
        </header>

        {/* Controls */}
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 sm:items-center">
            {/* Time slider */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Observation time
                </label>
                <span className="text-sm font-mono font-bold text-primary">{displayTime}</span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                step={1}
                value={hourUTC}
                onChange={e => setHourUTC(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Density toggle */}
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Plot points</p>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {DENSITIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setActiveDensity(d)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-mono transition-colors',
                      activeDensity === d
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4 md:p-6 bg-card/60 backdrop-blur border-border/50">
            <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4">
              {SEASONS.map(s => (
                <span key={s.label} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-white border border-primary" />
                Today
              </span>
              <span className="ml-auto text-xs font-mono text-muted-foreground">
                {aboveCount}/{totalCount} days above horizon
              </span>
            </div>

            {isLoading ? (
              <Skeleton className="w-full h-[380px] rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis
                    type="number"
                    dataKey="azimuth"
                    name="Azimuth"
                    domain={['auto', 'auto']}
                    tick={axisStyle}
                    label={{ value: 'Azimuth (°)', position: 'insideBottomRight', offset: -10, style: axisStyle }}
                  />
                  <YAxis
                    type="number"
                    dataKey="altitude"
                    name="Altitude"
                    domain={['auto', 'auto']}
                    tick={axisStyle}
                    label={{ value: 'Altitude (°)', angle: -90, position: 'insideLeft', style: axisStyle }}
                  />
                  <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" label={{ value: 'Horizon', fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
                  <Scatter
                    data={filteredPoints}
                    shape={<CustomDot />}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Stats row */}
        {data && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-card/60 backdrop-blur border-border/50 flex flex-col gap-1">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Today's altitude</p>
              <p className={cn('text-2xl font-bold font-mono', todayPoint?.isAboveHorizon ? 'text-primary glow-text' : 'text-muted-foreground')}>
                {todayPoint ? `${todayPoint.altitude}°` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">{todayPoint?.isAboveHorizon ? 'Above horizon' : 'Below horizon'}</p>
            </Card>

            <Card className="p-4 bg-card/60 backdrop-blur border-border/50 flex flex-col gap-1">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Today's azimuth</p>
              <p className="text-2xl font-bold font-mono">{todayPoint ? `${todayPoint.azimuth}°` : '—'}</p>
              <p className="text-xs text-muted-foreground">Compass bearing</p>
            </Card>

            <Card className="p-4 bg-card/60 backdrop-blur border-border/50 flex flex-col gap-1">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Declination</p>
              <p className="text-2xl font-bold font-mono text-secondary">{todayPoint ? `${todayPoint.declination}°` : '—'}</p>
              <p className="text-xs text-muted-foreground">Solar latitude</p>
            </Card>

            <Card className="p-4 bg-card/60 backdrop-blur border-border/50 flex flex-col gap-1">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Visible days</p>
              <p className="text-2xl font-bold font-mono">{aboveCount}</p>
              <p className="text-xs text-muted-foreground">of {totalCount} at {displayTime}</p>
            </Card>
          </motion.div>
        )}

        {/* Explainer */}
        <Card className="p-4 bg-card/40 backdrop-blur border-border/40 text-xs font-mono text-muted-foreground leading-relaxed">
          <span className="text-foreground font-semibold">What am I looking at? </span>
          Each dot is the sun's position (altitude vs azimuth) at <span className="text-primary">{displayTime}</span> on one day of {year}.
          The figure-8 shape — the analemma — forms because Earth's orbit is slightly elliptical and its axis is tilted.
          The two lobes correspond to summer and winter, and the shape tilts differently depending on your latitude.
          Faint dots are when the sun is below the horizon at that time.
        </Card>

      </div>
    </div>
  );
}
