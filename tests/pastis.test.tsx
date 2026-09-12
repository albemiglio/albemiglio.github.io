import { render, screen } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { PastisScene } from '../src/flows/pastis/Scene';
import { pastisSteps } from '../src/flows/pastis/steps';

const at = (id: string) => pastisSteps.find((s) => s.id === id)!.state;
const mount = (state: Parameters<typeof PastisScene>[0]['state']) =>
  render(<MotionProvider forceReduced><PastisScene state={state} /></MotionProvider>);

test('new shows the three columns with the order card in the new column', () => {
  mount(at('new'));
  const col = screen.getByTestId('column-new');
  expect(screen.getByTestId('column-production')).toBeInTheDocument();
  expect(screen.getByTestId('column-ready')).toBeInTheDocument();
  expect(col).toContainElement(screen.getByTestId('order-card'));
});

test('configure shows the sheet with 3 tiers and the full lettering (reduced)', () => {
  mount(at('configure'));
  expect(screen.getByTestId('configure-sheet')).toBeInTheDocument();
  expect(screen.getByTestId('tiers')).toHaveTextContent('3');
  expect(screen.getByTestId('lettering')).toHaveTextContent('Happy 30th, Giulia');
});

test('produce moves the order card into the production column', () => {
  mount(at('produce'));
  const col = screen.getByTestId('column-production');
  expect(col).toContainElement(screen.getByTestId('order-card'));
});

test('ready moves the order card into the ready column with the check', () => {
  mount(at('ready'));
  const col = screen.getByTestId('column-ready');
  expect(col).toContainElement(screen.getByTestId('order-card'));
  expect(screen.getByTestId('check')).toBeInTheDocument();
});

test('pickup shows the receipt', () => {
  mount(at('pickup'));
  expect(screen.getByTestId('receipt')).toBeInTheDocument();
});
