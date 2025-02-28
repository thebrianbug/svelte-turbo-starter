import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import MyCounterButton from './MyCounterButton.svelte';

test('MyCounterButton', async () => {
  const user = userEvent.setup();
  render(MyCounterButton);

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
