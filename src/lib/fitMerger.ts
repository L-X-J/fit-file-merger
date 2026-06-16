import { FitFileData, MergeOptions } from './types'
import { Encoder } from '@garmin/fitsdk'

export const mergeFitFiles = async (files: FitFileData[], options: MergeOptions): Promise<Blob> => {
  const validFiles = files.filter(f => f.status === 'parsed' && f.parsed)
  
  if (validFiles.length === 0) {
    throw new Error('No valid files to merge')
  }

  let mergedRecords: any[] = []
  let mergedLaps: any[] = []
  let totalAscent = 0
  let totalDistance = 0
  let totalElapsedTime = 0
  let totalTimerTime = 0
  let totalCalories = 0
  let firstTimestamp: Date | null = null
  let lastTimestamp: Date | null = null
  
  validFiles.forEach((fileData) => {
    const messages = fileData.parsed.messages
    
    if (messages.recordMesgs) {
      mergedRecords = mergedRecords.concat(messages.recordMesgs)
    }
    
    if (messages.lapMesgs) {
      mergedLaps = mergedLaps.concat(messages.lapMesgs)
    }
    
    if (messages.sessionMesgs && messages.sessionMesgs.length > 0) {
      const session = messages.sessionMesgs[0]
      
      if (session.totalAscent !== undefined && session.totalAscent !== null) {
        totalAscent += session.totalAscent
      }
      
      if (session.totalDistance !== undefined) {
        totalDistance += session.totalDistance
      }
      
      if (session.totalElapsedTime !== undefined) {
        totalElapsedTime += session.totalElapsedTime
      }
      
      if (session.totalTimerTime !== undefined) {
        totalTimerTime += session.totalTimerTime
      }
      
      if (session.totalCalories !== undefined) {
        totalCalories += session.totalCalories
      }
    }
  })

  if (options.sortChronologically && mergedRecords.length > 0) {
    mergedRecords.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.getTime() : 0
      const timeB = b.timestamp ? b.timestamp.getTime() : 0
      return timeA - timeB
    })
    
    if (mergedLaps.length > 0) {
      mergedLaps.sort((a, b) => {
        const timeA = a.startTime ? a.startTime.getTime() : 0
        const timeB = b.startTime ? b.startTime.getTime() : 0
        return timeA - timeB
      })
    }
  }

  if (mergedRecords.length > 0) {
    firstTimestamp = mergedRecords[0].timestamp
    lastTimestamp = mergedRecords[mergedRecords.length - 1].timestamp
  }

  if (options.removeDuplicateTimestamps && mergedRecords.length > 0) {
    const seen = new Set<number>()
    mergedRecords = mergedRecords.filter((record) => {
      if (!record.timestamp) return true
      const time = record.timestamp.getTime()
      if (seen.has(time)) return false
      seen.add(time)
      return true
    })
  }

  const encoder = new Encoder()
  
  const firstFile = validFiles[0].parsed.messages
  
  if (firstFile.fileIdMesgs && firstFile.fileIdMesgs.length > 0) {
    const fileId = { ...firstFile.fileIdMesgs[0] }
    fileId.timeCreated = firstTimestamp || new Date()
    encoder.writeMesg(fileId)
  }

  mergedRecords.forEach(record => {
    encoder.writeMesg(record)
  })

  if (mergedLaps.length > 0) {
    mergedLaps.forEach(lap => {
      encoder.writeMesg(lap)
    })
  } else if (mergedRecords.length > 0) {
    const lapMessage: any = {
      mesgNum: 19,
      timestamp: lastTimestamp,
      startTime: firstTimestamp,
      totalElapsedTime: totalElapsedTime,
      totalTimerTime: totalTimerTime,
      totalDistance: totalDistance,
      totalAscent: totalAscent,
      totalCalories: totalCalories
    }
    encoder.writeMesg(lapMessage)
  }

  const sessionMessage: any = {
    mesgNum: 18,
    timestamp: lastTimestamp,
    startTime: firstTimestamp,
    totalElapsedTime: totalElapsedTime,
    totalTimerTime: totalTimerTime,
    totalDistance: totalDistance,
    totalAscent: totalAscent,
    totalCalories: totalCalories,
    sport: firstFile.sessionMesgs?.[0]?.sport || 'cycling',
    subSport: firstFile.sessionMesgs?.[0]?.subSport
  }
  encoder.writeMesg(sessionMessage)

  const activityMessage: any = {
    mesgNum: 34,
    timestamp: lastTimestamp,
    totalTimerTime: totalTimerTime,
    numSessions: 1,
    type: 'manual',
    event: 'activity',
    eventType: 'stop'
  }
  encoder.writeMesg(activityMessage)

  const fitData = encoder.close()
  return new Blob([fitData.buffer as ArrayBuffer], { type: 'application/octet-stream' })
}

export const downloadFitFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
