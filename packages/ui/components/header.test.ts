import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Header from './header.svelte';

const ACTIVE_CLASS = 'active';
const HIGHLIGHT_CLASS = 'text-blue-400';

test('Header navigation links', () => {
  render(Header);

  // Check home link
  const homeLink = screen.getByRole('link', { name: 'Home' });
  expect(homeLink).toHaveAttribute('href', '/');
  expect(homeLink).toHaveClass(ACTIVE_CLASS);
  expect(homeLink).toHaveClass(HIGHLIGHT_CLASS);

  // Check users link
  const usersLink = screen.getByRole('link', { name: 'Users' });
  expect(usersLink).toHaveAttribute('href', '/users');
  expect(usersLink).not.toHaveClass(ACTIVE_CLASS);
  expect(usersLink).not.toHaveClass(HIGHLIGHT_CLASS);
});

test('Header active states', () => {
  // Test users page active state
  render(Header, { props: { currentPath: '/users' } });

  const homeLink = screen.getByRole('link', { name: 'Home' });
  expect(homeLink).not.toHaveClass(ACTIVE_CLASS);
  expect(homeLink).not.toHaveClass(HIGHLIGHT_CLASS);

  const usersLink = screen.getByRole('link', { name: 'Users' });
  expect(usersLink).toHaveClass(ACTIVE_CLASS);
  expect(usersLink).toHaveClass(HIGHLIGHT_CLASS);
});
