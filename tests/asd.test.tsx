import { render, screen } from '@testing-library/react';
import { MotionProvider } from '../src/MotionProvider';
import { AsdScene } from '../src/flows/asd/Scene';
import { asdSteps } from '../src/flows/asd/steps';
import { members, newMember } from '../src/flows/asd/data';

const at = (id: string) => asdSteps.find((s) => s.id === id)!.state;
const mount = (state: Parameters<typeof AsdScene>[0]['state']) =>
  render(<MotionProvider forceReduced><AsdScene state={state} /></MotionProvider>);

test('list shows every member and focuses the new-member button', () => {
  mount(at('list'));
  expect(screen.getAllByTestId('member-row')).toHaveLength(members.length);
  expect(members.length).toBe(5);
  const btn = screen.getByRole('button', { name: /new member/i });
  expect(btn).toHaveAttribute('data-highlight');
});

test('form shows the sign-up form with the name already typed (reduced)', () => {
  mount(at('form'));
  expect(screen.getByRole('form')).toBeInTheDocument();
  expect(screen.getByText(newMember.name)).toBeInTheDocument();
});

test('family shows the parent card positioned after the new member row', () => {
  mount(at('family'));
  const newRow = screen.getByTestId('new-row');
  const familyCard = screen.getByTestId('family-card');
  expect(newRow.compareDocumentPosition(familyCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('fee shows the paid badge and the counted amount (reduced -> instant)', () => {
  mount(at('fee'));
  expect(screen.getByTestId('fee-badge')).toHaveTextContent('paid');
  expect(screen.getByTestId('amount')).toHaveTextContent(/150 €/);
});

test('receipt slides the document into the Documents column', () => {
  mount(at('receipt'));
  const col = screen.getByTestId('documents-col');
  const doc = screen.getByTestId('document');
  expect(col).toContainElement(doc);
});
