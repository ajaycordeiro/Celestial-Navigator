import React from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetISSPasses, getGetISSPassesQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Satellite, MapPin, Navigation, Clock, Activity, Calendar } from 'lucide-react';
import { formatLocalTime, formatLocalDate } from '@/lib/utils/astronomy';
import { motion } from 'framer-motion';

export default function ISS() {
  const { lat, lon } = useSkyLocation();
  
  const { data: issInfo, isLoading } = useGetISSPasses(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetISSPassesQueryKey({ lat: lat!, lon: lon! }), refetchInterval: 60000 } } // Refresh every minute
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
          <Satellite className="w-8 h-8 text-primary" />
          ISS Tracker
        </h1>
        <p className="text-muted-foreground mt-2">Real-time telemetry and visible flyovers for the International Space Station.</p>
      </header>

      {isLoading || !issInfo ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-64 rounded-xl bg-card/50" />
          <div className="lg:col-span-8 space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-card/50" />)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-6 bg-card/60 backdrop-blur border-primary/30 shadow-[0_0_20px_rgba(0,212,255,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Satellite className="w-32 h-32" />
                </div>
                
                <h2 className="text-sm font-mono text-muted-foreground uppercase mb-6 tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Live Telemetry
                </h2>
                
                <div className="space-y-6 relative z-10">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono mb-1">COORDINATES</div>
                    <div className="text-2xl font-mono text-foreground">
                      {issInfo.currentLocation.lat.toFixed(4)}°<br/>
                      {issInfo.currentLocation.lon.toFixed(4)}°
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1">ALTITUDE</div>
                      <div className="text-xl font-mono text-secondary">{issInfo.currentLocation.altitude.toFixed(0)} km</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1">VELOCITY</div>
                      <div className="text-xl font-mono text-secondary">{issInfo.currentLocation.velocity.toFixed(0)} km/h</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50 text-xs font-mono text-primary animate-pulse">
                    Last sync: {formatLocalTime(issInfo.currentLocation.timestamp)}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <h3 className="text-xl font-bold mb-4">Upcoming Visible Passes</h3>
            
            {issInfo.passes.length > 0 ? (
              <div className="space-y-4">
                {issInfo.passes.map((pass, idx) => {
                  const isNext = idx === 0;
                  return (
                    <motion.div 
                      key={pass.riseTime}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className={`p-4 md:p-6 transition-all border ${isNext ? 'bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(0,212,255,0.15)]' : 'bg-card/40 border-border/50 hover:bg-card/60'}`}>
                        {isNext && (
                          <div className="mb-4 inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                            Next Flyover
                          </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1 font-mono text-sm">
                              <Calendar className="w-4 h-4" /> {formatLocalDate(pass.riseTime)}
                            </div>
                            <div className="text-2xl font-bold font-mono text-foreground flex items-center gap-3">
                              {formatLocalTime(pass.riseTime)}
                              <span className="text-sm font-sans font-normal text-muted-foreground bg-background px-2 py-1 rounded">
                                {Math.round(pass.duration / 60)} min {pass.duration % 60} sec
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-8 md:gap-12">
                            <div>
                              <div className="text-xs text-muted-foreground font-mono mb-1 flex items-center gap-1">
                                <Navigation className="w-3 h-3" /> MAX ALT
                              </div>
                              <div className={`text-xl font-mono ${pass.maxAltitude > 45 ? 'text-primary glow-text' : 'text-foreground'}`}>
                                {pass.maxAltitude}°
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground font-mono mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> APPROACH
                              </div>
                              <div className="text-xl font-mono text-foreground">
                                {pass.direction}
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card/20 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground font-mono">No visible passes in the next 10 days for your location.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
