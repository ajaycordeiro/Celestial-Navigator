import React from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { LocationPicker } from '@/components/LocationPicker';
import { useGetSkyOverview, getGetSkyOverviewQueryKey } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { formatLocalTime, getTzAbbr } from '@/lib/utils/astronomy';
import { Link } from 'wouter';
import {
  Moon,
  Orbit,
  Sparkles,
  Compass,
  Satellite,
  CloudRainWind,
  Sunset,
  ArrowRight,
  MapPin,
  Sun,
  Map as MapIcon,
  Telescope,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';


const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { lat, lon, locationName, timezone } = useSkyLocation();
  const [changingLocation, setChangingLocation] = React.useState(false);
  const [planState, setPlanState] = React.useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'done'; text: string } | { status: 'error'; message: string }
  >({ status: 'idle' });

  const { data: overview, isLoading, error } = useGetSkyOverview(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetSkyOverviewQueryKey({ lat: lat!, lon: lon! }) } }
  );

  async function handlePlanMyNight() {
    if (!lat || !lon) return;
    setPlanState({ status: 'loading' });
    try {
      const res = await fetch(`/api/sky/plan?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { plan: string };
      setPlanState({ status: 'done', text: data.plan });
    } catch (e) {
      setPlanState({ status: 'error', message: 'Could not generate plan. Try again in a moment.' });
    }
  }

  if (!lat || !lon) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[80vh]">
        <div className="absolute inset-0 starfield pointer-events-none" />
        <LocationPicker />
      </div>
    );
  }

  return (
    <div className="flex-1 relative pb-20">
      <div className="absolute inset-0 starfield pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-sans tracking-tight mb-2">Tonight's Sky</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Observatory locked to: <span className="text-foreground">{locationName}</span>
              </p>
              <button
                onClick={() => setChangingLocation(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-mono font-medium hover:bg-primary/20 hover:border-primary/70 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {changingLocation ? 'Cancel' : 'Change Location'}
              </button>
            </div>
          </div>
        </header>

        {changingLocation && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <LocationPicker onDone={() => setChangingLocation(false)} />
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-xl bg-card/50" />
            <Skeleton className="h-48 rounded-xl bg-card/50" />
            <Skeleton className="h-48 rounded-xl bg-card/50" />
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-destructive/10 border border-destructive/20 rounded-xl text-destructive-foreground">
            Error loading sky telemetry. Re-aligning sensors...
          </div>
        ) : overview ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-8"
          >
            {/* Top Telemetry Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Illumination */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card/60 backdrop-blur border-card-border h-full flex flex-col justify-between hover-elevate">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Moon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground uppercase">Illumination</span>
                  </div>
                  <div>
                    <div className="text-3xl font-bold font-mono glow-text">{overview.moonIllumination.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground mt-1">{overview.moonPhaseName}</div>
                  </div>
                </Card>
              </motion.div>

              {/* Targets */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card/60 backdrop-blur border-card-border h-full flex flex-col justify-between hover-elevate">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                      <Orbit className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground uppercase">Active Targets</span>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <div className="text-3xl font-bold font-mono glow-text-secondary">{overview.visiblePlanetCount}</div>
                      <div className="text-sm text-muted-foreground mt-1">Planets</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold font-mono">{overview.visibleDeepSkyCount}</div>
                      <div className="text-sm text-muted-foreground mt-1">Deep Sky</div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Solar Cycle */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card/60 backdrop-blur border-card-border h-full flex flex-col justify-between hover-elevate">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-accent text-accent-foreground">
                      <Sunset className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground uppercase">Solar Cycle</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><Sunset className="w-4 h-4"/> Sunset</span>
                      <span className="font-mono">{formatLocalTime(overview.sunsetTime, timezone)} <span className="text-[10px] text-muted-foreground">{getTzAbbr(timezone)}</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">True Dark</span>
                      <span className="font-mono text-primary">{formatLocalTime(overview.astronomicalTwilightEnd, timezone)} <span className="text-[10px] text-muted-foreground">{getTzAbbr(timezone)}</span></span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Plan My Night */}
            <motion.div variants={item} className="flex flex-col gap-4">
              <button
                onClick={handlePlanMyNight}
                disabled={planState.status === 'loading'}
                className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/70 text-primary font-semibold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {planState.status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Reading the sky…
                  </>
                ) : (
                  <>
                    <Telescope className="w-5 h-5" />
                    Plan My Night
                  </>
                )}
              </button>

              {planState.status === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <Card className="p-6 bg-card/60 backdrop-blur border-primary/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Telescope className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs text-primary uppercase tracking-wider">Tonight's Observing Plan</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{planState.text}</p>
                  </Card>
                </motion.div>
              )}

              {planState.status === 'error' && (
                <p className="text-center text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                  {planState.message}
                </p>
              )}
            </motion.div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardLink to="/skymap" icon={MapIcon} label="Sky Map" />
              <DashboardLink to="/planets" icon={Orbit} label="Planets" />
              <DashboardLink to="/moon" icon={Moon} label="Moon Phase" />
              <DashboardLink to="/stars" icon={Sparkles} label="Stars" />
              <DashboardLink to="/deep-sky" icon={Compass} label="Deep Sky" />
              <DashboardLink to="/iss" icon={Satellite} label="ISS Tracker" />
              <DashboardLink to="/weather" icon={CloudRainWind} label="Conditions" />
              <DashboardLink to="/analemma" icon={Sun} label="Analemma" />
            </div>

          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function DashboardLink({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
  return (
    <motion.div variants={item}>
      <Link href={to} className="block group">
        <Card className="p-4 bg-card/40 backdrop-blur border-border hover:border-primary/50 transition-colors cursor-pointer group-hover:bg-primary/5 flex flex-col items-center justify-center text-center gap-3 h-32 relative overflow-hidden">
          <Icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 duration-300" />
          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{label}</span>
          <ArrowRight className="w-4 h-4 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all text-primary" />
        </Card>
      </Link>
    </motion.div>
  );
}
