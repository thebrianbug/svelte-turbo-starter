<script lang="ts">
  let { currentPath = '/' } = $props();
</script>

<header class="bg-gray-800 text-white p-4">
  <nav class="container mx-auto">
    <ul class="flex gap-4">
      <li>
        <a href="/" class="hover:text-gray-300 {currentPath === '/' ? 'active text-blue-400' : ''}">
          Home
        </a>
      </li>
      <li>
        <a
          href="/users"
          class="hover:text-gray-300 {currentPath === '/users' ? 'active text-blue-400' : ''}"
        >
          Users
        </a>
      </li>
    </ul>
  </nav>
</header>
