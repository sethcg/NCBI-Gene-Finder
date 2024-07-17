<script lang="ts">
  import { Popover, Button } from 'flowbite-svelte'
  import { pageStore, type PageState } from 'src/stores/pageStore'
  import { processData } from 'src/stores/processStore'
  export let buttonId: string = ''
  export let popoverText: string = 'test'
  export let divClass: string = ''

  let activeClass = 'p-2 rounded-none border-2 focus-within:ring-0 focus:ring-0 active disabled'
  let nonActiveClass = 'p-2 rounded-none border-2 focus-within:ring-0 focus:ring-0 '

  $: buttonClass =
    buttonId.toUpperCase() == $pageStore.route.toUpperCase() ? activeClass : nonActiveClass
  pageStore.subscribe((value: PageState) => {
    buttonClass = buttonId.toUpperCase() == value.route.toUpperCase() ? activeClass : nonActiveClass
  })
</script>

<div class={divClass}>
  <Button
    id={buttonId}
    on:click
    class={`${buttonClass} sidebar-button`}
    color={'none'}
    disabled={$processData.processing}
  >
    <div class="flex text-base">
      <slot name="icon" />
    </div>
  </Button>
  <Popover
    defaultClass={'px-2.5 py-1'}
    class="text-sm text-text-100 dark:text-text-100"
    triggeredBy={`#${buttonId}`}
    placement={'right'}
    arrow={false}
  >
    {popoverText}
  </Popover>
</div>

<style lang="postcss">
  :global(.sidebar-button) {
    background-color: transparent;
    border-radius: 24px;
    border-color: rgba(
      theme(colors.primary.primary-r),
      theme(colors.primary.primary-g),
      theme(colors.primary.primary-b),
      0.25
    );
    transition:
      background-color 0.35s ease,
      border-radius 0.5s ease,
      border-color 0.35s ease;
  }
  :global(.sidebar-button:hover) {
    background-color: rgba(
      theme(colors.primary.primary-r),
      theme(colors.primary.primary-g),
      theme(colors.primary.primary-b),
      0.6
    );
    border-color: transparent;
    border-radius: 10px;
  }
  :global(.sidebar-button.active) {
    background-color: theme(colors.primary.500);
    border-radius: 10px;
    border-color: theme(colors.primary.500);
  }
</style>
