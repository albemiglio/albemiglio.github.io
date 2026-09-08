// tests/Work.test.tsx
import { render, screen } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { Work } from '../src/sections/Work';

test('renders the ipcam chapter with text, device and step bar', () => {
  render(<MotionProvider forceReduced><Work /></MotionProvider>);
  expect(screen.getByRole('heading', { name: /live video, without the vendor's cloud/i })).toBeInTheDocument();
  expect(screen.getByRole('figure', { name: /ipcam/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /flow steps/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Talk' })).toHaveAttribute('aria-current', 'step');
});
