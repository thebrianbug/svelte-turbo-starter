<script lang="ts">
  interface Props {
    /** Is this the principal call to action on the page? */
    primary?: boolean;
    /** What background color to use */
    backgroundColor?: string;
    /** How large should the button be? */
    size?: 'small' | 'medium' | 'large';
    /** Button label template. Use {count} to display the current count */
    label?: string;
    /** Optional click handler */
    onClick?: () => void;
  }

  const {
    primary = false,
    backgroundColor,
    size = 'medium',
    label = 'clicks: {count}',
    onClick
  }: Props = $props();

  let count = $state(0);

  function handleClick(): void {
    count += 1;
    onClick?.();
  }

  const sizeClasses = $derived(() => {
    switch (size) {
      case 'small':
        return 'px-4 py-2.5 text-xs';
      case 'large':
        return 'px-6 py-3 text-base';
      default:
        return 'px-5 py-3 text-sm';
    }
  });

  const variantClasses = $derived(() =>
    primary
      ? 'bg-blue-500 text-white hover:bg-blue-600'
      : 'bg-transparent text-gray-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]'
  );

  const buttonClasses = $derived(
    [
      'font-sans font-bold rounded-full cursor-pointer inline-block leading-none transition-all duration-200',
      sizeClasses,
      variantClasses
    ].join(' ')
  );

  const displayLabel = $derived(label.replace('{count}', count.toString()));
</script>

<button
  type="button"
  class={buttonClasses}
  style:background-color={backgroundColor}
  onclick={handleClick}
>
  {displayLabel}
</button>
