import { FitFileData, MergeOptions } from './types'
import { Encoder, Profile } from '@garmin/fitsdk'

const getTime = (value?: Date | number | null) => {
  if (value instanceof Date) return value.getTime()
  return typeof value === 'number' ? value * 1000 : 0
}

const getFileStartTime = (fileData: FitFileData) => {
  const messages = fileData.parsed.messages
  return getTime(messages.sessionMesgs?.[0]?.startTime ?? messages.recordMesgs?.[0]?.timestamp)
}

const cloneMessage = (message: any) => {
  const clone = { ...message }
  delete clone.developerFields
  return clone
}

const getRecordAltitude = (record: any) => record.enhancedAltitude ?? record.altitude

const calculateRecordAscent = (records: any[]) => {
  let ascent = 0

  for (let index = 1; index < records.length; index++) {
    const previousAltitude = getRecordAltitude(records[index - 1])
    const currentAltitude = getRecordAltitude(records[index])

    if (previousAltitude !== undefined && previousAltitude !== null && currentAltitude !== undefined && currentAltitude !== null) {
      const difference = currentAltitude - previousAltitude
      if (difference > 0.5) {
        ascent += difference
      }
    }
  }

  return ascent
}

const getFileDistance = (messages: any, records: any[]) => {
  const sessionDistance = messages.sessionMesgs?.[0]?.totalDistance
  if (sessionDistance !== undefined && sessionDistance !== null) return sessionDistance

  const firstDistance = records.find(record => record.distance !== undefined && record.distance !== null)?.distance ?? 0
  const lastDistance = [...records].reverse().find(record => record.distance !== undefined && record.distance !== null)?.distance
  return lastDistance !== undefined && lastDistance !== null ? Math.max(0, lastDistance - firstDistance) : 0
}

const getLastDistance = (records: any[]) => {
  const lastRecord = [...records].reverse().find(record => record.distance !== undefined && record.distance !== null)
  return lastRecord?.distance ?? 0
}

const addWeightedMetric = (metric: { sum: number; weight: number }, value: any, weight: number) => {
  if (value !== undefined && value !== null && weight > 0) {
    metric.sum += value * weight
    metric.weight += weight
  }
}

const getWeightedAverage = (metric: { sum: number; weight: number }) => (
  metric.weight > 0 ? metric.sum / metric.weight : undefined
)

const addNormalizedPower = (metric: { sum: number; weight: number }, value: any, weight: number) => {
  if (value !== undefined && value !== null && weight > 0) {
    metric.sum += Math.pow(value, 4) * weight
    metric.weight += weight
  }
}

const getNormalizedPower = (metric: { sum: number; weight: number }) => (
  metric.weight > 0 ? Math.pow(metric.sum / metric.weight, 0.25) : undefined
)

const getMetricWeight = (message: any) => message.totalTimerTime || message.totalElapsedTime || 0

const createMergedMessageBase = (messages: any[]) => {
  const base: any = {}

  messages.forEach(message => {
    const clone = cloneMessage(message)
    Object.entries(clone).forEach(([key, value]) => {
      if (base[key] === undefined && value !== undefined && value !== null) {
        base[key] = value
      }
    })
  })

  return base
}

const aggregateNumericFields = (messages: any[], excludedFields: Set<string>) => {
  const summary: any = {}
  const weightedFields = new Map<string, { sum: number; weight: number }>()
  const normalizedPowerFields = new Map<string, { sum: number; weight: number }>()

  messages.forEach(message => {
    const weight = getMetricWeight(message)

    Object.entries(message).forEach(([key, value]) => {
      if (excludedFields.has(key) || typeof value !== 'number' || !Number.isFinite(value)) return

      if (key === 'normalizedPower' || key.endsWith('NormalizedPower')) {
        const metric = normalizedPowerFields.get(key) || { sum: 0, weight: 0 }
        addNormalizedPower(metric, value, weight)
        normalizedPowerFields.set(key, metric)
      } else if (key === 'trainingStressScore' || key.startsWith('total')) {
        summary[key] = (summary[key] || 0) + value
      } else if (key.startsWith('max') || key.startsWith('enhancedMax')) {
        summary[key] = summary[key] === undefined ? value : Math.max(summary[key], value)
      } else if (key.startsWith('min')) {
        summary[key] = summary[key] === undefined ? value : Math.min(summary[key], value)
      } else if (key === 'intensityFactor' || key.startsWith('avg') || key.startsWith('enhancedAvg')) {
        const metric = weightedFields.get(key) || { sum: 0, weight: 0 }
        addWeightedMetric(metric, value, weight)
        weightedFields.set(key, metric)
      }
    })
  })

  weightedFields.forEach((metric, key) => {
    const average = getWeightedAverage(metric)
    if (average !== undefined) summary[key] = average
  })

  normalizedPowerFields.forEach((metric, key) => {
    const normalized = getNormalizedPower(metric)
    if (normalized !== undefined) summary[key] = normalized
  })

  return summary
}

const summaryOverrideFields = new Set([
  'mesgNum',
  'messageIndex',
  'timestamp',
  'startTime',
  'totalElapsedTime',
  'totalTimerTime',
  'totalDistance',
  'totalAscent',
  'totalDescent',
  'totalCalories',
  'totalWork',
  'avgPower',
  'maxPower',
  'normalizedPower',
  'trainingStressScore',
  'intensityFactor',
  'avgSpeed',
  'maxSpeed',
  'enhancedAvgSpeed',
  'enhancedMaxSpeed',
  'avgHeartRate',
  'maxHeartRate',
  'minHeartRate',
  'avgCadence',
  'maxCadence',
  'avgTemperature',
  'firstLapIndex',
  'numLaps',
])

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
  let totalDescent = 0
  let totalWork = 0
  let maxSpeed = 0
  let maxPower = 0
  let maxHeartRate = 0
  let maxCadence = 0
  let minHeartRate: number | undefined
  let powerSum = 0
  let powerSampleCount = 0
  let weightedPowerSum = 0
  let weightedPowerTime = 0
  let trainingStressScore = 0
  const weightedHeartRate = { sum: 0, weight: 0 }
  const weightedCadence = { sum: 0, weight: 0 }
  const weightedSpeed = { sum: 0, weight: 0 }
  const weightedEnhancedSpeed = { sum: 0, weight: 0 }
  const weightedIntensityFactor = { sum: 0, weight: 0 }
  const weightedTemperature = { sum: 0, weight: 0 }
  const weightedNormalizedPower = { sum: 0, weight: 0 }
  const sourceSessionMessages: any[] = []
  const sourceLapMessages: any[] = []
  let firstTimestamp: Date | null = null
  let lastTimestamp: Date | null = null
  
  const filesToMerge = options.sortChronologically
    ? [...validFiles].sort((a, b) => getFileStartTime(a) - getFileStartTime(b))
    : validFiles

  filesToMerge.forEach((fileData) => {
    const messages = fileData.parsed.messages
    const records = messages.recordMesgs || []
    const distanceOffset = totalDistance

    if (messages.sessionMesgs && messages.sessionMesgs.length > 0) {
      sourceSessionMessages.push(messages.sessionMesgs[0])
    }

    if (messages.lapMesgs && messages.lapMesgs.length > 0) {
      sourceLapMessages.push(...messages.lapMesgs)
      const adjustedLaps = messages.lapMesgs.map((lap: any) => {
        const adjustedLap = cloneMessage(lap)
        adjustedLap.mesgNum = Profile.MesgNum.LAP
        return adjustedLap
      })
      mergedLaps = mergedLaps.concat(adjustedLaps)
    }
    
    if (records.length > 0) {
      const firstRecordDistance = records.find((record: any) => record.distance !== undefined && record.distance !== null)?.distance ?? 0

      const adjustedRecords = records.map((record: any) => {
        const adjustedRecord = cloneMessage(record)
        adjustedRecord.mesgNum = Profile.MesgNum.RECORD

        if (adjustedRecord.distance !== undefined && adjustedRecord.distance !== null) {
          adjustedRecord.distance = distanceOffset + Math.max(0, adjustedRecord.distance - firstRecordDistance)
        }

        return adjustedRecord
      })

      mergedRecords = mergedRecords.concat(adjustedRecords)

      adjustedRecords.forEach((record: any) => {
        if (record.power !== undefined && record.power !== null && record.power > 0) {
          powerSum += record.power
          powerSampleCount++
          maxPower = Math.max(maxPower, record.power)
        }
        if (record.heartRate !== undefined && record.heartRate !== null && record.heartRate > 0) {
          maxHeartRate = Math.max(maxHeartRate, record.heartRate)
          minHeartRate = minHeartRate === undefined ? record.heartRate : Math.min(minHeartRate, record.heartRate)
        }
        if (record.cadence !== undefined && record.cadence !== null && record.cadence > 0) {
          maxCadence = Math.max(maxCadence, record.cadence)
        }
        const recordSpeed = record.enhancedSpeed ?? record.speed
        if (recordSpeed !== undefined && recordSpeed !== null) {
          maxSpeed = Math.max(maxSpeed, recordSpeed)
        }
      })
    }

    totalDistance += getFileDistance(messages, records)
    
    if (messages.sessionMesgs && messages.sessionMesgs.length > 0) {
      const session = messages.sessionMesgs[0]
      
      if (session.totalAscent !== undefined && session.totalAscent !== null) {
        totalAscent += session.totalAscent
      }
      
      if (session.totalDistance !== undefined) {
        totalDistance = Math.max(totalDistance, distanceOffset + session.totalDistance)
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

      if (session.totalDescent !== undefined && session.totalDescent !== null) {
        totalDescent += session.totalDescent
      }

      if (session.totalWork !== undefined && session.totalWork !== null) {
        totalWork += session.totalWork
      }

      if (session.maxSpeed !== undefined && session.maxSpeed !== null) {
        maxSpeed = Math.max(maxSpeed, session.maxSpeed)
      }

      if (session.enhancedMaxSpeed !== undefined && session.enhancedMaxSpeed !== null) {
        maxSpeed = Math.max(maxSpeed, session.enhancedMaxSpeed)
      }

      if (session.maxPower !== undefined && session.maxPower !== null) {
        maxPower = Math.max(maxPower, session.maxPower)
      }

      if (session.maxHeartRate !== undefined && session.maxHeartRate !== null) {
        maxHeartRate = Math.max(maxHeartRate, session.maxHeartRate)
      }

      if (session.minHeartRate !== undefined && session.minHeartRate !== null) {
        minHeartRate = minHeartRate === undefined ? session.minHeartRate : Math.min(minHeartRate, session.minHeartRate)
      }

      if (session.maxCadence !== undefined && session.maxCadence !== null) {
        maxCadence = Math.max(maxCadence, session.maxCadence)
      }

      if (session.trainingStressScore !== undefined && session.trainingStressScore !== null) {
        trainingStressScore += session.trainingStressScore
      }

      if (session.avgPower !== undefined && session.avgPower !== null) {
        const timerTime = session.totalTimerTime || session.totalElapsedTime || 0
        weightedPowerSum += session.avgPower * timerTime
        weightedPowerTime += timerTime
      }

      const timerTime = session.totalTimerTime || session.totalElapsedTime || 0
      addWeightedMetric(weightedHeartRate, session.avgHeartRate, timerTime)
      addWeightedMetric(weightedCadence, session.avgCadence, timerTime)
      addWeightedMetric(weightedSpeed, session.avgSpeed, timerTime)
      addWeightedMetric(weightedEnhancedSpeed, session.enhancedAvgSpeed, timerTime)
      addWeightedMetric(weightedIntensityFactor, session.intensityFactor, timerTime)
      addWeightedMetric(weightedTemperature, session.avgTemperature, timerTime)
      addNormalizedPower(weightedNormalizedPower, session.normalizedPower, timerTime)
    } else if (records.length > 0) {
      totalAscent += calculateRecordAscent(records)
    }
  })

  if (options.sortChronologically && mergedRecords.length > 0) {
    mergedRecords.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.getTime() : 0
      const timeB = b.timestamp ? b.timestamp.getTime() : 0
      return timeA - timeB
    })

    mergedLaps.sort((a, b) => {
      const timeA = a.startTime ? a.startTime.getTime() : 0
      const timeB = b.startTime ? b.startTime.getTime() : 0
      return timeA - timeB
    })
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
    totalDistance = Math.max(totalDistance, getLastDistance(mergedRecords))
  }

  if (mergedRecords.length > 0) {
    firstTimestamp = mergedRecords[0].timestamp
    lastTimestamp = mergedRecords[mergedRecords.length - 1].timestamp
  }

  mergedLaps = mergedLaps.map((lap, index) => ({
    ...lap,
    messageIndex: index,
  }))

  if (totalDistance === 0) {
    totalDistance = getLastDistance(mergedRecords)
  }

  if (totalElapsedTime === 0 && firstTimestamp && lastTimestamp) {
    totalElapsedTime = Math.max(0, (lastTimestamp.getTime() - firstTimestamp.getTime()) / 1000)
  }

  if (totalTimerTime === 0) {
    totalTimerTime = totalElapsedTime
  }

  if (totalAscent === 0) {
    totalAscent = calculateRecordAscent(mergedRecords)
  }

  const averagePower = weightedPowerTime > 0
    ? weightedPowerSum / weightedPowerTime
    : powerSampleCount > 0
      ? powerSum / powerSampleCount
      : undefined
  const averageSpeed = totalTimerTime > 0 ? totalDistance / totalTimerTime : getWeightedAverage(weightedSpeed)
  const averageEnhancedSpeed = getWeightedAverage(weightedEnhancedSpeed) ?? averageSpeed
  const averageHeartRate = getWeightedAverage(weightedHeartRate)
  const averageCadence = getWeightedAverage(weightedCadence)
  const averageTemperature = getWeightedAverage(weightedTemperature)
  const normalizedPower = getNormalizedPower(weightedNormalizedPower)
  const intensityFactor = getWeightedAverage(weightedIntensityFactor)
  const sessionBase = createMergedMessageBase(sourceSessionMessages)
  const lapBase = createMergedMessageBase(sourceLapMessages.length > 0 ? sourceLapMessages : sourceSessionMessages)
  const genericSessionSummary = aggregateNumericFields(sourceSessionMessages, summaryOverrideFields)
  const genericLapSummary = aggregateNumericFields(sourceLapMessages.length > 0 ? sourceLapMessages : sourceSessionMessages, summaryOverrideFields)

  const encoder = new Encoder()
  
  const firstFile = filesToMerge[0].parsed.messages
  
  if (firstFile.fileIdMesgs && firstFile.fileIdMesgs.length > 0) {
    const fileId = cloneMessage(firstFile.fileIdMesgs[0])
    fileId.mesgNum = Profile.MesgNum.FILE_ID
    fileId.timeCreated = firstTimestamp || new Date()
    fileId.type = fileId.type || 'activity'
    encoder.writeMesg(fileId)
  } else {
    encoder.writeMesg({
      mesgNum: Profile.MesgNum.FILE_ID,
      type: 'activity',
      manufacturer: 'development',
      product: 0,
      timeCreated: firstTimestamp || new Date()
    })
  }

  if (firstFile.deviceInfoMesgs && firstFile.deviceInfoMesgs.length > 0) {
    const deviceInfo = cloneMessage(firstFile.deviceInfoMesgs[0])
    deviceInfo.mesgNum = Profile.MesgNum.DEVICE_INFO
    deviceInfo.timestamp = firstTimestamp || deviceInfo.timestamp
    encoder.writeMesg(deviceInfo)
  }

  if (firstTimestamp) {
    encoder.writeMesg({
      mesgNum: Profile.MesgNum.EVENT,
      timestamp: firstTimestamp,
      event: 'timer',
      eventType: 'start'
    })
  }

  mergedRecords.forEach(record => {
    encoder.writeMesg(record)
  })

  if (lastTimestamp) {
    encoder.writeMesg({
      mesgNum: Profile.MesgNum.EVENT,
      timestamp: lastTimestamp,
      event: 'timer',
      eventType: 'stop'
    })
  }

  if (mergedLaps.length > 0) {
    mergedLaps.forEach(lap => {
      encoder.writeMesg(lap)
    })
  } else if (mergedRecords.length > 0) {
    const lapMessage: any = {
      ...lapBase,
      ...genericLapSummary,
      mesgNum: Profile.MesgNum.LAP,
      messageIndex: 0,
      timestamp: lastTimestamp,
      startTime: firstTimestamp,
      totalElapsedTime: totalElapsedTime,
      totalTimerTime: totalTimerTime,
      totalDistance: totalDistance,
      totalAscent: totalAscent,
      totalDescent: totalDescent || undefined,
      totalCalories: totalCalories,
      avgPower: averagePower,
      maxPower: maxPower || undefined,
      normalizedPower: normalizedPower,
      trainingStressScore: trainingStressScore || undefined,
      intensityFactor: intensityFactor,
      avgSpeed: averageSpeed,
      maxSpeed: maxSpeed || undefined,
      enhancedAvgSpeed: averageEnhancedSpeed,
      enhancedMaxSpeed: maxSpeed || undefined,
      avgHeartRate: averageHeartRate,
      maxHeartRate: maxHeartRate || undefined,
      minHeartRate: minHeartRate,
      avgCadence: averageCadence,
      maxCadence: maxCadence || undefined,
      avgTemperature: averageTemperature,
      totalWork: totalWork || undefined
    }
    encoder.writeMesg(lapMessage)
  }

  const sessionMessage: any = {
    ...sessionBase,
    ...genericSessionSummary,
    mesgNum: Profile.MesgNum.SESSION,
    messageIndex: 0,
    timestamp: lastTimestamp,
    startTime: firstTimestamp,
    totalElapsedTime: totalElapsedTime,
    totalTimerTime: totalTimerTime,
    totalDistance: totalDistance,
    totalAscent: totalAscent,
    totalDescent: totalDescent || undefined,
    totalCalories: totalCalories,
    avgPower: averagePower,
    maxPower: maxPower || undefined,
    normalizedPower: normalizedPower,
    trainingStressScore: trainingStressScore || undefined,
    intensityFactor: intensityFactor,
    avgSpeed: averageSpeed,
    maxSpeed: maxSpeed || undefined,
    enhancedAvgSpeed: averageEnhancedSpeed,
    enhancedMaxSpeed: maxSpeed || undefined,
    avgHeartRate: averageHeartRate,
    maxHeartRate: maxHeartRate || undefined,
    minHeartRate: minHeartRate,
    avgCadence: averageCadence,
    maxCadence: maxCadence || undefined,
    avgTemperature: averageTemperature,
    totalWork: totalWork || undefined,
    sport: firstFile.sessionMesgs?.[0]?.sport || 'cycling',
    subSport: firstFile.sessionMesgs?.[0]?.subSport,
    firstLapIndex: 0,
    numLaps: mergedLaps.length > 0 ? mergedLaps.length : mergedRecords.length > 0 ? 1 : 0
  }
  encoder.writeMesg(sessionMessage)

  const activityMessage: any = {
    mesgNum: Profile.MesgNum.ACTIVITY,
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
