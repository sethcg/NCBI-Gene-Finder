<script lang="ts">
  import { fileResponse } from 'src/stores/fileStore'
  import { CheckCircleIcon, AlertOctagonIcon } from 'svelte-feather-icons'

  let baseClass = 'ml-2 flex items-center justify-center rounded-md h-10 file-status active'
  $: divClass = $fileResponse.ready ? baseClass + ' active' : baseClass
  fileResponse.subscribe(() => { divClass = $fileResponse.ready ? baseClass + ' active'  : baseClass })
</script>

<div class="flex items-center justify-end font-bold w-[9rem]">
  {#if $fileResponse.ready}
    <div class={`${divClass} bg-success-400`}>
      <div class="flex flex-row items-center justify-center w-full h-full gap-2 px-2">
        <div class="flex items-center justify-center">
          <CheckCircleIcon strokeWidth={2.5} class="text-success-800 focus:outline-none" size="22" />
        </div>
        <div class="flex items-center justify-center">
          <span style="user-select: none;" class="flex-1 text-success-800 font-semibold text-lg">File Ready</span>
        </div>
      </div>
    </div>
  {:else if $fileResponse.error}
    <div class={`${divClass} bg-danger-400`}>
      <div class="flex flex-row items-center justify-center w-full h-full gap-2 px-2">
        <div class="flex items-center justify-center">
          <AlertOctagonIcon strokeWidth={3} class="text-danger-900 focus:outline-none" size="22" />
        </div>
        <div class="flex items-center justify-center">
          <span style="user-select: none;" class="flex-1 text-danger-900 font-semibold text-lg">File Error</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  
  :global(.file-status) {
    opacity: 0;
    display: none; 
    animation: fadeInOut 0.7s ease-in-out; 
  }
  :global(.file-status.active) {
    opacity: 1; 
    display: block;
    animation: fadeInOut 0.7s ease-in-out; 
  }

  @keyframes fadeInOut { 
    0% { 
        opacity: 0;
        display: none; 
    }
    100% { 
        opacity: 1;
        display: block; 
    } 
  }
</style>
