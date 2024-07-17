<script lang="ts">
  // TAURI IMPORTS
  import { listen } from '@tauri-apps/api/event'
  import { appWindow } from '@tauri-apps/api/window'
  import { open } from '@tauri-apps/api/dialog'
  import { join, downloadDir } from '@tauri-apps/api/path'
  import { renameFile, copyFile, BaseDirectory } from '@tauri-apps/api/fs'

  // ICON IMPORTS
  import { CpuIcon, DownloadIcon } from 'svelte-feather-icons'

  // COMPONENT IMPORTS
  import { Button } from 'flowbite-svelte'
  import Progressbar from 'src/lib/ProgessBar.svelte'

  // STORE IMPORTS
  import { filePreview, tableHeaders } from 'src/stores/tableStore'
  import { processData } from 'src/stores/processStore'

  // PROCESSING BACKEND IMPORTS
  import { process } from 'src/process/process-excel'

  $: progress = 0
  $: progressLabel = ''

  let abortController: AbortController | undefined

  // HANDLE PROCESSING THE CURRENT UPLOADED SPREADSHEET
  const handleProcessing = async () => {
    if ($tableHeaders.accessionColumn?.index) {
      $processData.processing = true

      // LISTEN FOR PROCESSING EVENTS
      const processingEventListener = await listen<string>('process_event', (event: any) => {
        const processEvent: processEvent = event.payload

        // UPDATE PROGRESS PERCENTAGE
        if (processEvent.percentage) progress = processEvent.percentage as number
        if (processEvent.label) progressLabel = processEvent.label as string

        const eventType = processEvent.type.toLowerCase()
        if (['done', 'error', 'cancel'].includes(eventType)) {
          if (eventType == 'done') {
            $processData.processComplete = true
          }
          if (eventType == 'cancel') {
            progress = processEvent.percentage as number
            progressLabel = 'Processing Canceled.'
          }
          if (['error', 'cancel'].includes(eventType)) {
            $processData.processComplete = false
          }
          $processData.processing = false
          processingEventListener()

          console.log(processEvent.message)
        }
      })

      // BEGIN PROCESSING DATA
      abortController = new AbortController()
      await process(
        $tableHeaders.accessionColumn.index,
        $processData.apiKey,
        abortController.signal
      )
    }
  }

  // HANDLE CANCELLING THE CURRENT PROCESSING
  const handleCancel = async () => {
    let event: processEvent = { type: 'cancel', message: 'Canceled.', percentage: 0, label: '' }
    await appWindow.emit('process_event', event)
    if (abortController) abortController.abort('Processing was canceled.')
  }

  // HANDLE CANCELLING THE CURRENT PROCESSING
  const handleDownload = async () => {
    $processData.downloading = true

    // OPEN FILE SELECTION DIALOG
    const selected = (await open({
      directory: true,
      multiple: false,
      defaultPath: await downloadDir()
    })) as string

    // HANDLE SELECTED FILE
    if (selected) {
      const fileName = 'output.xlsx'
      try {
        // RENAME THE APPLOCAL EXCEL FILE
        await renameFile('output.xlsx', fileName, { dir: BaseDirectory.AppLocalData })

        // JOIN THE PATH WITH PLATFROM SPECIFIC DELIMITER OF SELECTED FOLDER AND THE FILENAME
        const filePath = await join(selected, fileName)

        // COPY THE APPLOCAL EXCEL FILE TO THE DESTINATION
        await copyFile(fileName, filePath, { dir: BaseDirectory.AppLocalData })
      } catch (error) {
        console.log(error)
      }
    }
    $processData.downloading = false
    progressLabel = 'Download Complete.'
  }

  let baseClass = 'h-full file-controls'
  $: divClass = $filePreview.active ? baseClass + ' active' : baseClass
  filePreview.subscribe(() => {
    divClass = $filePreview.active ? baseClass + ' active' : baseClass
  })
</script>

<div class={divClass}>
  <div class={'flex flex-col h-full justify-between gap-6 '}>
    <Progressbar {progress} label={progressLabel} />
    <div class="flex flex-wrap justify-between place-content-end">
      <div class="flex flex-row gap-4 justify-center items-center text-center">
        <Button
          class={'text-text-100 bg-success-500 p-2 rounded-md focus-within:ring-0 focus:ring-0'}
          on:click={handleProcessing}
          disabled={!$tableHeaders.accessionColumn || $processData.processing}
          color={'none'}
        >
          <div class="flex flex-row px-2 gap-2 justify-center items-center text-center">
            <CpuIcon strokeWidth={2.5} size={'18'} />
            <span>Process</span>
          </div>
        </Button>
        <Button
          class={'text-text-100 bg-danger-500 p-2 rounded-md focus-within:ring-0 focus:ring-0'}
          on:click={handleCancel}
          disabled={!$processData.processing}
          color={'none'}
        >
          <div class="flex flex-row px-2 gap-2 justify-center items-center text-center">
            <span>Cancel</span>
          </div>
        </Button>
      </div>

      <Button
        class={'text-text-100 bg-success-500 p-2 rounded-md focus-within:ring-0 focus:ring-0'}
        on:click={handleDownload}
        disabled={!$processData.processComplete ||
          $processData.processing ||
          $processData.downloading}
        color={'none'}
      >
        <div class="flex flex-row px-2 gap-2 justify-center items-center text-center">
          <DownloadIcon strokeWidth={2.5} size={'18'} />
          <span>Download</span>
        </div>
      </Button>
    </div>
  </div>
</div>

<style lang="postcss">
  :global(.file-controls) {
    opacity: 0;
    display: none;
    animation: fadeInOut 1.4s ease-in-out;
  }
  :global(.file-controls.active) {
    opacity: 1;
    display: block;
    animation: fadeInOut 1.4s ease-in-out;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
