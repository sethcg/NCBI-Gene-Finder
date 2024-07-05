type accessionData = {
  proteinIds: string[], 
  accessionsFound: string[],
  accessionsNotFound: string[]
}

type processEvent = {
  type: string,
  message: string,
  percentage?: number,
  label?: string,
}

type protein = {
  id: number,
  accessionVersion: string,
  description: string,
  status?: string,
  replacedby?: string,
}

type gene = {
  id: number,
  symbol?: string,
  description?: string, 
  organism? :string,
}

type postResponse = {
  queryKey: string,
  webEnv: string,
  links?: link[]
  error?: string,
}

type searchResponse = {
  count: number,
  accessionsNotFound: string[],
  queryKey: string,
  webEnv: string,
}

type link = {
  proteinId: number,
  geneId: number
}

type summaryResponse = {
  results: any[],
  links?: link[],
}

type row = {
  index: number,
  accessionVersion: string,
  protein?: protein,
  gene?: gene,
  status?: string,
  replaced?: {
    accessionVersion: string,
    protein?: protein, 
    gene?: gene
  },
  error?: string,
}

type batchResult = {
  rows: row[], 
  accessionsFound: string[],
  accessionsNotFound: string[]
}