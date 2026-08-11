import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import {
  useGetPlanets, getGetPlanetsQueryKey,
  useGetStars, getGetStarsQueryKey,
  useGetDeepSkyObjects, getGetDeepSkyObjectsQueryKey,
} from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Map as MapIcon, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Polar projection helpers ──────────────────────────────────────────────────
// Center = zenith (alt 90°), edge = horizon (alt 0°)
// North at top, East at right (standard astronomical view)
function altAzToXY(alt: number, az: number, cx: number, cy: number, R: number) {
  const r = ((90 - Math.max(0, alt)) / 90) * R;
  const rad = (az * Math.PI) / 180;
  const x = cx + r * Math.sin(rad);
  const y = cy - r * Math.cos(rad);
  return { x, y, r };
}

// ─── Star spectral colours ─────────────────────────────────────────────────────
function spectralFill(type: string): string {
  switch (type.charAt(0).toUpperCase()) {
    case 'O': return '#93c5fd'; // blue
    case 'B': return '#bae6fd'; // light blue
    case 'A': return '#f8fafc'; // white
    case 'F': return '#fef9c3'; // yellow-white
    case 'G': return '#fde68a'; // yellow
    case 'K': return '#fdba74'; // orange
    case 'M': return '#fca5a5'; // red
    default:  return '#d1d5db';
  }
}

// ─── Magnitude → dot radius ───────────────────────────────────────────────────
// Brighter (lower mag) → bigger dot; range roughly -2 to 7
function magToRadius(mag: number, maxR = 8, minR = 2): number {
  const clamped = Math.min(Math.max(mag, -2), 7);
  return maxR - ((clamped + 2) / 9) * (maxR - minR);
}

// ─── Constellation line pairs (by star name) ──────────────────────────────────
const CONSTELLATION_LINES: [string, string][] = [
  // Orion
  ['Betelgeuse', 'Bellatrix'],
  ['Betelgeuse', 'Alnitak'],
  ['Bellatrix', 'Mintaka'],
  ['Mintaka', 'Alnilam'],
  ['Alnilam', 'Alnitak'],
  ['Rigel', 'Alnitak'],
  // Gemini
  ['Castor', 'Pollux'],
  // Taurus
  ['Aldebaran', 'Elnath'],
  // Canis Major
  ['Sirius', 'Adhara'],
  // Scorpius
  ['Antares', 'Shaula'],
  // Ursa Major
  ['Dubhe', 'Alkaid'],
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SkyObject {
  id: string;
  label: string;
  kind: 'planet' | 'star' | 'dso';
  altitude: number;
  azimuth: number;
  magnitude: number;
  description: string;
  extra: string; // e.g. constellation, type
  spectralType?: string;
  isVisible?: boolean;
}

interface TooltipState {
  obj: SkyObject;
  svgX: number;
  svgY: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SkyMap() {
  const { lat, lon } = useSkyLocation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [svgSize, setSvgSize] = useState(520);

  // Observe SVG size for responsiveness
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSvgSize(Math.min(w, 640));
    });
    ro.observe(node);
    // cleanup handled by GC when component unmounts
  }, []);

  const hasLocation = lat != null && lon != null;

  const { data: planets, isLoading: loadingPlanets } = useGetPlanets(
    { lat: lat!, lon: lon! },
    { query: { enabled: hasLocation, queryKey: getGetPlanetsQueryKey({ lat: lat!, lon: lon! }) } }
  );
  const { data: stars, isLoading: loadingStars } = useGetStars(
    { lat: lat!, lon: lon! },
    { query: { enabled: hasLocation, queryKey: getGetStarsQueryKey({ lat: lat!, lon: lon! }) } }
  );
  const { data: dsos, isLoading: loadingDSOs } = useGetDeepSkyObjects(
    { lat: lat!, lon: lon! },
    { query: { enabled: hasLocation, queryKey: getGetDeepSkyObjectsQueryKey({ lat: lat!, lon: lon! }) } }
  );

  const isLoading = loadingPlanets || loadingStars || loadingDSOs;

  // ── Merge all objects ────────────────────────────────────────────────────────
  const skyObjects = useMemo<SkyObject[]>(() => {
    const items: SkyObject[] = [];

    planets?.forEach((p) => {
      items.push({
        id: `planet-${p.name}`,
        label: p.name,
        kind: 'planet',
        altitude: p.altitude,
        azimuth: p.azimuth,
        magnitude: p.magnitude,
        description: p.description,
        extra: p.constellation,
        isVisible: p.isVisible,
      });
    });

    stars?.forEach((s) => {
      items.push({
        id: `star-${s.name}`,
        label: s.name,
        kind: 'star',
        altitude: s.altitude,
        azimuth: s.azimuth,
        magnitude: s.magnitude,
        description: s.description,
        extra: s.constellation,
        spectralType: s.spectralType,
      });
    });

    dsos?.forEach((d) => {
      items.push({
        id: `dso-${d.id}`,
        label: d.name,
        kind: 'dso',
        altitude: d.altitude,
        azimuth: d.azimuth,
        magnitude: d.magnitude,
        description: d.description,
        extra: `${d.type} in ${d.constellation}`,
        isVisible: d.isVisible,
      });
    });

    return items;
  }, [planets, stars, dsos]);

  // ── Star lookup map for constellation lines ──────────────────────────────────
  const starMap = useMemo(() => {
    const map = new Map<string, { altitude: number; azimuth: number }>();
    stars?.forEach((s) => map.set(s.name, s));
    return map;
  }, [stars]);

  // ── SVG geometry ─────────────────────────────────────────────────────────────
  const padding = 44;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const R = svgSize / 2 - padding;

  // ── Interaction ──────────────────────────────────────────────────────────────
  function handleObjectClick(obj: SkyObject, svgX: number, svgY: number) {
    if (tooltip?.obj.id === obj.id) {
      setTooltip(null);
    } else {
      setTooltip({ obj, svgX, svgY });
    }
  }

  function closeTooltip() {
    setTooltip(null);
  }

  // ── Location guard ───────────────────────────────────────────────────────────
  if (!hasLocation) {
    return (
      <div className="flex flex-col gap-6 pb-20">
        <header>
          <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-primary" />
            Sky Map
          </h1>
          <p className="text-muted-foreground mt-2">Interactive polar projection of your sky right now.</p>
        </header>
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground font-mono gap-4 bg-card/20 rounded-xl border border-dashed border-border">
          <MapIcon className="w-12 h-12 opacity-30" />
          <div>
            <p className="text-lg mb-1">Location required</p>
            <p className="text-sm">Set your location using the picker in the corner to see your sky.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-20">
        <header>
          <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-primary" />
            Sky Map
          </h1>
          <p className="text-muted-foreground mt-2">Interactive polar projection of your sky right now.</p>
        </header>
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-full max-w-[600px] aspect-square rounded-full bg-card/50" />
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const aboveHorizon = skyObjects.filter((o) => o.altitude > 0);
  const belowHorizon = skyObjects.filter((o) => o.altitude <= 0);

  // Tooltip position: keep inside SVG bounds
  const tooltipW = 240;
  const tooltipH = 130;
  const tooltipOffset = 16;

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-primary" />
            Sky Map
          </h1>
          <p className="text-muted-foreground mt-2">Interactive polar projection — zenith at center, horizon at edge.</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#fbbf24" /></svg>
            <span className="text-muted-foreground">Planet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#f8fafc" /></svg>
            <span className="text-muted-foreground">Star</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#38bdf8" opacity="0.8" /></svg>
            <span className="text-muted-foreground">Deep-sky</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" /></svg>
            <span className="text-muted-foreground">Constellation</span>
          </div>
        </div>
      </header>

      {/* Sky map */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[640px] mx-auto select-none"
        onClick={() => setTooltip(null)}
      >
        <svg
          ref={svgRef}
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-auto"
          style={{ cursor: 'default' }}
        >
          {/* ── Background ── */}
          <defs>
            <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="70%" stopColor="#0c1526" />
              <stop offset="100%" stopColor="#06080f" />
            </radialGradient>
            <radialGradient id="horizonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="80%" stopColor="transparent" />
              <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.4" />
            </radialGradient>
            <clipPath id="skyClip">
              <circle cx={cx} cy={cy} r={R} />
            </clipPath>
          </defs>

          {/* Sky disk */}
          <circle cx={cx} cy={cy} r={R + 2} fill="url(#skyGrad)" />
          <circle cx={cx} cy={cy} r={R + 2} fill="url(#horizonGlow)" />

          {/* Altitude rings: 30°, 60° */}
          {[30, 60].map((alt) => {
            const rr = ((90 - alt) / 90) * R;
            return (
              <circle
                key={alt}
                cx={cx} cy={cy} r={rr}
                fill="none"
                stroke="rgba(100,116,139,0.25)"
                strokeWidth="0.75"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Horizon ring */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="rgba(100,116,139,0.5)"
            strokeWidth="1.5"
          />

          {/* Cardinal direction lines */}
          {[0, 90, 180, 270].map((az) => {
            const rad = (az * Math.PI) / 180;
            const x2 = cx + R * Math.sin(rad);
            const y2 = cy - R * Math.cos(rad);
            return (
              <line
                key={az}
                x1={cx} y1={cy} x2={x2} y2={y2}
                stroke="rgba(100,116,139,0.15)"
                strokeWidth="0.75"
              />
            );
          })}

          {/* Cardinal labels */}
          {[
            { az: 0,   label: 'N', dx: 0,  dy: -padding + 14 },
            { az: 90,  label: 'E', dx: padding - 14, dy: 0 },
            { az: 180, label: 'S', dx: 0,  dy: padding - 14 },
            { az: 270, label: 'W', dx: -padding + 14, dy: 0 },
          ].map(({ az, label, dx, dy }) => (
            <text
              key={az}
              x={cx + dx} y={cy + dy}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono"
              fontSize="11"
              fill="rgba(148,163,184,0.7)"
              fontFamily="monospace"
            >
              {label}
            </text>
          ))}

          {/* Altitude ring labels */}
          {[30, 60].map((alt) => {
            const rr = ((90 - alt) / 90) * R;
            return (
              <text
                key={alt}
                x={cx + 4} y={cy - rr + 12}
                fontSize="9"
                fill="rgba(100,116,139,0.5)"
                fontFamily="monospace"
              >
                {alt}°
              </text>
            );
          })}

          {/* Zenith marker */}
          <circle cx={cx} cy={cy} r={2} fill="rgba(148,163,184,0.4)" />
          <text x={cx + 6} y={cy - 4} fontSize="9" fill="rgba(148,163,184,0.5)" fontFamily="monospace">
            zenith
          </text>

          {/* ── Constellation lines (above horizon only) ── */}
          <g clipPath="url(#skyClip)" opacity="0.45">
            {CONSTELLATION_LINES.map(([aName, bName]) => {
              const a = starMap.get(aName);
              const b = starMap.get(bName);
              if (!a || !b) return null;
              if (a.altitude <= 0 && b.altitude <= 0) return null;
              const pa = altAzToXY(a.altitude, a.azimuth, cx, cy, R);
              const pb = altAzToXY(b.altitude, b.azimuth, cx, cy, R);
              return (
                <line
                  key={`${aName}-${bName}`}
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke="#64748b"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
              );
            })}
          </g>

          {/* ── Sky objects above horizon ── */}
          <g clipPath="url(#skyClip)">
            {aboveHorizon.map((obj) => {
              const { x, y } = altAzToXY(obj.altitude, obj.azimuth, cx, cy, R);
              const r = magToRadius(obj.magnitude);
              const isSelected = tooltip?.obj.id === obj.id;

              let fill: string;
              let glow: string;
              if (obj.kind === 'planet') {
                fill = '#fbbf24';
                glow = 'rgba(251,191,36,0.6)';
              } else if (obj.kind === 'star') {
                fill = spectralFill(obj.spectralType ?? 'A');
                glow = 'rgba(255,255,255,0.4)';
              } else {
                fill = '#38bdf8';
                glow = 'rgba(56,189,248,0.4)';
              }

              return (
                <g key={obj.id} style={{ cursor: 'pointer' }}>
                  {/* Glow */}
                  {(obj.kind === 'planet' || (obj.kind === 'star' && obj.magnitude < 1.5)) && (
                    <circle
                      cx={x} cy={y} r={r + 4}
                      fill={glow}
                      opacity={isSelected ? 0.9 : 0.5}
                    />
                  )}
                  {/* Dot */}
                  <circle
                    cx={x} cy={y} r={isSelected ? r + 2 : r}
                    fill={fill}
                    opacity={obj.kind === 'dso' ? 0.75 : 1}
                    stroke={isSelected ? 'rgba(255,255,255,0.8)' : 'transparent'}
                    strokeWidth={isSelected ? 1.5 : 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleObjectClick(obj, x, y);
                    }}
                  />
                  {/* DSO: show + shape instead */}
                  {obj.kind === 'dso' && (
                    <g
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handleObjectClick(obj, x, y); }}
                    >
                      <circle cx={x} cy={y} r={r} fill={fill} opacity={0.7} />
                      <line x1={x - r} y1={y} x2={x + r} y2={y} stroke={fill} strokeWidth="1.5" />
                      <line x1={x} y1={y - r} x2={x} y2={y + r} stroke={fill} strokeWidth="1.5" />
                    </g>
                  )}
                  {/* Invisible larger hit target */}
                  <circle
                    cx={x} cy={y} r={Math.max(r + 8, 12)}
                    fill="transparent"
                    onClick={(e) => { e.stopPropagation(); handleObjectClick(obj, x, y); }}
                  />
                  {/* Label for bright objects */}
                  {obj.magnitude < 1.5 && (
                    <text
                      x={x + r + 4}
                      y={y + 1}
                      fontSize="9"
                      fill="rgba(203,213,225,0.7)"
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {obj.label}
                    </text>
                  )}
                  {obj.kind === 'planet' && (
                    <text
                      x={x + r + 4}
                      y={y + 1}
                      fontSize="9"
                      fill="rgba(251,191,36,0.85)"
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {obj.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* ── Tooltip (rendered outside SVG as HTML for blur/shadow) ── */}
        <AnimatePresence>
          {tooltip && (() => {
            // Convert SVG coords to percentage of SVG element for CSS positioning
            const pct = (v: number) => (v / svgSize) * 100;

            // Pick side to show: default right/below, flip if near edge
            const flipX = tooltip.svgX > svgSize * 0.65;
            const flipY = tooltip.svgY > svgSize * 0.65;

            const left = flipX
              ? `calc(${pct(tooltip.svgX)}% - ${tooltipW + 12}px)`
              : `calc(${pct(tooltip.svgX)}% + 12px)`;
            const top = flipY
              ? `calc(${pct(tooltip.svgY)}% - ${tooltipH + 12}px)`
              : `calc(${pct(tooltip.svgY)}% + 12px)`;

            const { obj } = tooltip;
            const kindColor =
              obj.kind === 'planet' ? 'text-yellow-400' :
              obj.kind === 'star' ? 'text-slate-200' :
              'text-sky-400';
            const kindLabel =
              obj.kind === 'planet' ? 'Planet' :
              obj.kind === 'star' ? 'Star' :
              'Deep Sky';

            return (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 pointer-events-auto"
                style={{ left, top, width: tooltipW }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-card/95 backdrop-blur-md border border-border/70 rounded-xl shadow-xl p-3">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <div className={`font-bold text-sm ${kindColor}`}>{obj.label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{obj.extra}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono border-border/50">
                        {kindLabel}
                      </Badge>
                      <button
                        onClick={closeTooltip}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono bg-background/60 rounded-lg p-2 mb-2">
                    <div>
                      <span className="text-muted-foreground block">MAG</span>
                      <span className={kindColor}>{obj.magnitude.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">ALT</span>
                      <span className="text-foreground">{obj.altitude.toFixed(1)}°</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">AZ</span>
                      <span className="text-foreground">{obj.azimuth.toFixed(0)}°</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {obj.description}
                  </p>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* ── Below-horizon objects summary ── */}
      {belowHorizon.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 bg-card/30 border border-border/40 rounded-xl p-4 text-sm text-muted-foreground"
        >
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/60" />
          <div>
            <span className="font-mono text-foreground/70">{belowHorizon.length} objects below the horizon</span>
            {' — '}
            {belowHorizon.slice(0, 6).map((o) => o.label).join(', ')}
            {belowHorizon.length > 6 ? ` and ${belowHorizon.length - 6} more` : ''}.
          </div>
        </motion.div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
        {[
          { label: 'Planets', count: planets?.filter((p) => p.isVisible).length ?? 0, total: planets?.length ?? 0, color: 'text-yellow-400' },
          { label: 'Stars', count: stars?.filter((s) => s.altitude > 0).length ?? 0, total: stars?.length ?? 0, color: 'text-slate-200' },
          { label: 'DSOs', count: dsos?.filter((d) => d.isVisible).length ?? 0, total: dsos?.length ?? 0, color: 'text-sky-400' },
        ].map(({ label, count, total, color }) => (
          <div key={label} className="bg-card/30 border border-border/40 rounded-xl p-3">
            <div className={`text-xl font-bold ${color}`}>{count}</div>
            <div className="text-muted-foreground">{label} visible</div>
            <div className="text-muted-foreground/50">of {total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
