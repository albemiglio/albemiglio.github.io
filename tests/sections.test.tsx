import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

test('keeps the legacy anchors', () => {
  const { container } = render(<App />);
  for (const id of ['hero', 'about', 'experience', 'portfolio', 'skills', 'contact']) {
    expect(container.querySelector(`#${id}`)).not.toBeNull();
  }
});

test('shows the primary contact and the CV link', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'dev@albemiglio.it' })).toHaveAttribute('href', 'mailto:dev@albemiglio.it');
  expect(screen.getByRole('link', { name: /download the cv/i })).toHaveAttribute('href', '/cv.pdf');
});

test('lists the more-work cards', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /verdica/i })).toHaveAttribute('href', 'https://github.com/verdicahq/verdica');
  expect(screen.getByRole('link', { name: /keyward/i })).toBeInTheDocument();
});
