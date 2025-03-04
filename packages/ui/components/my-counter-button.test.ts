import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, describe, vi } from 'vitest';

import MyCounterButton from './my-counter-button.svelte';

const TEST_CONSTANTS = {
  CLICK_TEXT: 'clicks: ',
  CUSTOM_LABEL: 'Count: {count}',
  CUSTOM_COLOR: '#ff0000',
  CLASS_NAMES: {
    MEDIUM: 'px-5 py-3 text-sm',
    SMALL: 'px-4 py-2.5 text-xs',
    LARGE: 'px-6 py-3 text-base',
    PRIMARY: 'bg-blue-500 text-white hover:bg-blue-600',
    SECONDARY:
      'bg-transparent text-gray-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]'
  }
} as const;

describe('MyCounterButton', () => {
  test('renders with default props', async () => {
    const user = userEvent.setup();
    render(MyCounterButton);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(`${TEST_CONSTANTS.CLICK_TEXT}0`);
    expect(button).toHaveClass(...TEST_CONSTANTS.CLASS_NAMES.MEDIUM.split(' '));
    expect(button).toHaveClass(...TEST_CONSTANTS.CLASS_NAMES.SECONDARY.split(' '));

    await user.click(button);
    expect(button).toHaveTextContent(`${TEST_CONSTANTS.CLICK_TEXT}1`);

    await user.click(button);
    expect(button).toHaveTextContent(`${TEST_CONSTANTS.CLICK_TEXT}2`);
  });

  test('accepts custom label and updates count', async () => {
    const user = userEvent.setup();
    render(MyCounterButton, {
      props: { label: TEST_CONSTANTS.CUSTOM_LABEL }
    });

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Count: 0');

    await user.click(button);
    expect(button).toHaveTextContent('Count: 1');
  });

  test('applies size classes correctly', () => {
    render(MyCounterButton, {
      props: { size: 'small' }
    });
    let button = screen.getByRole('button');
    expect(button).toHaveClass(...TEST_CONSTANTS.CLASS_NAMES.SMALL.split(' '));

    render(MyCounterButton, {
      props: { size: 'large' }
    });
    button = screen.getByRole('button');
    expect(button).toHaveClass(...TEST_CONSTANTS.CLASS_NAMES.LARGE.split(' '));
  });

  test('applies primary/secondary styles', () => {
    render(MyCounterButton, {
      props: { primary: true }
    });
    let button = screen.getByRole('button');
    expect(button).toHaveClass(...TEST_CONSTANTS.CLASS_NAMES.PRIMARY.split(' '));

    render(MyCounterButton, {
      props: { primary: false }
    });
    button = screen.getByRole('button');
    expect(button).toHaveClass(...TEST_CONSTANTS.CLASS_NAMES.SECONDARY.split(' '));
  });

  test('applies custom background color', () => {
    render(MyCounterButton, {
      props: { backgroundColor: TEST_CONSTANTS.CUSTOM_COLOR }
    });
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ backgroundColor: TEST_CONSTANTS.CUSTOM_COLOR });
  });

  test('calls external onClick handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(MyCounterButton, {
      props: { onClick }
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).toHaveBeenCalled();
    expect(button).toHaveTextContent(`${TEST_CONSTANTS.CLICK_TEXT}1`);
  });
});
