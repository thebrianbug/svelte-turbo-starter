import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import MyCounterButton from './MyCounterButton.svelte';

test('MyCounterButton', async () => {
  const user = userEvent.setup();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(MyCounterButton as any); // Type assertion needed for Svelte component

  // Get button by its role
  const button = screen.getByRole('button');
  
  // Check initial state
  expect(button).toHaveTextContent('clicks: 0');

  // Click the button
  await user.click(button);
  expect(button).toHaveTextContent('clicks: 1');

  // Click again to ensure counter keeps incrementing
  await user.click(button);
  expect(button).toHaveTextContent('clicks: 2');
});
