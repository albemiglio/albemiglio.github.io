// tests/Work.test.tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { Work, chapters } from '../src/sections/Work';
import { Chapter } from '../src/sections/Chapter';

test('renders the ipcam chapter with text, device and step bar', () => {
  render(<MotionProvider forceReduced><Work /></MotionProvider>);
  const scope = within(document.getElementById('work-ipcam')!);
  expect(scope.getByRole('heading', { name: /live video, without the vendor's cloud/i })).toBeInTheDocument();
  expect(scope.getByRole('figure', { name: /ipcam/i })).toBeInTheDocument();
  expect(scope.getByRole('group', { name: /flow steps/i })).toBeInTheDocument();
  expect(scope.getByRole('button', { name: /Recordings/ })).toHaveAttribute('aria-current', 'step');
});

test('renders the asd chapter alongside ipcam', () => {
  render(<MotionProvider forceReduced><Work /></MotionProvider>);
  expect(screen.getByRole('heading', { name: /a club that runs itself/i })).toBeInTheDocument();
  expect(screen.getByRole('figure', { name: /^asd —/i })).toBeInTheDocument();
});

test('renders all four chapters', () => {
  render(<MotionProvider forceReduced><Work /></MotionProvider>);
  expect(screen.getAllByRole('figure')).toHaveLength(4);
  expect(screen.getByRole('heading', { name: /the exam, with the clock running/i })).toBeInTheDocument();
  expect(screen.getByRole('figure', { name: /^med —/i })).toBeInTheDocument();
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

