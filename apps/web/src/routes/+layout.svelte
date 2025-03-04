<script lang="ts">
  import { page } from '$app/stores';
  import { Header } from '@repo/ui';
  import '../app.pcss';

  let currentPath = $derived($page.url.pathname);
  let { children } = $props();
</script>

<Header {currentPath} />

<main class="container mx-auto p-4">
  {@render children()}
</main>
