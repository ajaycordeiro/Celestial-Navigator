import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import {
  useGetPlanets, getGetPlanetsQueryKey,
  useGetStars, getGetStarsQueryKey,
  useGetDeepSkyObjects, getGetDeepSkyObjectsQueryKey,
} from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Map as MapIcon, Info, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, Info, X, Sunrise, Sunset } from 'lucide-react';

// ─── Polar projection helpers ──────────────────────────────────────────────────
// Center = zenith (alt 90°), edge = horizon (alt 0°)
// North at top, East at right (standard astronomical view)
import { formatLocalTime } from '@/lib/utils/astronomy';
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
  label: string;        // display label — for DSOs includes the Messier ID, e.g. "Orion Nebula (M42)"
  catalogId?: string;   // raw catalog ID, e.g. "M42" — used as an additional search token
  kind: 'planet' | 'star' | 'dso';
  altitude: number;
  azimuth: number;
  magnitude: number;
  description: string;
  extra: string; // e.g. constellation, type
  spectralType?: string;
  isVisible?: boolean;
  riseTime?: string | null;
  setTime?: string | null;
  isCircumpolar?: boolean;
}

interface TooltipState {
  obj: SkyObject;
  svgX: number;
  svgY: number;
}

// ─── Visibility filter modes ───────────────────────────────────────────────────
type VisibilityMode = 'naked-eye' | 'binoculars' | 'telescope';

const VISIBILITY_MODES: { key: VisibilityMode; label: string; icon: string; magLimit: number; hint: string }[] = [
  { key: 'naked-eye',   label: 'Naked Eye',  icon: '👁️',  magLimit: 6,        hint: 'Mag ≤ 6' },
  { key: 'binoculars',  label: 'Binoculars', icon: '🔭',  magLimit: 9,        hint: 'Mag ≤ 9' },
  { key: 'telescope',   label: 'Telescope',  icon: '🌌',  magLimit: Infinity,  hint: 'All objects' },
];

const LS_KEY = 'stargazer-sky-visibility';

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SkyMap() {
  const { lat, lon } = useSkyLocation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [svgSize, setSvgSize] = useState(520);

  // Visibility filter — persisted to localStorage
  const [visibilityMode, setVisibilityModeState] = useState<VisibilityMode>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored === 'naked-eye' || stored === 'binoculars' || stored === 'telescope') return stored;
    } catch {}
    return 'naked-eye';
  });

  const setVisibilityMode = (mode: VisibilityMode) => {
    setVisibilityModeState(mode);
    try { localStorage.setItem(LS_KEY, mode); } catch {}
    setTooltip(null); // dismiss any open tooltip when filter changes
  };

  const activeMagLimit = VISIBILITY_MODES.find(m => m.key === visibilityMode)!.magLimit;

  // ── Search state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<SkyObject | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
        riseTime: s.riseTime,
        setTime: s.setTime,
        isCircumpolar: s.isCircumpolar,
      });
    });

    dsos?.forEach((d) => {
      items.push({
        id: `dso-${d.id}`,
        label: `${d.name} (${d.id})`,
        catalogId: d.id,
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

  // ── Search results (across ALL objects, ignoring mag/horizon filters) ─────────
  const searchResults = useMemo<SkyObject[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return skyObjects
      .filter((o) => {
        const nameMatch = o.label.toLowerCase().includes(q);
        const extraMatch = o.extra.toLowerCase().includes(q);
        // Direct Messier ID match: "m42", "m 42", "42" all hit catalogId "M42"
        const catalogMatch = o.catalogId
          ? o.catalogId.toLowerCase().includes(q) ||
            o.catalogId.toLowerCase().replace(/\s/g, '') === q.replace(/\s/g, '') ||
            // also match bare number: "42" → "m42"
            (`m${q}` === o.catalogId.toLowerCase())
          : false;
        return nameMatch || extraMatch || catalogMatch;
      })
      .slice(0, 8);
  }, [skyObjects, searchQuery]);

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

  // ── Select a search result → highlight on map + open tooltip ────────────────
  function selectSearchResult(obj: SkyObject) {
    setSearchQuery(obj.label);
    setSearchOpen(false);
    setSelectedSearch(obj);
    setTooltip(null);

    // If above horizon: compute SVG coords and open tooltip there
    if (obj.altitude > 0) {
      const svgEl = svgRef.current;
      const containerEl = svgEl?.parentElement;
      // Derive current rendered size from DOM or fall back to state
      const renderedSize = svgEl ? svgEl.getBoundingClientRect().width : svgSize;
      const scale = renderedSize / svgSize;
      const padded = svgSize / 2 - padding;
      const { x, y } = altAzToXY(obj.altitude, obj.azimuth, svgSize / 2, svgSize / 2, padded);
      setTooltip({ obj, svgX: x, svgY: y });
    }
  }

  function clearSearch() {
    setSearchQuery('');
    setSearchOpen(false);
    setSelectedSearch(null);
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
  // Always include the selected search result even if it exceeds the magnitude filter,
  // so its highlight ring and tooltip anchor are present on the map.
  const aboveHorizon = skyObjects.filter((o) => {
    if (o.altitude <= 0) return false;
    if (selectedSearch && o.id === selectedSearch.id) return true; // always show selected
    return o.magnitude <= activeMagLimit;
  });
  const belowHorizon = skyObjects.filter((o) => o.altitude <= 0 && o.magnitude <= activeMagLimit);

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

      {/* ── Search ── */}
      <div ref={searchContainerRef} className="relative w-full max-w-[640px]">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
              if (!e.target.value) { setSelectedSearch(null); setTooltip(null); }
            }}
            onFocus={() => { if (searchQuery) setSearchOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { clearSearch(); searchInputRef.current?.blur(); }
            }}
            placeholder="Search stars, planets, Messier objects…"
            className="w-full pl-9 pr-8 py-2 text-sm font-mono bg-card/50 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-30 top-full mt-1 w-full bg-card/95 backdrop-blur-md border border-border/70 rounded-xl shadow-xl overflow-hidden"
            >
              {searchResults.map((obj) => {
                const aboveH = obj.altitude > 0;
                const kindColor = obj.kind === 'planet' ? '#fbbf24' : obj.kind === 'star' ? '#f8fafc' : '#38bdf8';
                const kindLabel = obj.kind === 'planet' ? 'Planet' : obj.kind === 'star' ? 'Star' : 'Deep Sky';
                return (
                  <button
                    key={obj.id}
                    onMouseDown={(e) => { e.preventDefault(); selectSearchResult(obj); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0"
                  >
                    <svg width="10" height="10" className="shrink-0">
                      <circle cx="5" cy="5" r="4" fill={kindColor} opacity={aboveH ? 1 : 0.4} />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono text-foreground truncate block">{obj.label}</span>
                      <span className="text-[10px] text-muted-foreground truncate block">{obj.extra}</span>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground/70">{kindLabel}</span>
                      <span className={`text-[10px] font-mono ${aboveH ? 'text-primary/70' : 'text-red-400/70'}`}>
                        {aboveH ? `↑ ${obj.altitude.toFixed(0)}°` : 'below horizon'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
          {searchOpen && searchQuery.trim() && searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute z-30 top-full mt-1 w-full bg-card/95 backdrop-blur-md border border-border/70 rounded-xl shadow-xl px-4 py-3 text-sm text-muted-foreground font-mono"
            >
              No objects found for "{searchQuery}"
            </motion.div>
          )}
        </AnimatePresence>

        {/* Below-horizon notice for selected object */}
        {selectedSearch && selectedSearch.altitude <= 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-3 bg-card/40 border border-border/40 rounded-lg px-3 py-2.5 text-xs font-mono"
          >
            <Info className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            <div>
              <span className="text-foreground/80">{selectedSearch.label}</span>
              <span className="text-muted-foreground"> is currently {Math.abs(selectedSearch.altitude).toFixed(1)}° below the horizon</span>
              <span className="text-muted-foreground/60"> · alt {selectedSearch.altitude.toFixed(1)}° az {selectedSearch.azimuth.toFixed(0)}°</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Visibility filter ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest shrink-0">Equipment</span>
        <div className="flex rounded-lg border border-border/60 bg-card/40 p-0.5 gap-0.5">
          {VISIBILITY_MODES.map((mode) => {
            const isActive = visibilityMode === mode.key;
            return (
              <button
                key={mode.key}
                onClick={() => setVisibilityMode(mode.key)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,212,255,0.25)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
                ].join(' ')}
                title={mode.hint}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
                <span className={['text-[10px]', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/50'].join(' ')}>
                  {mode.hint}
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {aboveHorizon.length} object{aboveHorizon.length !== 1 ? 's' : ''} visible above horizon
        </span>
      </div>

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
              const isSearchMatch = selectedSearch ? obj.id === selectedSearch.id : false;
              // Only dim when the selected result is above the horizon and renderable on the map
              const searchIsOnMap = selectedSearch ? selectedSearch.altitude > 0 : false;
              const isSearchDimmed = searchIsOnMap && !isSearchMatch;

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
                <g key={obj.id} style={{ cursor: 'pointer', opacity: isSearchDimmed ? 0.12 : 1, transition: 'opacity 0.2s' }}>
                  {/* Search highlight ring */}
                  {isSearchMatch && (
                    <circle
                      cx={x} cy={y} r={r + 8}
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  )}
                  {/* Glow */}
                  {(obj.kind === 'planet' || (obj.kind === 'star' && obj.magnitude < 1.5) || isSearchMatch) && (
                    <circle
                      cx={x} cy={y} r={isSearchMatch ? r + 10 : r + 4}
                      fill={glow}
                      opacity={isSelected || isSearchMatch ? 0.9 : 0.5}
                    />
                  )}
                  {/* Dot */}
                  <circle
                    cx={x} cy={y} r={isSelected || isSearchMatch ? r + 2 : r}
                    fill={fill}
                    opacity={obj.kind === 'dso' ? 0.75 : 1}
                    stroke={isSelected || isSearchMatch ? 'rgba(255,255,255,0.8)' : 'transparent'}
                    strokeWidth={isSelected || isSearchMatch ? 1.5 : 0}
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
                  {/* Label for bright objects or search match */}
                  {(obj.magnitude < 1.5 || isSearchMatch) && obj.kind !== 'planet' && (
                    <text
                      x={x + r + 6}
                      y={y + 1}
                      fontSize={isSearchMatch ? '10' : '9'}
                      fill={isSearchMatch ? 'rgba(255,255,255,0.9)' : 'rgba(203,213,225,0.7)'}
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {obj.label}
                    </text>
                  )}
                  {obj.kind === 'planet' && (
                    <text
                      x={x + r + 6}
                      y={y + 1}
                      fontSize={isSearchMatch ? '10' : '9'}
                      fill={isSearchMatch ? 'rgba(255,255,255,0.9)' : 'rgba(251,191,36,0.85)'}
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
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {obj.description}
                  </p>
                  {obj.kind === 'star' && (
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono mt-2 bg-background/40 rounded-lg p-1.5">
                      <div className="flex items-center gap-1">
                        <Sunrise className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-muted-foreground">
                          {obj.isCircumpolar ? 'Always up' : obj.riseTime ? formatLocalTime(obj.riseTime) : 'Never rises'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sunset className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="text-muted-foreground">
                          {obj.isCircumpolar ? 'Never sets' : obj.setTime ? formatLocalTime(obj.setTime) : 'Never rises'}
                        </span>
                      </div>
                    </div>
                  )}
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
          { label: 'Planets', count: aboveHorizon.filter((o) => o.kind === 'planet').length, total: planets?.length ?? 0, color: 'text-yellow-400' },
          { label: 'Stars',   count: aboveHorizon.filter((o) => o.kind === 'star').length,   total: stars?.length ?? 0,   color: 'text-slate-200' },
          { label: 'DSOs',    count: aboveHorizon.filter((o) => o.kind === 'dso').length,    total: dsos?.length ?? 0,    color: 'text-sky-400'   },
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
