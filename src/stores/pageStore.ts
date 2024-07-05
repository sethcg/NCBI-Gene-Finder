import { type Readable, writable } from 'svelte/store'

const initialState: PageState = { route: 'EXCEL' }

function createPageStore(): PageStore {
  const { subscribe, update } = writable<PageState>(initialState)

  return {
    subscribe,
    setPage: (route: string) => update((state) => ({ ...state, route }))
  }
}

export type PageState = { route: string }

export type PageStore = Readable<PageState> & {
  setPage: (route: string) => void
}

export const pageStore = createPageStore()
