import FitParser from 'fit-file-parser'
import { Buffer } from 'buffer'
import { FitFileData } from './types'

export const parseFitFile = async (fileData: FitFileData): Promise<FitFileData> => {
  return new Promise((resolve) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'both'
    })

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const buffer = Buffer.from(arrayBuffer)
        
        fitParser.parse(buffer, (error: any, data: any) => {
          if (error) {
            resolve({
              ...fileData,
              status: 'error',
              error: error.message || 'Failed to parse FIT file'
            })
          } else {
            const metadata = extractMetadata(data)
            resolve({
              ...fileData,
              status: 'parsed',
              parsed: data,
              metadata
            })
          }
        })
      } catch (error) {
        resolve({
          ...fileData,
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to read file'
        })
      }
    }

    reader.onerror = () => {
      resolve({
        ...fileData,
        status: 'error',
        error: 'Failed to read file'
      })
    }

    reader.readAsArrayBuffer(fileData.file)
  })
}

const extractMetadata = (data: any) => {
  const metadata: FitFileData['metadata'] = {}

  if (data.activity) {
    metadata.activityType = data.activity.event || 'Unknown'
  }

  if (data.sessions && data.sessions.length > 0) {
    const session = data.sessions[0]
    metadata.duration = session.total_elapsed_time
    metadata.distance = session.total_distance
    metadata.sport = session.sport
    if (session.start_time) {
      metadata.startTime = new Date(session.start_time)
    }
  }

  if (data.records && data.records.length > 0) {
    const firstRecord = data.records[0]
    if (firstRecord.timestamp && !metadata.startTime) {
      metadata.startTime = new Date(firstRecord.timestamp)
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

export const formatDistance = (meters?: number): string => {
  if (!meters) return 'N/A'
  const km = meters / 1000
  return `${km.toFixed(2)} km`
}

export const formatDate = (date?: Date): string => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
