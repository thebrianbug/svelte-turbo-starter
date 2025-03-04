// Re-export Svelte dependencies for consistent usage across packages
export { default as svelteVite } from '@sveltejs/vite-plugin-svelte';
export { default as svelteCheck } from 'svelte-check';
export * from '@testing-library/svelte';
export * from '@testing-library/user-event';

// Export common Svelte configurations
export const svelteConfig = {
  compilerOptions: {
    runes: true // Enable Svelte 5 runes
  }
};
