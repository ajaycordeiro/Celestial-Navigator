import React, { useMemo } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { LocationPicker } from '@/components/LocationPicker';
import { useGetSkyOverview, getGetSkyOverviewQueryKey } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { formatLocalTime } from '@/lib/utils/astronomy';
import { Link } from 'wouter';
import {
  Moon,
  Orbit,
  Sparkles,
  Compass,
  Calendar,
  Satellite,
  CloudRainWind,
  Sunrise,
  Sunset,
  ArrowRight,
  MapPin
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
  const { lat, lon, locationName } = useSkyLocation();
  const [changingLocation, setChangingLocation] = React.useState(false);

  const { data: overview, isLoading, error } = useGetSkyOverview(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetSkyOverviewQueryKey({ lat: lat!, lon: lon! }) } }
  );

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
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground bg-card/40 px-4 py-2 rounded-lg border border-border/50 backdrop-blur">
             <span>LOCAL TIME</span>
             <span className="text-secondary">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                    <div className="text-3xl font-bold font-mono glow-text">{Math.round(overview.moonIllumination * 100)}%</div>
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
                      <span className="font-mono">{formatLocalTime(overview.sunsetTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">True Dark</span>
                      <span className="font-mono text-primary">{formatLocalTime(overview.astronomicalTwilightEnd)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardLink to="/planets" icon={Orbit} label="Planets" />
              <DashboardLink to="/moon" icon={Moon} label="Moon Phase" />
              <DashboardLink to="/stars" icon={Sparkles} label="Star Atlas" />
              <DashboardLink to="/deep-sky" icon={Compass} label="Deep Sky" />
              <DashboardLink to="/events" icon={Calendar} label="Events" />
              <DashboardLink to="/iss" icon={Satellite} label="ISS Tracker" />
              <DashboardLink to="/weather" icon={CloudRainWind} label="Conditions" />
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
