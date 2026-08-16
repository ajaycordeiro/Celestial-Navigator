export function formatLocalTime(
  isoString: string | null | undefined,
  timezone?: string
): string {
  if (!isoString) return '--:--';
  try {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...(timezone ? { timeZone: timezone } : {}),
    });
  } catch {
    return '--:--';
  }
}

export function formatLocalDate(
  isoString: string | null | undefined,
  timezone?: string
): string {
  if (!isoString) return '--';
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...(timezone ? { timeZone: timezone } : {}),
    });
  } catch {
    return '--';
  }
}

/** Returns the short timezone abbreviation, e.g. "IST", "EDT", "PST" */
export function getTzAbbr(timezone?: string): string {
  if (!timezone) return '';
  try {
    return (
      new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
        .formatToParts(new Date())
        .find(p => p.type === 'timeZoneName')?.value ?? ''
    );
  } catch {
    return '';
  }
}

export function getCompassDirection(azimuth: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  return directions[Math.round(azimuth / 22.5) % 16];
}

export function formatMagnitude(mag: number): string {
  const magStr = mag.toFixed(1);
  return mag > 0 ? `+${magStr}` : magStr;
}
