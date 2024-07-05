<script lang="ts">
  import { onMount } from 'svelte';
  import { appWindow, LogicalSize } from '@tauri-apps/api/window';
  import { join, appLocalDataDir } from '@tauri-apps/api/path'
  import { Store } from "tauri-plugin-store-api";

  import Layout from './Layout.svelte'
  import Sidebar from './components/sidebar/Sidebar.svelte'
  import WindowBar from './components/windowbar/Windowbar.svelte'

  import { processData } from 'src/stores/processStore'

  onMount(async () => {
    // SET MINIMUM WINDOW SIZE
		await appWindow.setMinSize(new LogicalSize(640, 640));

    // SET THE PERSISTENT API KEY
    const appLocalDataDirPath = await appLocalDataDir();
    const fileName = ".settings.dat";
    const filePath = await join(appLocalDataDirPath, fileName);
    const store = new Store(filePath);
    const data: any = await store.get('api-key-string');
    if(data && data.value) $processData.apiKey = data.value
	});
</script>

<div class="flex flex-col w-screen h-screen">
  <WindowBar />
  <div class="flex w-screen h-screen">
    <div class="flex-0">
      <Sidebar />
    </div>
    <div class="flex flex-1 bg-background-100 dark:bg-background-200 rounded-tl-3xl px-8 py-2" style="min-width: 0; min-height: 0;">
      <Layout />
    </div>
  </div>
</div>
