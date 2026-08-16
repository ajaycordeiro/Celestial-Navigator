import { useState, useMemo } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetAnalemma, getGetAnalemmaQueryKey } from '@workspace/api-client-react';
import { getTzAbbr } from '@/lib/utils/astronomy';
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

// ── Timezone conversion ──────────────────────────────────────────────────────
/**
 * Convert a local hour (0-23) in the given IANA timezone to the equivalent
 * UTC hour (0-23). Uses noon UTC as a reference point to avoid DST/midnight
 * edge cases. Accurate to the nearest whole hour (½-hour offsets like IST
 * are rounded).
 */
function localHourToUtcHour(localHour: number, timezone: string): number {
  if (!timezone) return localHour;
  try {
    const ref = new Date();
    ref.setUTCHours(12, 0, 0, 0); // noon UTC – safe reference

    // What local hour does noon UTC map to in the target timezone?
    const raw = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(ref);
    const localAtNoonUtc = parseInt(raw, 10) % 24; // handle '24' midnight edge

    // UTC = local + offset  ⟹  offset = 12 − localAtNoonUtc
    let offset = 12 - localAtNoonUtc;
    if (offset >  12) offset -= 24;
    if (offset < -12) offset += 24;

    return ((localHour + offset) % 24 + 24) % 24;
  } catch {
    return localHour;
  }
}

/** What local hour does the current moment correspond to in the timezone? */
function currentLocalHour(timezone: string): number {
  if (!timezone) return 12;
  try {
    const raw = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    return parseInt(raw, 10) % 24;
  } catch {
    return 12;
  }
}

// ── Seasonal colours ─────────────────────────────────────────────────────────
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

// Module-level ref so CustomDot (defined outside the component) can read it
let _density: Density = 'Daily';

// ── Custom dot renderer ───────────────────────────────────────────────────────
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
  if (payload.isToday) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="none" stroke="#22d3ee" strokeWidth={1.5} opacity={0.4} />
        <circle cx={cx} cy={cy} r={6}  fill="#FFFFFF" stroke="#22d3ee" strokeWidth={1.5} />
      </g>
    );
  }
  const r = _density === 'Monthly' ? 5 : _density === 'Weekly' ? 4 : 3;
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill={seasonColor(payload.month)}
      opacity={payload.isAboveHorizon ? 0.85 : 0.18}
    />
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
const axisStyle = { fill: '#64748b', fontSize: 11, fontFamily: 'monospace' };

export default function Analemma() {
  const { lat, lon, locationName, timezone } = useSkyLocation();

  // Slider tracks LOCAL hour in the selected location's timezone.
  // Default = current local hour (so the chart opens at "now").
  const [localHour, setLocalHour] = useState(() => currentLocalHour(timezone));
  const [activeDensity, setActiveDensity] = useState<Density>('Daily');
  _density = activeDensity;

  const year = new Date().getFullYear();

  // Convert local hour → UTC hour for the API call
  const hourUTC = localHourToUtcHour(localHour, timezone);

  const tzLabel    = getTzAbbr(timezone);
  const displayTime = `${pad(localHour)}:00${tzLabel ? ` ${tzLabel}` : ''}`;

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
  const totalCount = filteredPoints.length;

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
            <p className="text-sm text-foreground/70 mt-2 max-w-xl leading-relaxed">
              If you photographed the sun at the same time every day for a year, the dots would trace a figure‑8 in the sky. That's the analemma.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-card/40 px-3 py-2 rounded-lg border border-border/50 self-start md:self-auto">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Sun's position at the same clock time, every day of {year}
          </div>
        </header>

        {/* Why a figure-8? card */}
        <Card className="p-4 bg-card/40 backdrop-blur border-border/40">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Why a figure‑8?</p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex items-start gap-2">
              <span className="text-base leading-tight shrink-0">🌍</span>
              <span><span className="text-foreground font-medium">Earth's axis is tilted</span> — the sun rides high in summer and low in winter, giving the figure‑8 its height.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-base leading-tight shrink-0">🔵</span>
              <span><span className="text-foreground font-medium">Earth's orbit is oval, not circular</span> — the sun runs ahead or behind clock time throughout the year, giving the figure‑8 its sideways wobble.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-base leading-tight shrink-0">📍</span>
              <span><span className="text-foreground font-medium">Your location changes the shape</span> — taller and more upright near the equator, flatter and tilted near the poles.</span>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-border/40 space-y-1 text-xs text-muted-foreground leading-relaxed">
            <p>Sailors used it to navigate the seas, and sundial makers carved it on their dials — without it, a sundial drifts by up to <span className="text-foreground">16 minutes</span>.</p>
            <p>Today it guides architects designing sun‑smart buildings, and is the holy grail of sky photography: <span className="text-foreground">365 photos, same spot, same time</span>, stacked into one image.</p>
          </div>
        </Card>

        {/* Controls */}
        <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 sm:items-center">
            {/* Time slider — local time in selected timezone */}
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
                value={localHour}
                onChange={e => setLocalHour(Number(e.target.value))}
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
                  <ReferenceLine
                    y={0}
                    stroke="#334155"
                    strokeDasharray="4 2"
                    label={{ value: 'Horizon', fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
                  <Scatter data={filteredPoints} shape={<CustomDot />} />
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
          Each dot is the sun's position at <span className="text-primary">{displayTime}</span> on one day of {year},
          as seen from <span className="text-foreground">{locationName?.includes('°') ? locationName : locationName?.split(',')[0]}</span>.
          The figure-8 shape — the analemma — forms because Earth's orbit is elliptical and its axis is tilted.
          The two lobes correspond to summer and winter. Faint dots are days when the sun is below the horizon at that time.
        </Card>

      </div>
    </div>
  );
}
