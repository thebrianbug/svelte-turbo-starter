<script lang="ts">
  interface Props {
    /** Button label template. Use {count} to display the current count */
    label?: string;
  }

  const { label = 'clicks: {count}' }: Props = $props();

  let count = $state(0);

  function handleClick(): void {
    count += 1;
  }

  const classes =
    'font-sans font-bold rounded-full cursor-pointer inline-block leading-none transition-all duration-200 px-5 py-3 text-sm bg-blue-500 hover:bg-blue-600 text-white';
  const displayLabel = $derived(label.replace('{count}', count.toString()));
</script>

<button type="button" class={classes} onclick={handleClick}>
  {displayLabel}
</button>
