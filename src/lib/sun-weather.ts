/** WMO weather codes mapped to the community's requested sun visibility. */
export function sunWeather(code: number): { cloud: number; disc: number } {
  if (code >= 95) return { cloud: 0.9, disc: 0 };
  if (code >= 3) return { cloud: 0.8, disc: 0 };
  if (code === 2) return { cloud: 0.5, disc: 0.35 };
  if (code === 1) return { cloud: 0.2, disc: 0.85 };
  return { cloud: 0, disc: 1 };
}