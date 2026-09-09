import { act, render, screen } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { MedScene } from '../src/flows/med/Scene';
import { medSteps } from '../src/flows/med/steps';
import { questions } from '../src/flows/med/data';

const at = (id: string) => medSteps.find((s) => s.id === id)!.state;
const mountReduced = (state: Parameters<typeof MedScene>[0]['state']) =>
  render(<MotionProvider forceReduced><MedScene state={state} /></MotionProvider>);

test('question shows the prompt, four options and the timer at 30', () => {
  mountReduced(at('question'));
  expect(screen.getByTestId('question-title')).toHaveTextContent(questions[0].prompt);
  expect(screen.getAllByTestId(/^option-/)).toHaveLength(4);
  expect(screen.getByTestId('timer')).toHaveTextContent('30');
});

test('the timer ticks down for real (non-reduced) and stops at "Time\'s up"', () => {
  vi.useFakeTimers();
  render(<MotionProvider><MedScene state={at('question')} /></MotionProvider>);
  act(() => { vi.advanceTimersByTime(5000); });
  expect(screen.getByTestId('timer')).toHaveTextContent('25');
  act(() => { vi.advanceTimersByTime(25000); });
  expect(screen.getByTestId('times-up')).toBeInTheDocument();
  vi.useRealTimers();
});

test('with reduced motion the timer stays at 30', () => {
  vi.useFakeTimers();
  mountReduced(at('question'));
  act(() => { vi.advanceTimersByTime(30000); });
  expect(screen.getByTestId('timer')).toHaveTextContent('30');
  expect(screen.queryByTestId('times-up')).toBeNull();
  vi.useRealTimers();
});

test('answer marks option B as selected', () => {
  mountReduced(at('answer'));
  expect(screen.getByTestId('option-B')).toHaveAttribute('data-selected');
});

test('review marks B wrong and D right, and shows the explanation', () => {
  mountReduced(at('review'));
  expect(screen.getByTestId('option-B')).toHaveAttribute('data-result', 'wrong');
  expect(screen.getByTestId('option-D')).toHaveAttribute('data-result', 'right');
  expect(screen.getByTestId('explanation')).toBeInTheDocument();
});

test('score shows 8 (reduced -> instant) with a progress bar at 0.4 or more', () => {
  mountReduced(at('score'));
  expect(screen.getByTestId('score')).toHaveTextContent('8');
  const progress = Number(screen.getByTestId('progress').style.getPropertyValue('--progress'));
  expect(progress).toBeGreaterThanOrEqual(0.4);
});

test('next shows the second question', () => {
  mountReduced(at('next'));
  expect(screen.getByTestId('question-title')).toHaveTextContent(questions[1].prompt);
});

test('the timer keeps counting through the question -> answer transition (no restart)', () => {
  vi.useFakeTimers();
  const setIntervalSpy = vi.spyOn(global, 'setInterval');
  const { rerender } = render(<MotionProvider><MedScene state={at('question')} /></MotionProvider>);
  act(() => { vi.advanceTimersByTime(5000); });
  expect(screen.getByTestId('timer')).toHaveTextContent('25');
  const callsBeforeAnswer = setIntervalSpy.mock.calls.length;
  rerender(<MotionProvider><MedScene state={at('answer')} /></MotionProvider>);
  // the same question, still timed: the interval must not be torn down and rebuilt
  expect(setIntervalSpy.mock.calls.length).toBe(callsBeforeAnswer);
  act(() => { vi.advanceTimersByTime(5000); });
  expect(screen.getByTestId('timer')).toHaveTextContent('20');
  vi.useRealTimers();
  setIntervalSpy.mockRestore();
});

test('stops the interval once it reaches 0 (no ticks left running)', () => {
  vi.useFakeTimers();
  render(<MotionProvider><MedScene state={at('question')} /></MotionProvider>);
  act(() => { vi.advanceTimersByTime(30000); });
  expect(screen.getByTestId('times-up')).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(5000); });
  expect(screen.getByTestId('times-up')).toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});
