import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, describe } from 'vitest';

import MyCounterButton from './my-counter-button.svelte';

describe('MyCounterButton', () => {
  test('renders with default label and handles clicks', async () => {
    const user = userEvent.setup();
    render(MyCounterButton);

    const button = screen.getByRole('button');

    // Check initial state
    expect(button).toHaveTextContent('clicks: 0');
    expect(button).toHaveClass('bg-blue-500');
    expect(button).toHaveClass('text-white');

    // Test click behavior
    await user.click(button);
    expect(button).toHaveTextContent('clicks: 1');
  });

  test('supports custom label template', () => {
    render(MyCounterButton, { props: { label: 'Count: {count}' } });
    const button = screen.getByRole('button');

    expect(button).toHaveTextContent('Count: 0');
  });

  test('updates custom label with count', async () => {
    const user = userEvent.setup();
    render(MyCounterButton, { props: { label: 'Total clicks: {count}!' } });
    const button = screen.getByRole('button');

    expect(button).toHaveTextContent('Total clicks: 0!');
    await user.click(button);
    expect(button).toHaveTextContent('Total clicks: 1!');
  });
});
