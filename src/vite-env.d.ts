/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CRYPTO_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
