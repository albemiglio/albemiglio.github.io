export const ease = [0.22, 1, 0.36, 1] as const;
export const spring = { type: 'spring', stiffness: 260, damping: 30 } as const;

const full = { fast: 0.15, base: 0.35, slow: 0.6 } as const;
const none = { fast: 0, base: 0, slow: 0 } as const;

export type Durations = { fast: number; base: number; slow: number };

export function durations(reduced: boolean): Durations {
  return reduced ? none : full;
}
