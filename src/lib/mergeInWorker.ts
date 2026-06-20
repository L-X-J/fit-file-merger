import { mergeFitFiles } from './fitParser'
import type { FitFileData, MergeOptions } from './types'

type MergeWorkerResponse =
  | { type: 'success'; blob: Blob }
  | { type: 'error'; message: string }

const createMergeWorker = () =>
  new Worker(new URL('./fitMerge.worker.ts', import.meta.url), { type: 'module' })

export const mergeFitFilesInWorker = (
  files: FitFileData[],
  options: MergeOptions
): Promise<Blob> => {
  if (typeof Worker === 'undefined') {
    return mergeFitFiles(files, options)
  }

  let worker: Worker

  try {
    worker = createMergeWorker()
  } catch (error) {
    console.warn('Web Worker unavailable, merging on the main thread.', error)
    return mergeFitFiles(files, options)
  }

  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<MergeWorkerResponse>) => {
      worker.terminate()

      if (event.data.type === 'success') {
        resolve(event.data.blob)
        return
      }

      reject(new Error(event.data.message))
    }

    worker.onerror = (event) => {
      worker.terminate()
      console.warn('FIT merge worker failed, retrying on the main thread.', event.message)
      void mergeFitFiles(files, options).then(resolve, reject)
    }

    worker.postMessage({ files, options })
  })
}
