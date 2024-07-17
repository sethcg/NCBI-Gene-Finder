import { emit } from '@tauri-apps/api/event'
import { XMLParser } from 'fast-xml-parser'
import { pRateLimit } from 'p-ratelimit'

// RATE LIMIT THREE PER SECOND, WITH A VALID API KEY IT CAN BE 10 PER SECOND
const limit = pRateLimit({ interval: 1200, rate: 3, concurrency: 3 })
const api_limit = pRateLimit({ interval: 1200, rate: 10, concurrency: 10 })

const postURL: string = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/epost.fcgi'
const linkURL: string = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi'
const summaryURL: string = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'

// #region ePost

export async function ePost(
  signal: AbortSignal,
  database: string,
  ids: string[],
  apiKey?: string,
  rettype?: string,
  links?: link[]
): Promise<postResponse> {
  return new Promise<postResponse>(async (resolve, reject) => {
    if (apiKey) {
      api_limit((): Promise<postResponse> => _ePost(signal, database, ids, apiKey, rettype, links))
        .then((postResponse) => {
          resolve(postResponse)
        })
        .catch(() => {
          handleError()
          reject()
        })
    } else {
      limit((): Promise<postResponse> => _ePost(signal, database, ids, undefined, rettype, links))
        .then((postResponse) => {
          resolve(postResponse)
        })
        .catch(() => {
          handleError()
          reject()
        })
    }
  })
}

async function _ePost(
  signal: AbortSignal,
  database: string,
  ids: string[],
  apiKey?: string,
  rettype?: string,
  links?: link[]
): Promise<postResponse> {
  const id = ids.filter((id) => id).join(',')
  const form = new FormData()
  form.append('db', database)
  form.append('id', id)

  if (rettype) form.append('rettype', rettype)
  if (apiKey) form.append('api_key', apiKey)

  const response: any = await fetch(postURL, {
    method: 'POST',
    signal,
    body: form
  })
  const responseText = await response.text()

  const parser = new XMLParser()
  const json = parser.parse(responseText)

  return {
    webEnv: json.ePostResult?.WebEnv,
    queryKey: json.ePostResult?.QueryKey,
    links: links,
    error: json.ePostResult?.ERROR
  }
}
// #endregion

//#region eLink

export async function eLink(
  signal: AbortSignal,
  databaseFrom: string,
  databaseTo: string,
  ids: string[],
  apiKey?: string
): Promise<link[]> {
  return new Promise<link[]>(async (resolve, reject) => {
    if (apiKey) {
      api_limit((): Promise<link[]> => _eLink(signal, databaseFrom, databaseTo, ids, apiKey))
        .then((links) => {
          resolve(links)
        })
        .catch(() => {
          reject(handleError())
        })
    } else {
      limit((): Promise<link[]> => _eLink(signal, databaseFrom, databaseTo, ids, undefined))
        .then((links) => {
          resolve(links)
        })
        .catch(() => {
          reject(handleError())
        })
    }
  })
}

async function _eLink(
  signal: AbortSignal,
  databaseFrom: string,
  databaseTo: string,
  ids: string[],
  apiKey?: string
): Promise<link[]> {
  const form = new FormData()
  form.append('dbfrom', databaseFrom)
  form.append('db', databaseTo)
  form.append('retmax', `${ids.length}`)
  form.append('linkname', 'protein_gene')
  form.append('retmode', 'json')
  ids.forEach((id) => {
    form.append('id', id)
  })

  if (apiKey) form.append('api_key', apiKey)

  const response: any = await fetch(linkURL, {
    method: 'POST',
    signal,
    body: form
  })
  const responseJson = await response.json()

  let links: link[] = []
  responseJson.linksets.forEach((value: any) => {
    if (value.linksetdbs) {
      let proteinId = value.ids[0]
      let geneId = value.linksetdbs[0].links[0]
      links.push({
        proteinId: Number.parseInt(proteinId),
        geneId: Number.parseInt(geneId)
      })
    }
  })
  return links
}
//#endregion

//#region eSummary

export async function eSummary(
  signal: AbortSignal,
  database: string,
  webEnv: string,
  queryKey: string,
  apiKey?: string,
  count?: number,
  links?: link[]
): Promise<summaryResponse> {
  return new Promise<summaryResponse>(async (resolve, reject) => {
    if (apiKey) {
      api_limit(
        (): Promise<summaryResponse> =>
          _eSummary(signal, database, webEnv, queryKey, apiKey, count, links)
      )
        .then((summaryResponse) => {
          resolve(summaryResponse)
        })
        .catch(() => {
          reject(handleError())
        })
    } else {
      limit(
        (): Promise<summaryResponse> =>
          _eSummary(signal, database, webEnv, queryKey, undefined, count, links)
      )
        .then((summaryResponse) => {
          resolve(summaryResponse)
        })
        .catch(() => {
          reject(handleError())
        })
    }
  })
}

async function _eSummary(
  signal: AbortSignal,
  database: string,
  webEnv: string,
  queryKey: string,
  apiKey?: string,
  count?: number,
  links?: link[]
): Promise<summaryResponse> {
  const form = new FormData()
  form.append('db', database)
  form.append('webenv', webEnv)
  form.append('query_key', queryKey)
  form.append('retmode', 'json')

  if (apiKey) form.append('api_key', apiKey)
  if (count) form.append('retmax', `${count}`)

  const response: any = await fetch(summaryURL, {
    method: 'POST',
    signal,
    body: form
  })
  const responseJson = await response.json()

  let results = responseJson.result

  if (database == 'protein') {
    let uids = responseJson.result.uids
    let values: protein[] = []
    uids.forEach((uid: any) => {
      let value = results[uid]
      let status: string | undefined = undefined
      let replacedBy: string | undefined = undefined
      if (value.status) {
        switch (value.status) {
          case 'replaced':
            status = '[REPLACED]'
            replacedBy = value.replacedby
            break
          case 'suppressed':
            status = '[SUPPRESSED]'
            break
          case 'dead':
            status = '[REMOVED]'
            break
          default:
            status = undefined
            break
        }
      }
      values.push({
        id: Number.parseInt(value.uid),
        accessionVersion: value.accessionversion,
        description: value.title.replace(/\[.*\]/, '').trim(),
        status: status,
        replacedby: replacedBy
      })
    })
    return { results: values }
  }

  if (database == 'gene') {
    let uids = responseJson.result.uids
    let values: gene[] = []
    uids.forEach((uid: any) => {
      let value = results[uid]
      values.push({
        id: Number.parseInt(value.uid),
        symbol: value.nomenclaturesymbol,
        description: value.nomenclaturename,
        organism: `[${value.organism.scientificname}]`
      })
    })
    return {
      results: values,
      links: links
    }
  }

  return { results: [] }
}
//#endregion

export async function validateAPIKey(key: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve) => {
    limit((): Promise<void> => _validateAPIKey(key))
      .then(() => {
        resolve(true)
      })
      .catch(() => {
        // IF ANY ERROR THE API KEY IS NOT VALID
        resolve(false)
      })
  })
}

export async function _validateAPIKey(key: string): Promise<void> {
  const form = new FormData()
  form.append('api_key', key)
  form.append('id', '-1')
  form.append('retmode', 'text')

  // RUN A QUICK POST TO CHECK IF THE API KEY IS VALID
  await fetch(postURL, { method: 'POST', body: form })
}

export async function handleError(msg?: string): Promise<void> {
  let event: processEvent = {
    type: 'error',
    message: 'Error while processing the spreadsheet.',
    percentage: 0
  }
  if (msg) event.message = msg
  await emit('process_event', event)
}
