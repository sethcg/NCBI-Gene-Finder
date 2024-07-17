<script lang="ts">
  import { invoke } from '@tauri-apps/api'

  import ColumnButton from './ColumnButton.svelte'

  import { fileResponse } from 'src/stores/fileStore'
  import { filePreview } from 'src/stores/tableStore'

  let columns: string[]
  let rows: any[][]

  filePreview.subscribe(async () => {
    if ($filePreview.handle.show) {
      // SET HANDLE TO UNDEFINED/FALSE OTHERWISE IT WILL CALL OVER AND OVER
      $filePreview.handle.show = false

      const filepath = $fileResponse.path

      // SPLICE THE ROWS FROM THE TEMP INPUT CSV FILE TO CREATE A TABLE PREVIEW
      await invoke('setup_preview_async', { filepath: filepath, start: '0', len: '25' })
        .then(async () => {
          await invoke('get_rows_async', {})
            .then((response) => {
              const jsonStrings = (response as string).split(/\n/).filter(Boolean)
              let jsonObjects: any[] = []
              jsonStrings.forEach((jsonString) => {
                const jsonObject = JSON.parse(jsonString)
                jsonObjects.push(jsonObject)
              })
              columns = Object.keys(jsonObjects[0])
              rows = jsonObjects.map((row) => Object.keys(row).map((key) => row[key]))
            })
            .catch((error) => {
              console.log(error)
            })
        })
        .catch((error) => {
          console.log(error)
        })
      $filePreview.columns = columns
      $filePreview.rows = rows
    }
    if ($filePreview.handle.hide) {
      // SET HANDLE TO UNDEFINED/FALSE OTHERWISE IT WILL CALL OVER AND OVER
      $filePreview.handle.hide = false

      $filePreview.columns = undefined
      $filePreview.rows = undefined
    }
  })

  let containerClass =
    'relative overflow-auto shadow-md rounded-lg hover:scrollbar--secondary-700 active:scrollbar-thumb-secondary-600 scrollbar scrollbar-thumb-secondary-500 scrollbar-track-secondary-300'
  let heightClass =
    'xs-height:max-h-[280px] sm-height:max-h-[420px] md-height:max-h-[520px] lg-height:max-h-[600px] xl-height:max-h-[700px]'

  let baseClass = 'preview-table'
  $: divClass = $filePreview.active ? baseClass + ' active' : baseClass
  filePreview.subscribe(() => {
    divClass = $filePreview.active ? baseClass + ' active' : baseClass
  })
</script>

{#if $filePreview.columns && $filePreview.rows}
  <div class={divClass}>
    <div class="{heightClass} {containerClass}">
      <table class="w-full text-sm text-left rtl:text-right" style="user-select: none">
        <!-- TABLE HEADER -->
        <thead class="bg-secondary-500">
          <tr>
            {#each $filePreview.columns as column, index}
              <th
                scope="col"
                class="py-1 px-2 text-left text-sm font-semibold text-text-100 max-w-32 min-w-20"
              >
                <ColumnButton label={column} columnIndex={index + 1} buttonId={`column_${index}`} />
              </th>
            {/each}
          </tr>
        </thead>
        <!-- TABLE BODY -->
        <tbody class="divide-y divide-secondary-300 bg-secondary-400">
          {#each $filePreview.rows as row}
            <tr>
              {#each row as cell}
                <td class="py-3 px-3 text-sm font-medium text-text-200 max-w-32 min-w-20 truncate">
                  {cell}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<style lang="postcss">
  :global(.preview-table) {
    opacity: 0;
    display: none;
    animation: fadeInOut 0.7s ease-in-out;
  }
  :global(.preview-table.active) {
    opacity: 1;
    display: block;
    animation: fadeInOut 0.7s ease-in-out;
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
