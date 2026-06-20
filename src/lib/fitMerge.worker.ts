import { mergeFitFiles } from './fitMerger'
import type { FitFileData, MergeOptions } from './types'

type MergeWorkerRequest = {
  files: FitFileData[]
  options: MergeOptions
}

type MergeWorkerResponse =
  | { type: 'success'; blob: Blob }
  | { type: 'error'; message: string }

self.onmessage = async (event: MessageEvent<MergeWorkerRequest>) => {
  try {
    const blob = await mergeFitFiles(event.data.files, event.data.options)
    self.postMessage({ type: 'success', blob } satisfies MergeWorkerResponse)
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to merge FIT files',
    } satisfies MergeWorkerResponse)
  }
}
