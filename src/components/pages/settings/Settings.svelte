<script lang="ts">
  import APIKeyInput from './APIKeyInput.svelte'
</script>

<!-- <div class="flex h-full justify-center items-center">SETTINGS PAGE</div> -->

<div class="flex flex-col w-full gap-12">
  <!-- TITLE -->
  <span class="text-text-100 font-extrabold text-3xl place-self-start mt-2">Settings</span>

  <!-- SETTING INPUTS -->
  <div class="flex-1 w-full max-w-[720px]">
    <APIKeyInput />
  </div>
</div>
