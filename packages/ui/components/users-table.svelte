<!-- Using Svelte 5 syntax -->
<script lang="ts">
  type User = {
    id: number;
    name: string;
    email: string;
  };

  type OnDeleteFn = (id: number) => void;
  let { users = [], onDelete = (() => {}) as OnDeleteFn } = $props<{
    users: User[];
    onDelete?: OnDeleteFn;
  }>();
</script>

<div class="overflow-x-auto">
  {#if users.length === 0}
    <p class="text-center py-4 text-gray-500">No users found</p>
  {:else}
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Name</th
          >
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Email</th
          >
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Actions</th
          >
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each users as user (user.id)}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              >{user.name}</td
            >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button class="text-red-600 hover:text-red-900" onclick={() => onDelete(user.id)}>
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
