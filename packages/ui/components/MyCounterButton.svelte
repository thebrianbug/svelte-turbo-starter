<script lang="ts">
  let count = $state(0);

  function handleClick() {
    count += 1;
  }
</script>

<button
  onclick={handleClick}
  class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
>
  clicks: {count}
</button>
