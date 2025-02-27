import sharedConfig from '@repo/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  // Extend the shared config
  ...sharedConfig,
  // Override content to only include UI package files
  content: ['./components/**/*.{js,ts,jsx,tsx,svelte}']
};
