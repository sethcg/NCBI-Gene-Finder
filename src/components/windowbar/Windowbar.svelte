<script lang="ts">
  import { appWindow } from '@tauri-apps/api/window'
  import { Button } from 'flowbite-svelte'
  import { MinusIcon, SquareIcon, XIcon } from 'svelte-feather-icons'

  const minimize = (): Promise<void> => appWindow.minimize()
  const maximize = (): Promise<void> => appWindow.toggleMaximize()
  const close = (): Promise<void> => appWindow.close()

  const title = 'Gene Finder'
</script>

<div class="w-full items-center bg-background-200 dark:bg-background-100">
  <div class="flex h-[1.7rem] flex-row justify-end rounded-none">
    <!--DRAGGABLE TOP BAR-->
    <div class="grow h-full ml-2">
      <div class="flex flex-row items-center h-full">
        <div
          class="flex-1 text-text-300 dark:text-text-300 text-sm font-semibold"
          style="user-select: none;"
          data-tauri-drag-region
        >
          {title}
        </div>
      </div>
    </div>

    <div class="inline-flex bg-background-200 dark:bg-background-100">
      <Button
        class="px-2 py-2 text-xs outline-none hover:bg-background-300 border-none focus-within:ring-0 focus:ring-0 rounded-none"
        on:click={minimize}
        color={'none'}
      >
        <MinusIcon
          strokeWidth={3}
          class="text-text-100 dark:text-text-300 focus:outline-none"
          size="16"
        />
      </Button>
      <Button
        class="px-2 py-2 text-xs outline-none hover:bg-background-300 border-none focus-within:ring-0 focus:ring-0 rounded-none"
        on:click={maximize}
        color={'none'}
      >
        <SquareIcon
          strokeWidth={3}
          class="text-text-100 dark:text-text-300 focus:outline-none"
          size="14"
        />
      </Button>
      <Button
        class="px-2 py-2 text-xs outline-none border-none focus-within:ring-0 focus:ring-0 window-close-button rounded-none"
        on:click={close}
        color={'none'}
      >
        <XIcon
          strokeWidth={3}
          class="text-text-100 dark:text-text-300 focus:outline-none"
          size="16"
        />
      </Button>
    </div>
  </div>
</div>

<style lang="postcss">
  :global(.window-close-button:hover) {
    background-color: rgba(212, 28, 15, 0.7);
  }
</style>
