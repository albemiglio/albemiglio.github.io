export type SceneTier = { dpr: number | [number, number]; shadows: boolean; antialias: boolean; lod: 'high' | 'low' };

// Three tiers: full (a desktop GPU), lite (small screens: no shadows, DPR capped at 2, low-poly models) and
// software (a CPU rasteriser — VMs, remote desktops, CI): every fragment costs there, so it runs
// at quarter resolution on top of lite (P3-R16).
export function sceneTier(width: number, software: boolean, devicePixelRatio = 1): SceneTier {
  if (software) return { dpr: 0.5, shadows: false, antialias: false, lod: 'low' };
  if (width < 768) return { dpr: [1, Math.min(devicePixelRatio, 2)], shadows: false, antialias: false, lod: 'low' };
  return { dpr: [1, Math.min(devicePixelRatio, 1.5)], shadows: true, antialias: true, lod: 'high' };
}
