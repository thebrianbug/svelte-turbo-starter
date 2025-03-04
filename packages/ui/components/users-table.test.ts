import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import UsersTable from './users-table.svelte';

type User = {
  id: number;
  name: string;
  email: string;
};

describe('UsersTable', () => {
  const mockUsers: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  it('renders users in a table format', () => {
    const { getByText } = render(UsersTable, { props: { users: mockUsers } });

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const mockDelete = vi.fn();
    const { getAllByRole } = render(UsersTable, {
      props: {
        users: mockUsers,
        onDelete: mockDelete
      }
    });

    const deleteButtons = getAllByRole('button');
    await fireEvent.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it('shows "No users found" when users array is empty', () => {
    const { getByText } = render(UsersTable, { props: { users: [] } });

    expect(getByText('No users found')).toBeTruthy();
  });
});
