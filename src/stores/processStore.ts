import { writable } from 'svelte/store'

export type processingData = {
  processing: boolean
  processComplete: boolean
  downloading: boolean
  apiKey: string | undefined
}

const initialProcessingData: processingData = {
  processing: false,
  processComplete: false,
  downloading: false,
  apiKey: undefined
}

export const processData = writable<processingData>(initialProcessingData)
