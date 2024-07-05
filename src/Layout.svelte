<script lang="ts">
  import { pageStore } from './stores/pageStore'
  import TextPage from './components/pages/text/Text.svelte'
  import ExcelPage from './components/pages/excel/Excel.svelte'
  import SettingsPage from './components/pages/settings/Settings.svelte'

  let comp: any
  pageStore.subscribe((value) => {
    switch (value.route.toUpperCase()) {
      case 'EXCEL':
        comp = ExcelPage
        break
      case 'TEXT':
        comp = TextPage
        break
      case 'SETTINGS':
        comp = SettingsPage
        break
      default:
        comp = ExcelPage
    }
  })
</script>

<svelte:component this={comp} />
