<script lang="ts">
  import { open } from '@tauri-apps/api/shell'
  import { Store } from 'tauri-plugin-store-api'
  import { join, appLocalDataDir } from '@tauri-apps/api/path'

  import { KeyIcon } from 'svelte-feather-icons'
  import { processData } from 'src/stores/processStore'
  import { validateAPIKey } from 'src/process/ncbi-helper'

  import crypto from 'crypto-js'
  const cryptoKey: string = import.meta.env.CRYPTO_KEY

  const handleSetKey = async (event: any) => {
    const input: string = event?.target?.value

    // CREATE THE STORE TO PUT THE PERSISTENT DATA INTO
    const appLocalDataDirPath = await appLocalDataDir()
    const fileName = '.settings.dat'
    const filePath = await join(appLocalDataDirPath, fileName)
    const store = new Store(filePath)

    // VALIDATE THE API KEY, DISPLAY ALERT FOR INVALID/VALID API KEY
    await validateAPIKey(input).then(async (isValid: boolean) => {
      if (isValid) {
        // STORE THE API KEY ENCRYPTED TO PERSIST ON APP CLOSE
        $processData.apiKey = crypto.DES.encrypt(input, cryptoKey).toString()
        await store.set('api-key-string', { value: $processData.apiKey })
        await store.save()
      }
    })
  }

  const openAPILink = () => {
    open('https://support.nlm.nih.gov/knowledgebase/article/KA-05317/en-us')
  }

  let apiKey = $processData.apiKey
    ? crypto.DES.decrypt($processData.apiKey, cryptoKey).toString(crypto.enc.Utf8)
    : ''
</script>

<div class="flex flex-col">
  <div class="ml-1 mb-1 text-text-300 font-thin text-base">API key</div>
  <div class="flex items-center justify-between">
    <div class="inline-flex rounded-lg shadow-sm w-full">
      <div class="bg-secondary-500 text-base px-3 inline-flex items-center rounded-s-lg">
        <KeyIcon strokeWidth={2.25} class="text-text-300 focus:outline-none" size="18" />
      </div>
      <input
        value={apiKey}
        id={'api-key-input'}
        on:focusout={handleSetKey}
        placeholder={'ABCD123'}
        class={'block focus:outline-none focus:ring-2 focus:ring-black w-full rtl:text-right p-2.5 bg-secondary-400 text-text-100 placeholder-text-400 text-sm rounded-e-lg'}
      />
    </div>
  </div>
  <p id="helper-text-explanation" class="mt-2 ml-1 text-sm text-text-400 select-none">
    For more information on how to optain an API key use this <a
      href={undefined}
      on:click={openAPILink}
      class="font-medium text-blue-600 hover:underline dark:text-blue-500 select-auto">link</a
    >.
  </p>
</div>
