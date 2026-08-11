import React from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetSkyWeather, getGetSkyWeatherQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CloudRainWind, Thermometer, Wind, Droplets, Eye, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

function SeeingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.div
          key={star}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: star * 0.1 }}
        >
          <svg
            className={`w-8 h-8 md:w-12 md:h-12 ${star <= rating ? 'text-secondary drop-shadow-[0_0_8px_rgba(255,165,0,0.8)] fill-secondary' : 'text-muted-foreground/30 fill-transparent'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export default function Weather() {
  const { lat, lon } = useSkyLocation();
  
  const { data: weather, isLoading } = useGetSkyWeather(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetSkyWeatherQueryKey({ lat: lat!, lon: lon! }) } }
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-sans flex items-center gap-3">
          <CloudRainWind className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          Seeing Conditions
        </h1>
        <p className="text-muted-foreground mt-2">Atmospheric clarity and local weather affecting observation.</p>
      </header>

      {isLoading || !weather ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl bg-card/50" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-card/50" />)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 bg-card/40 backdrop-blur border-border/50 relative overflow-hidden flex flex-col items-center text-center">
              
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6 relative z-10">Atmospheric Seeing Rating</h2>
              
              <div className="mb-6 relative z-10">
                <SeeingStars rating={weather.seeingRating} />
              </div>
              
              <div className="relative z-10">
                <span className="text-2xl font-bold mb-2 block">{weather.conditions}</span>
                <p className="text-muted-foreground max-w-xl mx-auto">{weather.seeingDescription}</p>
              </div>

            </Card>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-5 bg-card/60 border-border/50 hover:bg-card/80 transition-colors h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Cloud className="w-5 h-5" /> <span className="text-sm font-mono uppercase">Cloud Cover</span>
                </div>
                <div>
                  <div className="text-3xl font-mono font-bold mb-2">{weather.cloudCover}%</div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${weather.cloudCover}%` }} />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-5 bg-card/60 border-border/50 hover:bg-card/80 transition-colors h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Eye className="w-5 h-5" /> <span className="text-sm font-mono uppercase">Transparency</span>
                </div>
                <div>
                  <div className="text-xl font-bold font-sans text-secondary">{weather.transparency}</div>
                  <div className="text-xs text-muted-foreground mt-1">Clarity of deep sky</div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-5 bg-card/60 border-border/50 hover:bg-card/80 transition-colors h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Thermometer className="w-5 h-5" /> <span className="text-sm font-mono uppercase">Temperature</span>
                </div>
                <div>
                  <div className="text-3xl font-mono font-bold">{weather.temperature.toFixed(1)}°</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-blue-400">
                    <Droplets className="w-3 h-3"/> Dew Pt: {weather.dewPoint.toFixed(1)}°
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-5 bg-card/60 border-border/50 hover:bg-card/80 transition-colors h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Wind className="w-5 h-5" /> <span className="text-sm font-mono uppercase">Wind</span>
                </div>
                <div>
                  <div className="text-3xl font-mono font-bold">{weather.windSpeed.toFixed(0)} <span className="text-sm">km/h</span></div>
                  <div className="text-xs text-muted-foreground mt-1">Impacts scope stability</div>
                </div>
              </Card>
            </motion.div>
          </div>

        </div>
      )}
    </div>
  );
}
