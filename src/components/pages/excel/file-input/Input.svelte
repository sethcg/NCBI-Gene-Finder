<script lang="ts">
  // TAURI IMPORTS
  import { invoke } from '@tauri-apps/api'
  import { open } from '@tauri-apps/api/dialog';
  import { sep, downloadDir } from '@tauri-apps/api/path';

  // STORE IMPORTS
  import { fileResponse } from 'src/stores/fileStore'
  import { filePreview } from 'src/stores/tableStore'
  import { processData } from 'src/stores/processStore'

  type FileResponse = {
    name: string
    path: string
  }

  const buttonActive = 'block w-full m-0 border-2 rounded-lg bg-transparent border-transparent hover:border-black hover:bg-black'
  const buttonInactive = 'block w-full m-0 border-2 rounded-lg bg-transparent border-transparent'
  $: buttonClass = $fileResponse.parsing ? buttonInactive : buttonActive
  fileResponse.subscribe(() => buttonClass = $fileResponse.parsing ? buttonInactive : buttonActive)

  const handleClick = async (): Promise<void> => {
    const downloadDirPath = await downloadDir();
    $fileResponse.error = false

    // OPEN FILE SELECTION DIALOG
    const selected = await open({
      directory: false,
      multiple: false,
      defaultPath: downloadDirPath,
      filters: [{
        name: 'File',
        extensions: ['XLSX', 'XLS', 'XLSM'],
      }]
    }) as string;

    // HANDLE SELECTED FILE
    if (selected) {
      $processData.processComplete = false;

      $fileResponse.ready = false
      const filePath = selected
      const fileName = filePath.split(sep).pop();

      $fileResponse.parsing = true
      await invoke('handle_file_input_async', { filepath: filePath, filename: fileName })
        .then((response: any) => {
          const data = response as FileResponse
          $fileResponse.ready = true
          $fileResponse.name = data.name
          $fileResponse.path = data.path // RETURNED TEMP CSV PATH

          // SIGNAL TO SHOW THE SPREADSHEET PREVIEW
          $fileResponse.parsing = false
          $filePreview.handle = { show: true };
          $filePreview.active = true
        })
        .catch((_error) => {
          $fileResponse.name = undefined;
          $fileResponse.error = true;

          $fileResponse.parsing = false;
          $filePreview.handle = { hide: true };
          $filePreview.active = false;
        })
    } else {
      // CANCELLED SELECTION
    }
  }
</script>

<div class="flex-1">
    <button on:click={handleClick} class={buttonClass} type="button" disabled={$fileResponse.parsing}>
    <div class="flex flex-row h-10 justify-start items-center">
      <div class="flex items-center justify-center w-[6.7rem] h-full bg-secondary-500 hover:bg-secondary-600 text-text-200 text-sm rounded-l-md">
        <div class="font-semibold text-text-200">Choose File</div>
      </div>
      <div class="flex flex-1 items-center justify-start h-full bg-secondary-400 rounded-r-md">
        {#if $fileResponse.name}
          <div class="ml-4 text-sm font-extralight text-text-400">{$fileResponse.name}</div>
        {:else}
          <span class="ml-4 text-sm font-extralight text-text-400">No file chosen</span>
        {/if}
      </div>
    </div>
  </button>
</div>
