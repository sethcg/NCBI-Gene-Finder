import { writable } from 'svelte/store'

// FILE RESPONSE
export type FileResponse = {
  parsing: boolean
  ready: boolean
  error: boolean
  name: string | undefined
  path: string
}

const initialFileResponse: FileResponse = {
  parsing: false,
  ready: false,
  error: false,
  name: '',
  path: ''
}

export const fileResponse = writable<FileResponse>(initialFileResponse)
