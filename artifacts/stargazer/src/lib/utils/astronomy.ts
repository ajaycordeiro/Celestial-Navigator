export function formatLocalTime(isoString: string | null | undefined): string {
  if (!isoString) return '--:--';
  try {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '--:--';
  }
}

export function formatLocalDate(isoString: string | null | undefined): string {
  if (!isoString) return '--';
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return '--';
  }
}

export function getCompassDirection(azimuth: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

export function formatMagnitude(mag: number): string {
  const magStr = mag.toFixed(1);
  return mag > 0 ? `+${magStr}` : magStr;
}
