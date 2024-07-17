import { emit } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api'
import { writeBinaryFile, BaseDirectory } from '@tauri-apps/api/fs'
import { ePost, eLink, eSummary } from './ncbi-helper'
import * as XLSX from 'xlsx'
import crypto from 'crypto-js'

const cryptoKey: string = import.meta.env.CRYPTO_KEY
const BATCH_SIZE = 500

let progressTotal: number = 0
let progressCurrent: number = 0
let batchNumTotal_Protein: number = 0
let batchNumCurrent_Protein: number = 0
let batchNumTotal_Gene: number = 0
let batchNumCurrent_Gene: number = 0

export async function process(
  accessionVersionColumnIndex: number,
  encrypted_apiKey: string | undefined,
  signal: AbortSignal
): Promise<void> {
  const startTime = performance.now()

  // GET API KEY FROM STORED DATA (IF ANY)
  let apiKey = undefined
  if (encrypted_apiKey)
    apiKey = crypto.DES.decrypt(encrypted_apiKey, cryptoKey).toString(crypto.enc.Utf8)

  const accessionVersions: string[] = await getAccessionVersions(accessionVersionColumnIndex)
  let rows: row[] = accessionVersions.map((accessionVersion, index) => {
    return { index, accessionVersion }
  })

  // VALIDATE ACCESSION VERSIONS
  if (!(await validateRows(rows))) return undefined

  // RESET INITIAL PROGRESS VALUES
  batchNumTotal_Protein = Math.ceil(rows.length / BATCH_SIZE)
  batchNumTotal_Gene = Math.ceil(rows.length / BATCH_SIZE)
  batchNumCurrent_Protein = 0
  batchNumCurrent_Gene = 0
  progressTotal = rows.length * 6
  progressCurrent = 0

  return new Promise<void>(async () => {
    // EXECUTE THE PROCESSING
    await processProteinData(rows, signal, apiKey).then(async (values: row[]) => {
      await processReplacedProteinData(values, signal, apiKey).then(async (values: row[]) => {
        await processGeneData(values, signal, apiKey).then(async () => {
          // WRITE THE OUTPUT TO A CSV FILE IN APPDATA LOCAL
          await writeRowsToOutput(values).then(async () => {
            console.log(`TIME TO COMPLETE: ${(performance.now() - startTime) / 1000} seconds`)

            // SEND FINISHED EVENT
            let event: processEvent = {
              type: 'done',
              message: 'Complete',
              percentage: 100,
              label: 'Processing Complete.'
            }
            await emit('process_event', event)
          })
        })
      })
    })
  })
}

async function writeRowsToOutput(rows: row[]) {
  let orderedRows: row[] = rows.sort((a, b) => a.index - b.index)
  let content: string = ''
  content +=
    [
      'Accession Version',
      'Description',
      'Entrez Gene ID',
      'Gene Symbol',
      'Organism',
      'Status',
      'Replaced Accession Version',
      'Replaced Description',
      'Replaced Entrez Gene ID',
      'Replaced Gene Symbol'
    ].join('|') + '\n'
  orderedRows.forEach((row: row) => {
    let rowData: string[] = []
    rowData.push(row.accessionVersion.trim())
    rowData.push(row.protein?.description ? row.protein?.description.trim() : '')
    rowData.push(row.gene?.id ? row.gene?.id.toString().trim() : '')
    rowData.push(row.gene?.symbol ? row.gene?.symbol.trim() : '')
    rowData.push(row.gene?.organism ? row.gene?.organism.trim() : '')
    rowData.push(row.status ? row.status.trim() : '')
    rowData.push(
      row.replaced?.protein?.accessionVersion ? row.replaced?.protein?.accessionVersion.trim() : ''
    )
    rowData.push(
      row.replaced?.protein?.description ? row.replaced?.protein?.description.trim() : ''
    )
    rowData.push(row.replaced?.gene?.id ? row.replaced?.gene?.id.toString().trim() : '')
    rowData.push(row.replaced?.gene?.symbol ? row.replaced?.gene?.symbol.trim() : '')
    content += rowData.join('|') + '\n'
  })

  const inputData: Uint8Array = new TextEncoder().encode(content)
  let workbook: XLSX.WorkBook = XLSX.read(inputData, { type: 'array', FS: '|', cellStyles: true })
  let worksheet: XLSX.WorkSheet = workbook.Sheets[workbook.SheetNames[0]]

  // SET THE COLUMN WIDTH
  worksheet['!cols'] = []
  for (let i = 0; i < 10; i++) {
    const r: any = {}
    ;(worksheet['!cols'][i] = r).wpx = 100
  }

  // DOWNLOAD THE FILE TO THE DOWNLOADS FOLDER
  const outputData: Uint8Array = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
    cellStyles: true
  })
  await writeBinaryFile('output.xlsx', outputData, { dir: BaseDirectory.AppLocalData })
}

async function getAccessionVersions(columnIndex: number): Promise<string[]> {
  return new Promise(async (resolve) => {
    await invoke('get_accession_versions_async', { accessionIndex: `${columnIndex}` })
      .then((response: any) => {
        let accessions = response.split('\n').filter((x: string) => x != '')
        // RESPONSE ALWAYS INCLUDES HEADER, SHIFT() REMOVES THE HEADER AT THE FIRST INDEX
        accessions.shift()
        resolve(accessions)
      })
      .catch(async () => {
        await emit('processing_error', { msg: 'Error getting column data.' })
      })
  })
}

async function validateRows(rows: row[]): Promise<boolean> {
  return new Promise<boolean>(async (resolve, reject) => {
    rows.some((row) => {
      if (row.accessionVersion.match(/^[N|X|Y|][P|M|R|C|G|W|T]_/g)) {
        resolve(true)
      }
    })
    reject()
  }).catch(async () => {
    // EMIT VALIDATION ERROR EVENT
    let event: processEvent = {
      type: 'error',
      message: 'The provided row contains no accession versions.',
      percentage: 0,
      label: 'No accession versions found in selected row.'
    }
    await emit('process_event', event)
  }) as Promise<boolean>
}

function partitionRows(rows: row[], batchSize: number): row[][] {
  let batches: row[][] = []
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize))
  }
  return batches
}

async function setProgress(addedProgress: number, progressLabel?: string): Promise<void> {
  progressCurrent += addedProgress
  let percentage = Math.round(100 * ((progressCurrent / progressTotal) * 100)) / 100
  let event: processEvent = {
    type: 'progress',
    message: '',
    percentage: percentage,
    label: progressLabel
  }
  await emit('process_event', event)
}

//#region PROTEIN DATA

async function getProteinData(rows: row[], signal: AbortSignal, apiKey?: string): Promise<row[]> {
  return new Promise<row[]>(async (resolve) => {
    await ePost(
      signal,
      'protein',
      rows.map((row: row) => row.accessionVersion),
      apiKey,
      'acc'
    ).then(async (postResponse) => {
      // PROTEIN DATA POST COMPLETE: SET PROGRESS
      await setProgress(rows.length)

      await eSummary(
        signal,
        'protein',
        postResponse.webEnv,
        postResponse.queryKey,
        apiKey,
        rows.length
      ).then(async (summaryResponse) => {
        let proteins: protein[] = summaryResponse.results

        // ADD THE PROTEIN DATA TO THE ROWS
        proteins.forEach((protein: protein) => {
          let row = rows.find((row) => row.accessionVersion == protein.accessionVersion)
          if (row) {
            row.protein = protein
            if (protein.status) row.status = protein.status
            if (protein.replacedby) row.replaced = { accessionVersion: protein.replacedby }
          }
        })

        // PROTEIN DATA SUMMARY COMPLETE (FILTER REPLACED ROWS): SET PROGRESS
        // NOTE: THE PROGRESS IS MULTIPLIED TO ACCOUNT FOR REPLACED PROTEIN POST/SUMMARY CALLS
        await setProgress(rows.filter((row) => !row.replaced).length * 2)
        resolve(rows)
      })
    })
  })
}

async function processProteinData(
  rows: row[],
  signal: AbortSignal,
  apiKey?: string
): Promise<row[]> {
  return new Promise<row[]>(async (resolve) => {
    // SET PROGRESS LABEL: STARTING PROTEIN PROCESSING
    let event: processEvent = { type: 'progress', message: '', label: 'Fetching Protein Data...' }
    await emit('process_event', event)

    // PARTITION ROWS INTO CHUNKS
    const batches: row[][] = partitionRows(rows, BATCH_SIZE)

    const promises = batches.map(
      (rows) =>
        new Promise<void>(async (resolve) => {
          await getProteinData(rows, signal, apiKey).then(async (values: row[]) => {
            values.forEach((value, index) => {
              rows[index] = value
            })

            // SET PROGRESS LABEL: COMPLETED PROTEIN BATCH NUM
            let event: processEvent = {
              type: 'progress',
              message: '',
              label: `Completed Batch: ${++batchNumCurrent_Protein} of ${batchNumTotal_Protein}...`
            }
            await emit('process_event', event)
            resolve() // BREAK OUT OF THE PROMISE
          })
        })
    )
    await Promise.all(promises).then(() => {
      resolve(rows)
    })
  })
}

//#endregion

//#region REPLACED ACCESSION VERSION PROTEIN DATA

async function getReplacedProteinData(
  rows: row[],
  signal: AbortSignal,
  apiKey?: string
): Promise<row[]> {
  return new Promise<row[]>(async (resolve) => {
    // GET THE REPLACEDBY PROTEIN IDS
    let accessionVersions = rows
      .filter((row) => row.replaced)
      .map((row: row) => row.replaced?.accessionVersion) as string[]

    // GET THE REPLACEDBY PROTEIN DATA
    await ePost(signal, 'protein', accessionVersions, apiKey, 'acc').then(async (postResponse) => {
      // PROTEIN DATA FOR REPLACED POST COMPLETE: SET PROGRESS
      await setProgress(rows.filter((row) => row.replaced).length)

      await eSummary(
        signal,
        'protein',
        postResponse.webEnv,
        postResponse.queryKey,
        apiKey,
        rows.length
      ).then(async (summaryResponse) => {
        let proteins: protein[] = summaryResponse.results

        // ADD THE REPLACED PROTEIN DATA TO THE ROWS
        proteins.forEach((protein: protein) => {
          // GET THE ACCESSION WITHOUT VERSION FOR MATCHINE REPLACED PROTEIN VALUES
          let row = rows.find(
            (row) =>
              row.replaced?.accessionVersion.replace(/\..*$/, '') ==
              protein.accessionVersion.replace(/\..*$/, '')
          )
          if (row?.replaced) {
            row.replaced.protein = protein
          }
        })

        // PROTEIN DATA FOR REPLACED COMPLETE: SET PROGRESS
        await setProgress(rows.filter((row) => row.replaced).length)
        resolve(rows)
      })
    })
  })
}

async function processReplacedProteinData(
  rows: row[],
  signal: AbortSignal,
  apiKey?: string
): Promise<row[]> {
  return new Promise<row[]>(async (resolve) => {
    let replacedRows: row[] = rows.filter((row) => row.protein?.replacedby)

    // PARTITION ROWS INTO CHUNKS
    const batches: row[][] = partitionRows(replacedRows, BATCH_SIZE)

    const promises = batches.map(
      (rows) =>
        new Promise<void>(async (resolve) => {
          await getReplacedProteinData(rows, signal, apiKey).then((values: row[]) => {
            values.forEach((value: row) => {
              let rowIndex = rows.findIndex((row) => (row.index = value.index))
              rows[rowIndex] = value
            })
            resolve() // BREAK OUT OF THE PROMISE
          })
        })
    )
    await Promise.all(promises).then(() => {
      resolve(rows)
    })
  })
}

//#endregion

//#region GENE DATA

async function getGeneData(rows: row[], signal: AbortSignal, apiKey?: string): Promise<row[]> {
  return new Promise<row[]>(async (resolve) => {
    // GET THE REPLACED ROW PROTEIN IDS
    let proteinIds: string[] = rows
      .filter((row) => row.replaced)
      .map((row) => row.replaced?.protein?.id.toString()) as string[]

    // GET ALL OTHER PROTEIN IDS
    proteinIds = proteinIds.concat(
      rows.filter((row) => !row.replaced).map((row) => row.protein?.id.toString()) as string[]
    )

    // GET THE PROTEIN TO GENE LINKS
    await eLink(signal, 'protein', 'gene', proteinIds, apiKey).then(async (links: link[]) => {
      // ADD GENE ID TO THE ROWS
      let geneIds = links.map((link) => link.geneId.toString())
      links.forEach((link: link) => {
        let rowObjects = rows.filter((row) => row.protein?.id == link.proteinId)
        let replacedRowObjects = rows.filter((row) => row.replaced?.protein?.id == link.proteinId)

        rowObjects.forEach((row) => {
          row.gene = { id: link.geneId }
        })
        replacedRowObjects.forEach((replacedRow) => {
          if (replacedRow.replaced) {
            replacedRow.replaced.gene = { id: link.geneId }
            if (replacedRow.replaced.protein) {
              replacedRow.replaced.protein.id = link.proteinId
            }
          }
        })
      })

      // GENE DATA LINK COMPLETE: SET PROGRESS
      await setProgress(rows.length)

      // GET GENE DATA FROM LINKED GENE IDS
      await ePost(signal, 'gene', geneIds, apiKey, undefined, links).then(async (postResponse) => {
        // GENE DATA POST COMPLETE: SET PROGRESS
        await setProgress(rows.length)

        await eSummary(
          signal,
          'gene',
          postResponse.webEnv,
          postResponse.queryKey,
          apiKey,
          undefined,
          postResponse.links
        ).then(async (summaryResponse) => {
          // ADD GENE DATA TO THE ROWS
          let genes: gene[] = summaryResponse.results
          links.forEach((link: link) => {
            let gene = genes.find((gene) => gene.id == link.geneId)
            let row = rows.find((row) => row.protein?.id == link.proteinId)
            let replacedRow = rows.find((row) => row.replaced?.protein?.id == link.proteinId)
            if (row) {
              row.gene = gene
            } else if (replacedRow) {
              if (replacedRow.replaced) {
                replacedRow.replaced.gene = gene
              }
            }
          })

          // GENE DATA SUMMARY COMPLETE (ALL DONE PROCESSING): SET PROGRESS
          await setProgress(rows.length)
          resolve(rows)
        })
      })
    })
  })
}

async function processGeneData(rows: row[], signal: AbortSignal, apiKey?: string): Promise<void> {
  return new Promise<void>(async (resolve) => {
    // SET PROGRESS LABEL: STARTING GENE PROCESSING
    let event: processEvent = { type: 'progress', message: '', label: 'Fetching Gene Data...' }
    await emit('process_event', event)

    // PARTITION ROWS INTO CHUNKS
    const batches: row[][] = partitionRows(rows, BATCH_SIZE)

    const promises = batches.map(
      (rows) =>
        new Promise<void>(async (resolve) => {
          await getGeneData(rows, signal, apiKey).then(async (values: row[]) => {
            values.forEach((value, index) => {
              rows[index] = value
            })

            // SET PROGRESS LABEL: COMPLETED GENE BATCH NUM
            let event: processEvent = {
              type: 'progress',
              message: '',
              label: `Completed Batch: ${++batchNumCurrent_Gene} of ${batchNumTotal_Gene}...`
            }
            await emit('process_event', event)
            resolve() // BREAK OUT OF THE PROMISE
          })
        })
    )
    await Promise.all(promises).then(() => {
      resolve()
    })
  })
}

//#endregion
