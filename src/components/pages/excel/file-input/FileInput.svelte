<script lang="ts">
  import FileInput from './Input.svelte'
  import FileStatusAlert from './FileStatusAlert.svelte'
</script>

<div class="flex flex-col">
  <div class="flex items-center justify-between">
    <FileInput />
    <FileStatusAlert />
  </div>
</div>
