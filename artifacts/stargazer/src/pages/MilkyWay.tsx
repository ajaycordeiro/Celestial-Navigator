import { useState, useMemo } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetMilkyWay, useGetSkyWeather, getGetMilkyWayQueryKey } from '@workspace/api-client-react';
import { getTzAbbr, formatLocalTime, getCompassDirection } from '@/lib/utils/astronomy';
import { motion } from 'framer-motion';
import { LocationPicker } from '@/components/LocationPicker';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import {
  Aperture, MapPin, Moon, Calendar, Info, AlertTriangle, Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Reference photo ───────────────────────────────────────────────────────────
const REFERENCE_PHOTO = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Milky_Way_Arch.jpg/1280px-Milky_Way_Arch.jpg',
  credit: 'S. Guisard / ESO (CC BY 4.0)',
};

// ── Verdict config ─────────────────────────────────────────────────────────────
const VERDICT = {
  Good:     { label: 'Good Night',  color: 'text-emerald-400', border: 'border-emerald-400/40', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  Moderate: { label: 'Moderate',    color: 'text-amber-400',   border: 'border-amber-400/40',   bg: 'bg-amber-400/10',   dot: 'bg-amber-400'   },
  Poor:     { label: 'Poor',        color: 'text-red-400',     border: 'border-red-400/40',     bg: 'bg-red-400/10',     dot: 'bg-red-400'     },
};

// ── Compass diagram ────────────────────────────────────────────────────────────
function CompassDiagram({
  riseAzimuth, peakAzimuth, setAzimuth, lat,
}: { riseAzimuth: number | null; peakAzimuth: number; setAzimuth: number | null; lat: number }) {
  const CX = 100, CY = 95, R = 68;

  function azToXY(az: number, r = R) {
    const rad = (az * Math.PI) / 180;
    return { x: +(CX + r * Math.sin(rad)).toFixed(1), y: +(CY - r * Math.cos(rad)).toFixed(1) };
  }

  const rise = riseAzimuth !== null ? azToXY(riseAzimuth) : null;
  const set  = setAzimuth  !== null ? azToXY(setAzimuth)  : null;
  const peak = azToXY(peakAzimuth);

  let arcPath = '';
  if (rise && set && riseAzimuth !== null && setAzimuth !== null) {
    // Northern hemisphere: core transits south → short clockwise arc
    // Southern hemisphere: core transits north → long counter-clockwise arc
    const isNorth  = lat >= 0;
    const largeArc = isNorth ? 0 : 1;
    const sweep    = isNorth ? 1 : 0;
    arcPath = `M ${rise.x} ${rise.y} A ${R} ${R} 0 ${largeArc} ${sweep} ${set.x} ${set.y}`;
  }

  return (
    <svg viewBox="0 0 200 190" className="w-full h-full" style={{ maxWidth: 200 }}>
      <circle cx={CX} cy={CY} r={R}        fill="none" stroke="#1e293b" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={R * 0.55} fill="none" stroke="#1e293b" strokeWidth={0.5} strokeDasharray="2 4" />
      <line x1={CX} y1={CY - R - 4} x2={CX} y2={CY + R + 4} stroke="#1e293b" strokeWidth={0.5} />
      <line x1={CX - R - 4} y1={CY} x2={CX + R + 4} y2={CY} stroke="#1e293b" strokeWidth={0.5} />
      <text x={CX} y={CY - R - 9}   textAnchor="middle" fill="#475569" fontSize={9} fontFamily="monospace">N</text>
      <text x={CX} y={CY + R + 17}  textAnchor="middle" fill="#475569" fontSize={9} fontFamily="monospace">S</text>
      <text x={CX + R + 13} y={CY + 3} textAnchor="middle" fill="#475569" fontSize={9} fontFamily="monospace">E</text>
      <text x={CX - R - 13} y={CY + 3} textAnchor="middle" fill="#475569" fontSize={9} fontFamily="monospace">W</text>

      {arcPath && (
        <path d={arcPath} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
      )}

      {rise && (
        <>
          <circle cx={rise.x} cy={rise.y} r={4.5} fill="#4ade80" />
          <text x={rise.x + 7} y={rise.y + 3} fill="#4ade80" fontSize={7} fontFamily="monospace">Rise</text>
        </>
      )}
      {set && (
        <>
          <circle cx={set.x} cy={set.y} r={4.5} fill="#f97316" />
          <text x={set.x - 24} y={set.y + 3} fill="#f97316" fontSize={7} fontFamily="monospace">Set</text>
        </>
      )}
      <circle cx={peak.x} cy={peak.y} r={6}  fill="#7c3aed" stroke="#22d3ee" strokeWidth={1.5} />
      <circle cx={peak.x} cy={peak.y} r={11} fill="none"    stroke="#7c3aed" strokeWidth={0.5} opacity={0.4} />
      <text x={peak.x} y={peak.y + 20} textAnchor="middle" fill="#a78bfa" fontSize={7} fontFamily="monospace">Peak</text>
    </svg>
  );
}

// ── Night timeline bar ─────────────────────────────────────────────────────────
function NightTimeline({
  data, timezone,
}: {
  data: { sunset: string | null; sunrise: string | null; astronomicalDusk: string | null; astronomicalDawn: string | null; riseTime: string | null; peakTime: string | null; setTime: string | null; shootableWindowStart: string | null; shootableWindowEnd: string | null };
  timezone: string;
}) {
  const startMs = data.sunset  ? new Date(data.sunset).getTime()  : null;
  const endMs   = data.sunrise ? new Date(data.sunrise).getTime() : null;
  if (!startMs || !endMs) return null;
  const span = endMs - startMs;

  const pct = (iso: string | null) =>
    iso ? Math.max(0, Math.min(100, ((new Date(iso).getTime() - startMs) / span) * 100)) : null;

  const duskPct  = pct(data.astronomicalDusk);
  const dawnPct  = pct(data.astronomicalDawn);
  const sSPct    = pct(data.shootableWindowStart);
  const sEPct    = pct(data.shootableWindowEnd);

  const ticks = [
    { iso: data.sunset,              label: 'Sunset',   color: '#f97316' },
    { iso: data.astronomicalDusk,    label: 'Dark',     color: '#a78bfa' },
    { iso: data.riseTime,            label: 'Rise',     color: '#4ade80' },
    { iso: data.peakTime,            label: 'Peak',     color: '#22d3ee' },
    { iso: data.setTime,             label: 'Set',      color: '#fb923c' },
    { iso: data.astronomicalDawn,    label: 'Dawn',     color: '#a78bfa' },
    { iso: data.sunrise,             label: 'Sunrise',  color: '#f97316' },
  ].filter(t => t.iso);

  return (
    <div>
      {/* Bar */}
      <div className="relative h-5 rounded-full bg-slate-950 overflow-hidden border border-border/40">
        {/* Astronomical darkness window */}
        {duskPct !== null && dawnPct !== null && (
          <div
            className="absolute inset-y-0 bg-indigo-950/80"
            style={{ left: `${duskPct}%`, right: `${100 - dawnPct}%` }}
          />
        )}
        {/* Shootable window */}
        {sSPct !== null && sEPct !== null && (
          <div
            className="absolute inset-y-0 bg-violet-600/40 border-x border-violet-500/50"
            style={{ left: `${sSPct}%`, width: `${Math.max(sEPct - sSPct, 0.5)}%` }}
          />
        )}
        {/* Tick marks */}
        {ticks.map(t => {
          const p = pct(t.iso);
          if (p === null) return null;
          return <div key={t.label} className="absolute top-0 bottom-0 w-px opacity-80" style={{ left: `${p}%`, background: t.color }} />;
        })}
      </div>

      {/* Labels */}
      <div className="relative mt-2 h-10">
        {ticks.map(t => {
          const p = pct(t.iso);
          if (p === null) return null;
          return (
            <div
              key={t.label}
              className="absolute -translate-x-1/2 text-center whitespace-nowrap"
              style={{ left: `${p}%` }}
            >
              <div className="text-[9px] font-mono leading-none" style={{ color: t.color }}>{t.label}</div>
              <div className="text-[8px] font-mono text-muted-foreground leading-none mt-0.5">
                {formatLocalTime(t.iso!, timezone)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-indigo-950/80 border border-indigo-800/60" /> Astronomical night</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-violet-600/40 border border-violet-500/50" /> Best shoot window</span>
      </div>
    </div>
  );
}

// ── Chart tooltip ──────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, timezone, tzLabel }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-card border border-border/70 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="font-semibold text-foreground mb-1">
        {formatLocalTime(p.time, timezone)} {tzLabel}
      </p>
      <p className="text-muted-foreground">
        Altitude <span className={cn('font-bold', p.altitude >= 0 ? 'text-violet-400' : 'text-red-400')}>{p.altitude}°</span>
      </p>
      <p className="text-muted-foreground">Azimuth <span className="text-foreground font-bold">{p.azimuth}° {getCompassDirection(p.azimuth)}</span></p>
      {p.isShootable && <p className="text-violet-300 mt-1 font-semibold">📷 Shootable</p>}
      {p.isDark && !p.isShootable && p.altitude > 0 && <p className="text-slate-400 mt-1">Core below 10° threshold</p>}
      {!p.isDark && <p className="text-amber-400 mt-1">Sky not dark yet</p>}
    </div>
  );
}

// ── Axis style ─────────────────────────────────────────────────────────────────
const axisStyle = { fill: '#64748b', fontSize: 10, fontFamily: 'monospace' };

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MilkyWay() {
  const { lat, lon, locationName, timezone } = useSkyLocation();
  const tzLabel = getTzAbbr(timezone);

  // Date picker: today → +90 days
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);
  const maxDateStr = useMemo(() => {
    const d = new Date(Date.now() + 90 * 86_400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const isToday = selectedDate === todayStr;

  const { data: mw, isLoading } = useGetMilkyWay(
    { lat: lat!, lon: lon!, date: selectedDate },
    {
      query: {
        enabled: !!lat && !!lon,
        queryKey: getGetMilkyWayQueryKey({ lat: lat!, lon: lon!, date: selectedDate }),
        staleTime: 5 * 60 * 1000,
      },
    }
  );

  const { data: weather } = useGetSkyWeather(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, staleTime: 10 * 60 * 1000 } }
  );

  // Combine verdict: cloud cover can degrade it
  const { verdict, verdictReason } = useMemo(() => {
    if (!mw) return { verdict: 'Poor' as const, verdictReason: '' };
    let v = mw.verdict;
    let r = mw.verdictReason;
    if (weather) {
      const c = weather.cloudCover;
      if (c > 75) { v = 'Poor'; r = `${c}% cloud cover blocks the sky`; }
      else if (c > 40 && v === 'Good')     { v = 'Moderate'; r = `Core peaks at ${mw.peakAltitude}° but ${c}% cloud cover limits viewing`; }
      else if (c > 40 && v === 'Moderate') { v = 'Poor';     r = `${c}% cloud cover with low core altitude`; }
    }
    return { verdict: v, verdictReason: r };
  }, [mw, weather]);

  const vc = VERDICT[verdict];

  // Chart: only curve points during the dark window (or all if no dark)
  const chartData = useMemo(() => {
    if (!mw?.altitudeCurve.length) return [];
    return mw.altitudeCurve;
  }, [mw]);

  // X-axis tick formatter
  const tickFmt = (iso: string) => formatLocalTime(iso, timezone);

  if (!lat || !lon) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh]">
        <LocationPicker />
      </div>
    );
  }

  return (
    <div className="flex-1 relative pb-20">
      {/* Subtle purple starfield overlay for this tab only */}
      <div className="absolute inset-0 starfield pointer-events-none" style={{ filter: 'hue-rotate(200deg) saturate(0.6)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/10 via-transparent to-indigo-950/10 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Aperture className="w-7 h-7 text-violet-400" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-sans tracking-tight">Milky Way</h1>
            </div>
            <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              {locationName}
            </p>
            <p className="text-sm text-foreground/70 mt-2 max-w-xl leading-relaxed">
              Track when the galactic core rises over your horizon and find the best window to photograph it.
            </p>
          </div>

          {/* Info + date picker */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-card/40 px-3 py-2 rounded-lg border border-border/50">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Galactic core (Sgr A*) · RA 17 h 45 m · Dec −29°
            </div>
            <div className="flex items-center gap-2 bg-card/40 px-3 py-2 rounded-lg border border-border/50">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={selectedDate}
                min={todayStr}
                max={maxDateStr}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-mono text-foreground outline-none cursor-pointer"
              />
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : mw ? (
          <>
            {/* ── Not visible banner ── */}
            {!mw.coreVisibleTonight && (
              <Card className="p-4 border-red-400/40 bg-red-400/10 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400 text-sm">Core not visible tonight</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mw.verdictReason}</p>
                </div>
              </Card>
            )}

            {/* ── Verdict card ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={cn('p-5 backdrop-blur border', vc.border, vc.bg)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={cn('w-3 h-3 rounded-full shrink-0', vc.dot)} />
                    <div>
                      <p className={cn('text-xl font-bold font-mono', vc.color)}>{vc.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">{verdictReason}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {weather && (
                      <span className="text-xs font-mono text-muted-foreground">
                        ☁ {weather.cloudCover}% cloud · {weather.transparency} transparency
                      </span>
                    )}
                    {mw.moonIllumination > 30 && (
                      <span className={cn('text-xs font-mono flex items-center gap-1', mw.moonIllumination > 60 ? 'text-red-400' : 'text-amber-400')}>
                        <Moon className="w-3 h-3" />
                        {mw.moonIllumination}% moon
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Rise / Peak / Set stats ── */}
            <motion.div
              className="grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            >
              {[
                { label: 'Core Rise',    value: mw.riseTime,  sub: mw.riseAzimuth !== null ? `${mw.riseAzimuth}° ${getCompassDirection(mw.riseAzimuth)}` : '—', color: 'text-emerald-400' },
                { label: 'Core Peak',    value: mw.peakTime,  sub: `${mw.peakAltitude}° altitude · ${mw.peakAzimuth}° ${getCompassDirection(mw.peakAzimuth)}`, color: 'text-violet-400' },
                { label: 'Core Set',     value: mw.setTime,   sub: mw.setAzimuth !== null ? `${mw.setAzimuth}° ${getCompassDirection(mw.setAzimuth)}` : '—', color: 'text-orange-400' },
              ].map(stat => (
                <Card key={stat.label} className="p-4 bg-card/60 backdrop-blur border-border/50 flex flex-col gap-1">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className={cn('text-lg font-bold font-mono', stat.color)}>
                    {stat.value ? `${formatLocalTime(stat.value, timezone)} ${tzLabel}` : '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono leading-tight">{stat.sub}</p>
                </Card>
              ))}
            </motion.div>

            {/* ── Night timeline bar ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Night timeline</p>
                <NightTimeline data={mw} timezone={timezone} />
              </Card>
            </motion.div>

            {/* ── Altitude curve + Compass ── */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              {/* Altitude chart – takes 2/3 width */}
              <Card className="p-4 md:p-5 bg-card/60 backdrop-blur border-border/50 md:col-span-2">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Altitude curve tonight</p>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
                      <defs>
                        <linearGradient id="mwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                      <XAxis
                        dataKey="time"
                        tick={axisStyle}
                        interval={3}
                        tickFormatter={tickFmt}
                        label={{ value: `Time (${tzLabel || 'local'})`, position: 'insideBottomRight', offset: -8, style: axisStyle }}
                      />
                      <YAxis
                        tick={axisStyle}
                        domain={['auto', 'auto']}
                        label={{ value: 'Altitude (°)', angle: -90, position: 'insideLeft', style: axisStyle }}
                      />
                      {/* Shootable window */}
                      {mw.shootableWindowStart && mw.shootableWindowEnd && (
                        <ReferenceArea
                          x1={mw.shootableWindowStart}
                          x2={mw.shootableWindowEnd}
                          fill="#7c3aed"
                          fillOpacity={0.12}
                          stroke="#7c3aed"
                          strokeOpacity={0.3}
                          strokeWidth={1}
                          label={{ value: '📷 Best window', fill: '#a78bfa', fontSize: 10, position: 'top' }}
                        />
                      )}
                      <ReferenceLine y={0}  stroke="#334155" strokeDasharray="4 2" label={{ value: 'Horizon', fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                      <ReferenceLine y={10} stroke="#374151" strokeDasharray="2 4" label={{ value: '10°',    fill: '#374151', fontSize: 8, fontFamily: 'monospace' }} />
                      <Tooltip content={<ChartTooltip timezone={timezone} tzLabel={tzLabel} />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="altitude" stroke="#7c3aed" strokeWidth={2} fill="url(#mwGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm font-mono">No curve data</div>
                )}
              </Card>

              {/* Compass – takes 1/3 width */}
              <Card className="p-4 bg-card/60 backdrop-blur border-border/50 flex flex-col">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Core path direction</p>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full" style={{ maxWidth: 180, aspectRatio: '1 / 0.95' }}>
                    <CompassDiagram
                      riseAzimuth={mw.riseAzimuth}
                      peakAzimuth={mw.peakAzimuth}
                      setAzimuth={mw.setAzimuth}
                      lat={lat}
                    />
                  </div>
                </div>
                {/* Current position */}
                {isToday && (
                  <div className="mt-2 pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground text-center">
                    Now: <span className={cn('font-bold', mw.currentAltitude > 0 ? 'text-violet-400' : 'text-foreground')}>
                      {mw.currentAltitude}° alt · {mw.currentAzimuth}° {getCompassDirection(mw.currentAzimuth)}
                    </span>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* ── 7-night forecast strip ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <Card className="p-4 bg-card/60 backdrop-blur border-border/50">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">7-night forecast</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {mw.forecast.map((night, i) => {
                    const d = new Date(night.date + 'T12:00:00Z');
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum  = d.getUTCDate();
                    const nightVerdict: 'Good' | 'Moderate' | 'Poor' =
                      !night.coreVisible ? 'Poor'
                      : night.peakAltitude >= 25 ? 'Good'
                      : 'Moderate';
                    const nvc = VERDICT[nightVerdict];
                    return (
                      <button
                        key={night.date}
                        onClick={() => setSelectedDate(night.date)}
                        className={cn(
                          'flex flex-col items-center rounded-lg p-2 text-center transition-all border cursor-pointer',
                          selectedDate === night.date
                            ? cn('border-violet-500/60 bg-violet-500/15')
                            : 'border-border/40 bg-card/30 hover:bg-card/60 hover:border-border',
                          night.isBestNight && selectedDate !== night.date && 'border-violet-400/40'
                        )}
                      >
                        {night.isBestNight && (
                          <span className="text-[7px] font-mono text-violet-400 uppercase tracking-wider mb-0.5">Best</span>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground">{dayName}</span>
                        <span className="text-xs font-bold text-foreground">{dayNum}</span>
                        <span className={cn('w-2 h-2 rounded-full mt-1', nvc.dot)} />
                        {night.coreVisible && (
                          <span className={cn('text-[9px] font-mono mt-0.5', nvc.color)}>{night.peakAltitude}°</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            {/* ── Moon card ── */}
            {mw.moonIllumination > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                <Card className={cn('p-4 bg-card/60 backdrop-blur border-border/50 flex items-center gap-4')}>
                  <Moon className={cn('w-8 h-8 shrink-0', mw.moonIllumination > 60 ? 'text-red-400' : mw.moonIllumination > 30 ? 'text-amber-400' : 'text-muted-foreground')} />
                  <div>
                    <p className="text-sm font-semibold">Moon interference: {mw.moonIllumination}% illuminated</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mw.moonIllumination > 60
                        ? 'Bright moon will significantly wash out the Milky Way — consider shooting before moonrise or find a time nearer new moon.'
                        : mw.moonIllumination > 30
                        ? 'Partial moon may reduce contrast near the galactic core. Use wide aperture and shoot while the moon is below horizon.'
                        : 'Low moon interference — good conditions for faint detail near the core.'}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Reference photo ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Card className="overflow-hidden bg-card/40 backdrop-blur border-border/40">
                <div className="relative">
                  <img
                    src={REFERENCE_PHOTO.url}
                    alt="Milky Way arch over La Silla Observatory"
                    className="w-full object-cover max-h-64 md:max-h-80"
                    onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
                    <span className="text-[10px] text-white/70 font-mono">{REFERENCE_PHOTO.credit}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-black/40 rounded px-2 py-0.5">
                      <Camera className="w-3 h-3" />
                      Example only — not tonight's sky
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Explainer ── */}
            <Card className="p-4 bg-card/40 backdrop-blur border-border/40 text-xs font-mono text-muted-foreground leading-relaxed">
              <span className="text-foreground font-semibold">About the galactic core. </span>
              The bright, cloud-like bulge at the centre of the Milky Way (Sagittarius A*, 26 000 ly away) is best seen from
              {' '}<span className="text-foreground">May–September</span> in the northern hemisphere when it rises high enough to shoot.
              The <span className="text-violet-400">shootable window</span> above shows when it clears 10° altitude during true astronomical night — the sweet spot for astrophotography.
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
