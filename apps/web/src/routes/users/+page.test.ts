import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import UsersPage from './+page.svelte';

test('Users page', () => {
  render(UsersPage);

  const heading = screen.getByRole('heading', { name: 'Users' });
  expect(heading).toBeTruthy();
});
