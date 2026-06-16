import { Decoder, Stream } from '@garmin/fitsdk'
import { FitFileData, MergeOptions } from './types'
import { mergeFitFiles as mergeFitFilesLib, downloadFitFile } from './fitMerger'

export const parseFitFile = async (file: File): Promise<{ data: any; metadata: FitFileData['metadata'] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const stream = Stream.fromArrayBuffer(arrayBuffer)
        const decoder = new Decoder(stream)
        
        if (!decoder.isFIT()) {
          reject(new Error('Not a valid FIT file'))
          return
        }

        if (!decoder.checkIntegrity()) {
          reject(new Error('FIT file integrity check failed'))
          return
        }

        const { messages, errors } = decoder.read()
        
        if (errors && errors.length > 0) {
          console.warn('FIT file parsing warnings:', errors)
        }

        const metadata = extractMetadata(messages)
        
        resolve({
          data: { messages, rawBuffer: arrayBuffer },
          metadata
        })
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse FIT file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export const mergeFitFiles = async (files: FitFileData[], options: MergeOptions): Promise<Blob> => {
  return mergeFitFilesLib(files, options)
}

export const downloadMergedFile = async (blob: Blob): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const filename = `merged-activity-${timestamp}.fit`
  downloadFitFile(blob, filename)
  return filename
}

const extractMetadata = (messages: any) => {
  const metadata: FitFileData['metadata'] = {}

  const sessionMsgs = messages.sessionMesgs || []
  const recordMsgs = messages.recordMesgs || []
  const activityMsgs = messages.activityMesgs || []

  if (sessionMsgs.length > 0) {
    const session = sessionMsgs[0]
    
    if (session.totalElapsedTime !== undefined) {
      metadata.duration = session.totalElapsedTime
    }
    
    if (session.totalDistance !== undefined) {
      metadata.distance = session.totalDistance / 1000
    }
    
    if (session.sport !== undefined) {
      metadata.sport = session.sport
    }
    
    if (session.startTime !== undefined) {
      metadata.startTime = new Date(session.startTime.getTime())
    }
    
    if (session.totalAscent !== undefined && session.totalAscent !== null) {
      metadata.totalAscent = session.totalAscent
    }
  }

  if (recordMsgs.length > 0 && !metadata.startTime) {
    const firstRecord = recordMsgs[0]
    if (firstRecord.timestamp !== undefined) {
      metadata.startTime = new Date(firstRecord.timestamp.getTime())
    }
  }

  if (!metadata.distance && recordMsgs.length > 0) {
    const lastRecord = recordMsgs[recordMsgs.length - 1]
    if (lastRecord.distance !== undefined) {
      metadata.distance = lastRecord.distance / 1000
    }
  }

  if (metadata.totalAscent === undefined && recordMsgs.length > 1) {
    let ascent = 0
    for (let i = 1; i < recordMsgs.length; i++) {
      const prevAlt = recordMsgs[i - 1].enhancedAltitude ?? recordMsgs[i - 1].altitude
      const currAlt = recordMsgs[i].enhancedAltitude ?? recordMsgs[i].altitude
      if (prevAlt !== undefined && currAlt !== undefined && prevAlt !== null && currAlt !== null) {
        const diff = currAlt - prevAlt
        if (diff > 0.5) {
          ascent += diff
        }
      }
    }
    if (ascent > 0) {
      metadata.totalAscent = ascent
    }
  }

  return metadata
}

export const formatDuration = (seconds?: number): string => {
  if (!seconds) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  return `${minutes}m ${secs}s`
}

export const formatDistance = (distanceInKm?: number): string => {
  if (!distanceInKm) return 'N/A'
  return `${distanceInKm.toFixed(2)} km`
}

export const formatDate = (date?: Date, lang: string = 'en'): string => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const formatElevation = (metersAscent?: number): string => {
  if (!metersAscent) return 'N/A'
  return `${Math.round(metersAscent)} m`
}
