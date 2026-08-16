import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { getTzAbbr } from '@/lib/utils/astronomy';

export function ObservatoryClocks() {
  const { locationName, timezone } = useSkyLocation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (tz?: string) =>
    now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      ...(tz ? { timeZone: tz } : {}),
    });

  const myTime  = fmt();
  const locTime = timezone ? fmt(timezone) : null;
  const locAbbr = timezone ? getTzAbbr(timezone) : null;
  const cityName = locationName ? locationName.split(',')[0] : 'Location';

  return (
    <div className="font-mono text-xs text-muted-foreground">
      {/* Desktop sidebar layout — stacked rows */}
      <div className="hidden md:flex flex-col gap-2 px-4 py-4 border-t border-border/50">
        <div className="flex items-center justify-between gap-2">
          <span className="uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3" /> Your Time
          </span>
          <span className="text-foreground tabular-nums">{myTime}</span>
        </div>
        {locTime && (
          <div className="flex items-center justify-between gap-2">
            <span className="uppercase tracking-wider text-[10px] truncate max-w-[7rem]" title={locationName}>
              {cityName} {locAbbr && <span className="text-primary/70">({locAbbr})</span>}
            </span>
            <span className="text-primary tabular-nums">{locTime}</span>
          </div>
        )}
      </div>

      {/* Mobile — slim horizontal bar */}
      <div className="md:hidden flex items-center justify-end gap-4 px-4 py-1.5 border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className="tabular-nums text-foreground">{myTime}</span>
        </span>
        {locTime && (
          <span className="flex items-center gap-1">
            <span className="text-[10px] uppercase truncate max-w-[5rem]">{cityName}</span>
            <span className="tabular-nums text-primary">{locTime}</span>
            {locAbbr && <span className="text-[10px] text-muted-foreground">({locAbbr})</span>}
          </span>
        )}
      </div>
    </div>
  );
}
