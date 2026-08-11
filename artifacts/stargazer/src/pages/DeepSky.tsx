import React, { useState } from 'react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { useGetDeepSkyObjects, useSearchNasaImages, getGetDeepSkyObjectsQueryKey, getSearchNasaImagesQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, Telescope, Info } from 'lucide-react';
import { motion } from 'framer-motion';

function NasaImageDisplay({ query, title }: { query: string, title: string }) {
  const { data: images, isLoading } = useSearchNasaImages(
    { q: query, count: 1 },
    { query: { enabled: !!query, queryKey: getSearchNasaImagesQueryKey({ q: query, count: 1 }), staleTime: Infinity } }
  );

  if (isLoading) {
    return <Skeleton className="w-full h-48 bg-card-border/50" />;
  }

  const imageUrl = images?.[0]?.url;

  if (!imageUrl) {
    return (
      <div className="w-full h-48 bg-background flex flex-col items-center justify-center text-muted-foreground">
        <Telescope className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs font-mono">No imagery available</span>
      </div>
    );
  }

  return (
    <div className="w-full h-48 relative overflow-hidden group">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100 mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-white/50 font-mono">
        NASA / JPL
      </div>
    </div>
  );
}

export default function DeepSky() {
  const { lat, lon } = useSkyLocation();
  const [filterType, setFilterType] = useState<string>('All');

  const { data: objects, isLoading } = useGetDeepSkyObjects(
    { lat: lat!, lon: lon! },
    { query: { enabled: !!lat && !!lon, queryKey: getGetDeepSkyObjectsQueryKey({ lat: lat!, lon: lon! }) } }
  );

  const types = React.useMemo(() => {
    if (!objects) return ['All'];
    const uniqueTypes = Array.from(new Set(objects.map(o => o.type)));
    return ['All', ...uniqueTypes.sort()];
  }, [objects]);

  const filteredObjects = React.useMemo(() => {
    if (!objects) return [];
    let filtered = objects;
    if (filterType !== 'All') {
      filtered = filtered.filter(o => o.type === filterType);
    }
    // Sort by visibility then magnitude
    return filtered.sort((a, b) => {
      if (a.isVisible && !b.isVisible) return -1;
      if (!a.isVisible && b.isVisible) return 1;
      return a.magnitude - b.magnitude;
    });
  }, [objects, filterType]);

  const notableIds = ['M31', 'M42', 'M45', 'M57', 'M27', 'M13', 'M51', 'M104', 'M82', 'M81'];

  return (
    <div className="flex flex-col gap-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans flex items-center gap-3">
            <Compass className="w-8 h-8 text-primary" />
            Deep Sky Objects
          </h1>
          <p className="text-muted-foreground mt-2">Galaxies, nebulae, and star clusters beyond our solar system.</p>
        </div>
        
        {types.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {types.map(type => (
              <Badge 
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                className={`cursor-pointer ${filterType === type ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,212,255,0.5)]' : 'hover:bg-accent'}`}
                onClick={() => setFilterType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-xl bg-card/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObjects.map((obj, idx) => {
            const hasImage = notableIds.includes(obj.id);
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={obj.id}
              >
                <Card className={`overflow-hidden flex flex-col h-full bg-card/40 backdrop-blur border-border/50 hover:border-primary/30 transition-all group ${obj.isVisible ? '' : 'opacity-70'}`}>
                  
                  {hasImage ? (
                    <NasaImageDisplay query={obj.name || obj.id} title={obj.name} />
                  ) : (
                    <div className="h-16 bg-background/50 border-b border-border/50 flex items-center px-4 overflow-hidden relative">
                       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1 relative z-10 -mt-8">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-card/90 backdrop-blur-md px-3 py-1 rounded border border-border shadow-lg">
                        <span className="text-xl font-bold font-mono text-primary glow-text">{obj.id}</span>
                      </div>
                      {obj.isVisible && obj.altitude > 10 && (
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30 mt-2">Visible Tonight</Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold mt-2">{obj.name || obj.type}</h3>
                    <div className="text-sm text-muted-foreground font-mono mb-4">{obj.type} • {obj.constellation}</div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                      {obj.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono mt-auto">
                      <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                        <span className="text-muted-foreground">MAG</span>
                        <span className="text-foreground">{obj.magnitude.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                        <span className="text-muted-foreground">ALT</span>
                        <span className={obj.altitude > 0 ? 'text-primary' : 'text-muted-foreground'}>{obj.altitude.toFixed(0)}°</span>
                      </div>
                      <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                        <span className="text-muted-foreground">SIZE</span>
                        <span className="text-foreground">{obj.angularSize}</span>
                      </div>
                      <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                        <span className="text-muted-foreground">DIST</span>
                        <span className="text-foreground">{obj.distanceLY > 1000000 ? `${(obj.distanceLY/1000000).toFixed(1)}M ly` : `${(obj.distanceLY/1000).toFixed(1)}k ly`}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {filteredObjects.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground font-mono">
              No objects match this criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
