<script>
  import { Button, Textarea } from 'flowbite-svelte'
</script>

<div class="flex flex-col justify-center items-center">
  <!-- TITLE -->
  <div class="text-text-100 font-extrabold text-3xl mt-2">Text</div>
  <div class="w-full justify-center">
    <!-- DRAG AND DROP FILE INPUT -->
    <div class="m-4">
      <Textarea class="h-44" />
    </div>
    <!-- CONTROL BUTTONS -->
    <div class="m-4 mt-8">
      <div class="flex flex-wrap justify-between">
        <Button outline color="green">Process</Button>
        <Button outline color="red">Save</Button>
      </div>
    </div>
  </div>
</div>
