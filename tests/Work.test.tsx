// tests/Work.test.tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { Work, chapters } from '../src/sections/Work';
import { Chapter } from '../src/sections/Chapter';
import { sceneStore } from '../src/scene/store';

test('renders the ipcam chapter with text, device and step bar', () => {
  render(<MotionProvider forceReduced><Work /></MotionProvider>);
  expect(screen.getByRole('heading', { name: /live video, without the vendor's cloud/i })).toBeInTheDocument();
  expect(screen.getByRole('figure', { name: /ipcam/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /flow steps/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Talk/ })).toHaveAttribute('aria-current', 'step');
});

test('hovering the stage pauses the chapter player; unhovering resumes it', () => {
  vi.useFakeTimers();
  const { container } = render(
    <MotionProvider>
      <Chapter def={chapters[0]} active register={() => {}} />
    </MotionProvider>,
  );
  const stage = container.querySelector('.chapter__stage') as HTMLElement;
  const currentStep = () => screen.getByRole('button', { current: 'step' }).textContent;

  const initial = currentStep();
  act(() => { fireEvent.mouseEnter(stage); });
  act(() => { vi.advanceTimersByTime(5000); });
  expect(currentStep()).toBe(initial);

  act(() => { fireEvent.mouseLeave(stage); });
  act(() => { vi.advanceTimersByTime(5000); });
  expect(currentStep()).not.toBe(initial);

  vi.useRealTimers();
});

test('with the scene gated off, the chapter falls back to the static image', () => {
  // The store is module-level and can carry state across tests in this file — pin it explicitly.
  sceneStore.set({ sceneOpen: false });
  const { container } = render(<MotionProvider forceReduced><Work /></MotionProvider>);
  const img = container.querySelector('.chapter__object img');
  expect(img).toHaveAttribute('src', '/fallback/ipcam.png');
});
