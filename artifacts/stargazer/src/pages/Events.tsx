import React from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetCelestialEvents, getGetCelestialEventsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

function getTypeStyle(type: string) {
  const t = type.toLowerCase();
  if (t.includes('meteor')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  if (t.includes('eclipse')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  if (t.includes('conjunction')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (t.includes('opposition')) return 'bg-green-500/20 text-green-400 border-green-500/30';
  return 'bg-primary/20 text-primary border-primary/30';
}

function getDaysUntil(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function Events() {
  const { lat, lon } = useSkyLocation();
  
  const { data: events, isLoading } = useGetCelestialEvents(
    { lat: lat!, lon: lon!, days: 90 },
    { query: { enabled: !!lat && !!lon, queryKey: getGetCelestialEventsQueryKey({ lat: lat!, lon: lon!, days: 90 }) } }
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          Celestial Events
        </h1>
        <p className="text-muted-foreground mt-2">Upcoming astronomical phenomena in the next 90 days.</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-card/50" />
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="relative border-l border-border/50 ml-4 pl-6 space-y-12">
          {events.map((event, idx) => {
            const daysUntil = getDaysUntil(event.date);
            const dateObj = new Date(event.date);
            
            return (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={`${event.name}-${event.date}`}
                className="relative"
              >
                {/* Timeline node */}
                <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(0,212,255,0.5)] z-10" />
                
                <Card className="p-6 bg-card/40 backdrop-blur border-border/50 hover:bg-card/60 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <Badge className={getTypeStyle(event.type)}>{event.type}</Badge>
                        <span className="text-sm font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">{event.name}</h2>
                    </div>
                    
                    <div className="bg-background/80 px-4 py-2 rounded-lg border border-border flex flex-col items-center min-w-[100px]">
                      <span className="text-2xl font-mono font-bold text-primary glow-text">
                        {daysUntil === 0 ? 'Today' : daysUntil}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        {daysUntil === 0 ? '' : daysUntil === 1 ? 'Day away' : 'Days away'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 max-w-3xl leading-relaxed">
                    {event.description}
                  </p>
                  
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-3">
                    <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-foreground block mb-1">Viewing Advice</span>
                      <span className="text-sm text-muted-foreground">{event.visibility}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground font-mono border border-dashed border-border rounded-xl bg-card/20">
          No significant events reported in the upcoming window.
        </div>
      )}
    </div>
  );
}
