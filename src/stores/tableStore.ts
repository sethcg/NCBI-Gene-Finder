import { writable } from 'svelte/store'

// FILE PREVIEW
export type FilePreview = {
  handle: { show?: boolean; hide?: boolean }
  columns: string[] | undefined
  rows: any[][] | undefined
  active: boolean
}

const initialFilePreview: FilePreview = {
  handle: {},
  rows: undefined,
  columns: undefined,
  active: false
}

export const filePreview = writable<FilePreview>(initialFilePreview)

// TABLE HEADER DATA
export interface Column {
  index: number
  label: string
  indicatorId: string
}

export type HeaderData = {
  accessionColumn: Column | undefined
}

const initialHeaderData: HeaderData = {
  accessionColumn: undefined
}

export const tableHeaders = writable<HeaderData>(initialHeaderData)
