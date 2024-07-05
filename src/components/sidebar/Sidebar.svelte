<script lang="ts">
  import { TypeIcon, FileTextIcon, SettingsIcon } from 'svelte-feather-icons'
  import { pageStore } from 'src/stores/pageStore'
  import CustomSidebarItem from './SidebarItem.svelte'
  import ThemeSwitcher from './ThemeSwitcher.svelte'

  // let textPage = (): void => pageStore.setPage('TEXT')
  let excelPage = (): void => pageStore.setPage('EXCEL')
  let settingsPage = (): void => pageStore.setPage('SETTINGS')
</script>

<div
  class="flex flex-col items-center justify-between w-full h-full bg-background-200 dark:bg-background-100 py-1.5 px-1.5"
>
  <div class="flex flex-col gap-2">
    <CustomSidebarItem buttonId={'EXCEL'} on:click={excelPage} popoverText={'File'}>
      <svelte:fragment slot="icon">
        <FileTextIcon
          strokeWidth={2.5}
          class="text-text-300 dark:text-text-200 focus:outline-none"
        />
      </svelte:fragment>
    </CustomSidebarItem>
    <!-- <CustomSidebarItem buttonId={'TEXT'} on:click={textPage} popoverText={'Text'}>
      <svelte:fragment slot="icon">
        <TypeIcon strokeWidth={2.5} class="text-text-300 dark:text-text-200 focus:outline-none" />
      </svelte:fragment>
    </CustomSidebarItem> -->
    <CustomSidebarItem buttonId={'SETTINGS'} on:click={settingsPage} popoverText={'Settings'}>
      <svelte:fragment slot="icon">
        <SettingsIcon
          strokeWidth={2.5}
          class="text-text-300 dark:text-text-200 focus:outline-none"
        />
      </svelte:fragment>
    </CustomSidebarItem>
  </div>

  <div>
    <ThemeSwitcher />
  </div>
</div>
