import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepBar } from '../src/flows/StepBar';

const steps = [
  { id: 'a', label: 'Alpha', ms: 1000 },
  { id: 'b', label: 'Beta', ms: 1000 },
  { id: 'c', label: 'Gamma', ms: 1000 },
];

test('marks the current step and selects on click', async () => {
  const onSelect = vi.fn();
  render(<StepBar steps={steps} index={1} playing color="#F0B24A" onSelect={onSelect} />);
  expect(screen.getByRole('button', { name: /Beta/ })).toHaveAttribute('aria-current', 'step');
  expect(screen.getByRole('button', { name: /Alpha/ })).not.toHaveAttribute('aria-current');
  await userEvent.click(screen.getByRole('button', { name: /Gamma/ }));
  expect(onSelect).toHaveBeenCalledWith(2);
});

test('arrow keys move and clamp', async () => {
  const onSelect = vi.fn();
  render(<StepBar steps={steps} index={2} playing={false} color="#F0B24A" onSelect={onSelect} />);
  screen.getByRole('button', { name: /Gamma/ }).focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(onSelect).not.toHaveBeenCalled();
  await userEvent.keyboard('{ArrowLeft}');
  expect(onSelect).toHaveBeenCalledWith(1);
});

test('the fill animation pauses when not playing', () => {
  const { rerender } = render(<StepBar steps={steps} index={0} playing color="#F0B24A" onSelect={() => {}} />);
  const fill = screen.getByTestId('step-fill-a');
  expect(fill.style.animationPlayState).toBe('running');
  expect(fill.style.animationDuration).toBe('1000ms');
  rerender(<StepBar steps={steps} index={0} playing={false} color="#F0B24A" onSelect={() => {}} />);
  expect(fill.style.animationPlayState).toBe('paused');
});
