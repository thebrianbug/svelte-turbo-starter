import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, describe, vi } from 'vitest';

import MyCounterButton from './my-counter-button.svelte';

describe('MyCounterButton', () => {
  test('renders with default styling and handles clicks', async () => {
    const user = userEvent.setup();
    render(MyCounterButton);

    const button = screen.getByRole('button');

    // Check initial state
    expect(button).toHaveTextContent('clicks: 0');
    expect(button).toHaveClass('px-5 py-3 text-sm'); // medium size
    expect(button).toHaveClass('text-gray-700'); // default text color
    expect(button).toHaveClass('bg-transparent'); // default background

    // Test click behavior
    await user.click(button);
    expect(button).toHaveTextContent('clicks: 1');
  });

  test('supports customization through props', () => {
    const props = {
      primary: true,
      size: 'small' as const,
      label: 'Count: {count}',
      backgroundColor: '#000000'
    };

    render(MyCounterButton, { props });
    const button = screen.getByRole('button');

    expect(button).toHaveTextContent('Count: 0');
    expect(button).toHaveClass('px-4 py-2.5 text-xs'); // small size
    expect(button).toHaveClass('bg-blue-500'); // primary style
    expect(button).toHaveClass('text-white'); // text contrast for dark background
    expect(button).toHaveStyle({ backgroundColor: '#000000' });
  });

  test('handles external click events while maintaining internal state', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(MyCounterButton, { props: { onClick } });
    const button = screen.getByRole('button');

    await user.click(button);

    expect(onClick).toHaveBeenCalled();
    expect(button).toHaveTextContent('clicks: 1');
  });
});
