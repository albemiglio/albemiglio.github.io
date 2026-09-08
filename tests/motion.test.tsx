import { render, screen } from '@testing-library/react';
import { durations, ease, spring } from '../src/motion';
import { MotionProvider, useMotionPrefs } from '../src/MotionProvider';

function Probe() {
  const { reduced, dur } = useMotionPrefs();
  return <span>{reduced ? 'reduced' : 'full'}:{dur.slow}</span>;
}

test('durations collapse to zero under reduced motion', () => {
  expect(durations(false)).toEqual({ fast: 0.15, base: 0.35, slow: 0.6 });
  expect(durations(true)).toEqual({ fast: 0, base: 0, slow: 0 });
  expect(ease).toEqual([0.22, 1, 0.36, 1]);
  expect(spring).toEqual({ type: 'spring', stiffness: 260, damping: 30 });
});

test('provider exposes the system preference', () => {
  render(<MotionProvider><Probe /></MotionProvider>);
  expect(screen.getByText('full:0.6')).toBeInTheDocument();
});

test('provider can be forced to reduced', () => {
  render(<MotionProvider forceReduced><Probe /></MotionProvider>);
  expect(screen.getByText('reduced:0')).toBeInTheDocument();
});
