import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useSkyLocation } from '@/contexts/LocationContext';
import { getTzAbbr } from '@/lib/utils/astronomy';

/** Slim clock bar pinned to the top-right of the content column. */
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

  const myTime   = fmt();
  const locTime  = timezone ? fmt(timezone) : null;
  const locAbbr  = timezone ? getTzAbbr(timezone) : null;
  const cityName = locationName ? locationName.split(',')[0] : null;

  return (
    <div className="w-full h-9 border-b border-border/50 bg-background/70 backdrop-blur-sm flex items-center justify-end px-4 md:px-6 gap-3 md:gap-4 flex-shrink-0 font-mono text-xs">
      {/* Your device time */}
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3 h-3 shrink-0" />
        <span className="hidden sm:inline uppercase tracking-wider text-[10px]">Your Time</span>
        <span className="tabular-nums text-foreground">{myTime}</span>
      </span>

      {/* Divider + location time */}
      {locTime && cityName && (
        <>
          <span className="w-px h-4 bg-border/60" />
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="hidden sm:inline uppercase tracking-wider text-[10px] max-w-[6rem] truncate" title={locationName ?? ''}>
              {cityName}
            </span>
            <span className="tabular-nums text-primary">{locTime}</span>
            {locAbbr && (
              <span className="text-[10px] text-muted-foreground">({locAbbr})</span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
