import { act, render, screen } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { IpcamScene } from '../src/flows/ipcam/Scene';
import { ipcamSteps } from '../src/flows/ipcam/steps';

const at = (id: string) => ipcamSteps.find((s) => s.id === id)!.state;
const mount = (state: Parameters<typeof IpcamScene>[0]['state']) =>
  render(<MotionProvider forceReduced><IpcamScene state={state} /></MotionProvider>);

test('declares five steps in the specified order', () => {
  expect(ipcamSteps.map((s) => s.id)).toEqual(['grid', 'live', 'ptz', 'rec', 'talk']);
  expect(ipcamSteps.map((s) => s.ms)).toEqual([1200, 1600, 1800, 1400, 1400]);
});

test('grid shows four offline cameras', () => {
  mount(at('grid'));
  expect(screen.getAllByTestId('cam-tile')).toHaveLength(4);
  expect(screen.queryByTestId('player')).toBeNull();
});

test('live shows buffering then the frame', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] });
  mount(at('live'));
  expect(screen.getByTestId('buffering')).toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(500));
  if (screen.queryByTestId('buffering')) await act(() => vi.advanceTimersByTimeAsync(150));
  expect(screen.queryByTestId('buffering')).toBeNull();
  expect(screen.getByTestId('frame')).toBeInTheDocument();
  vi.useRealTimers();
});

test('ptz moves the joystick and the frame in opposite directions', () => {
  vi.useFakeTimers();
  mount(at('ptz'));
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByTestId('joystick').dataset.pan).toBe('1');
  expect(screen.getByTestId('joystick').dataset.tilt).toBe('-1');
  expect(screen.getByTestId('frame').dataset.offset).toBe('-1,1');
  vi.useRealTimers();
});

test('rec shows the badge and one clip; talk shows the waveform', () => {
  vi.useFakeTimers();
  const { unmount } = mount(at('rec'));
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByText('REC')).toBeInTheDocument();
  expect(screen.getAllByTestId('clip')).toHaveLength(1);
  unmount();
  mount(at('talk'));
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByTestId('waveform')).toBeInTheDocument();
  vi.useRealTimers();
});
