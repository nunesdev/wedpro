export function secondsToMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [hrs, mins] = timeStr.split(':').map(Number);
  return hrs * 60 + mins;
}

export function formatMinutesToTime(totalMins: number): string {
  const hrs = Math.floor(totalMins / 60) % 24;
  const mins = totalMins % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
