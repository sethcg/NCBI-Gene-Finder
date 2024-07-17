<script lang="ts">
  import FileInput from './file-input/FileInput.svelte'
  import Table from './table/Table.svelte'
  import Controls from './controls/Controls.svelte'
</script>

<div class="flex flex-col w-full gap-3">
  <!-- TITLE -->
  <span class="text-text-100 font-extrabold text-3xl place-self-center">Excel File</span>

  <!-- FILE INPUT -->
  <div class="w-full place-self-center">
    <FileInput />
  </div>

  <!-- TABLE PREVIEW -->
  <div class="flex-1 w-full">
    <Table />
  </div>

  <!-- CONTROLS -->
  <div class="w-full place-self-end mb-[18px]">
    <Controls />
  </div>
</div>
