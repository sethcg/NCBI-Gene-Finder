<script lang="ts">
  import { sineOut } from 'svelte/easing'
  import { tweened } from 'svelte/motion'

  export let progress: number = 0
  export let label: string = ''

  const tweenDuration = 400
  const _progress = tweened(0, {
    duration: tweenDuration,
    easing: sineOut
  })

  $: _progress.set(Number(progress))
</script>

<div class="flex-1">
  <div class="mb-2 text-text-100 text-lg">{label}</div>
  <div class={'w-full bg-gray-200 rounded-full dark:bg-gray-700'}>
    <div class={'bg-success-500 h-4 rounded-full'} style="width: {$_progress}%" />
  </div>
</div>
