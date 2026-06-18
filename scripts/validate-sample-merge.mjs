import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Decoder, Stream } from '@garmin/fitsdk'

const rootDir = process.cwd()
const samplePaths = [
  path.join(rootDir, 'sample_data', 'Ride_on_10_6_2026_.fit'),
  path.join(rootDir, 'sample_data', 'Ride_on_14_6_2026.fit'),
]
const outputPath = path.join(os.tmpdir(), 'fit-file-merger-sample-merged.fit')
const bundlePath = path.join(os.tmpdir(), 'fit-file-merger-fitMerger.bundle.mjs')

const summaryIgnoreFields = new Set([
  'messageIndex',
  'timestamp',
  'startTime',
  'firstLapIndex',
  'numLaps',
  'eventGroup',
])

const coreSessionFields = [
  'totalDistance',
  'totalElapsedTime',
  'totalTimerTime',
  'totalAscent',
  'totalDescent',
  'totalCalories',
  'totalWork',
  'avgSpeed',
  'enhancedAvgSpeed',
  'maxSpeed',
  'enhancedMaxSpeed',
  'avgPower',
  'maxPower',
  'normalizedPower',
  'intensityFactor',
  'trainingStressScore',
  'avgCadence',
  'maxCadence',
  'avgHeartRate',
  'maxHeartRate',
  'minHeartRate',
]

const recordMetricFields = [
  'positionLat',
  'positionLong',
  'distance',
  'speed',
  'enhancedSpeed',
  'altitude',
  'enhancedAltitude',
  'power',
  'accumulatedPower',
  'heartRate',
  'cadence',
]

const decodeFit = (input) => {
  const buffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input)
  const decoder = new Decoder(Stream.fromBuffer(buffer))

  assert.equal(decoder.isFIT(), true, `${input} is not a FIT file`)
  assert.equal(decoder.checkIntegrity(), true, `${input} failed FIT integrity check`)

  const { messages, errors } = decoder.read()
  assert.equal(errors?.length || 0, 0, `${input} decoded with errors: ${JSON.stringify(errors)}`)

  return messages
}

const requireSamples = () => {
  samplePaths.forEach((samplePath) => {
    assert.equal(fs.existsSync(samplePath), true, `Missing sample FIT file: ${samplePath}`)
  })
}

const bundleMerger = () => {
  const esbuildBin = path.join(rootDir, 'node_modules', 'esbuild', 'bin', 'esbuild')
  const result = spawnSync(process.execPath, [
    esbuildBin,
    path.join(rootDir, 'src', 'lib', 'fitMerger.ts'),
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${bundlePath}`,
  ], {
    cwd: rootDir,
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, `Failed to bundle fitMerger.ts\n${result.stdout}\n${result.stderr}`)
}

const sum = (items, selector) => items.reduce((total, item) => total + (selector(item) || 0), 0)

const weightedAverage = (items, selector) => {
  const weighted = items.reduce((acc, item) => {
    const value = selector(item)
    const weight = item.totalTimerTime || item.totalElapsedTime || 0

    if (value !== undefined && value !== null && weight > 0) {
      acc.sum += value * weight
      acc.weight += weight
    }

    return acc
  }, { sum: 0, weight: 0 })

  return weighted.weight > 0 ? weighted.sum / weighted.weight : undefined
}

const weightedNormalizedPower = (items) => {
  const weighted = items.reduce((acc, item) => {
    const value = item.normalizedPower
    const weight = item.totalTimerTime || item.totalElapsedTime || 0

    if (value !== undefined && value !== null && weight > 0) {
      acc.sum += Math.pow(value, 4) * weight
      acc.weight += weight
    }

    return acc
  }, { sum: 0, weight: 0 })

  return weighted.weight > 0 ? Math.pow(weighted.sum / weighted.weight, 0.25) : undefined
}

const fieldSet = (messages, ignoredFields = new Set()) => [
  ...new Set(messages.flatMap((message) => Object.keys(message).filter((key) => !ignoredFields.has(key))))
].sort()

const countRecords = (records) => {
  const counts = {
    records: records.length,
    positions: 0,
    powerRecords: 0,
    heartRateRecords: 0,
    cadenceRecords: 0,
    distanceRecords: 0,
    altitudeRecords: 0,
    speedRecords: 0,
    distanceMonotonic: true,
  }
  let previousDistance

  records.forEach((record) => {
    if (record.positionLat !== undefined && record.positionLong !== undefined) counts.positions++
    if (record.power !== undefined && record.power !== null && record.power > 0) counts.powerRecords++
    if (record.heartRate !== undefined && record.heartRate !== null && record.heartRate > 0) counts.heartRateRecords++
    if (record.cadence !== undefined && record.cadence !== null && record.cadence > 0) counts.cadenceRecords++
    if (record.altitude !== undefined || record.enhancedAltitude !== undefined) counts.altitudeRecords++
    if (record.speed !== undefined || record.enhancedSpeed !== undefined) counts.speedRecords++

    if (record.distance !== undefined && record.distance !== null) {
      counts.distanceRecords++
      if (previousDistance !== undefined && record.distance < previousDistance) counts.distanceMonotonic = false
      previousDistance = record.distance
    }
  })

  return counts
}

const assertNear = (actual, expected, tolerance, label) => {
  assert.equal(actual !== undefined && actual !== null, true, `${label} is missing`)
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`)
}

const assertFieldCoverage = (sourceFields, mergedFields, label) => {
  const missingFields = sourceFields.filter((field) => !mergedFields.includes(field))
  assert.deepEqual(missingFields, [], `${label} fields dropped: ${missingFields.join(', ')}`)
}

const assertChronologicalLaps = (laps) => {
  laps.forEach((lap, index) => {
    assert.equal(lap.messageIndex, index, `lap ${index} messageIndex should be ${index}`)
    if (index > 0) {
      assert.ok(lap.startTime >= laps[index - 1].startTime, `lap ${index} is not chronological`)
    }
  })
}

const buildExpected = (sourceMessages) => {
  const sessions = sourceMessages.flatMap((messages) => messages.sessionMesgs || [])
  const laps = sourceMessages.flatMap((messages) => messages.lapMesgs || [])
  const records = sourceMessages.flatMap((messages) => messages.recordMesgs || [])
  const recordCounts = sourceMessages
    .map((messages) => countRecords(messages.recordMesgs || []))
    .reduce((total, counts) => {
      Object.entries(counts).forEach(([key, value]) => {
        if (key === 'distanceMonotonic') return
        total[key] = (total[key] || 0) + value
      })
      total.distanceMonotonic = total.distanceMonotonic && counts.distanceMonotonic
      return total
    }, { distanceMonotonic: true })

  return {
    sessions,
    laps,
    records,
    recordCounts,
    sessionFields: fieldSet(sessions, summaryIgnoreFields),
    lapFields: fieldSet(laps, new Set(['messageIndex'])),
    recordMetricFields: fieldSet(records).filter((field) => recordMetricFields.includes(field)),
    totalDistance: sum(sessions, (session) => session.totalDistance),
    totalElapsedTime: sum(sessions, (session) => session.totalElapsedTime),
    totalTimerTime: sum(sessions, (session) => session.totalTimerTime),
    totalAscent: sum(sessions, (session) => session.totalAscent),
    totalDescent: sum(sessions, (session) => session.totalDescent),
    totalCalories: sum(sessions, (session) => session.totalCalories),
    totalWork: sum(sessions, (session) => session.totalWork),
    avgSpeed: sum(sessions, (session) => session.totalDistance) / sum(sessions, (session) => session.totalTimerTime),
    avgPower: weightedAverage(sessions, (session) => session.avgPower),
    normalizedPower: weightedNormalizedPower(sessions),
    avgCadence: weightedAverage(sessions, (session) => session.avgCadence),
    avgHeartRate: weightedAverage(sessions, (session) => session.avgHeartRate),
    avgTemperature: weightedAverage(sessions, (session) => session.avgTemperature),
    maxSpeed: Math.max(...sessions.map((session) => session.enhancedMaxSpeed ?? session.maxSpeed).filter(Number.isFinite)),
    maxPower: Math.max(...sessions.map((session) => session.maxPower).filter(Number.isFinite)),
    maxCadence: Math.max(...sessions.map((session) => session.maxCadence).filter(Number.isFinite)),
    maxHeartRate: Math.max(...sessions.map((session) => session.maxHeartRate).filter(Number.isFinite)),
    minHeartRate: Math.min(...sessions.map((session) => session.minHeartRate).filter(Number.isFinite)),
    intensityFactorPresent: sessions.some((session) => session.intensityFactor !== undefined),
    trainingStressScorePresent: sessions.some((session) => session.trainingStressScore !== undefined),
  }
}

const run = async () => {
  requireSamples()
  bundleMerger()

  const sourceMessages = samplePaths.map(decodeFit)
  const expected = buildExpected(sourceMessages)
  const { mergeFitFiles } = await import(pathToFileURL(bundlePath).href)
  const files = sourceMessages.map((messages, index) => ({
    id: String(index),
    name: path.basename(samplePaths[index]),
    status: 'parsed',
    parsed: { messages },
  }))

  const blob = await mergeFitFiles(files, {
    sortChronologically: true,
    preserveAllData: true,
    removeDuplicateTimestamps: true,
  })
  const mergedBuffer = Buffer.from(await blob.arrayBuffer())
  fs.writeFileSync(outputPath, mergedBuffer)

  const mergedMessages = decodeFit(mergedBuffer)
  const mergedSession = mergedMessages.sessionMesgs?.[0]
  const mergedLaps = mergedMessages.lapMesgs || []
  const mergedRecords = mergedMessages.recordMesgs || []
  const mergedRecordCounts = countRecords(mergedRecords)

  assert.ok(mergedSession, 'merged FIT is missing session message')
  assert.equal(mergedMessages.activityMesgs?.length, 1, 'merged FIT should have one activity message')
  assert.equal(mergedLaps.length, expected.laps.length, 'lap count changed')
  assert.equal(mergedSession.numLaps, expected.laps.length, 'session numLaps changed')
  assertChronologicalLaps(mergedLaps)

  assertFieldCoverage(expected.sessionFields, Object.keys(mergedSession), 'session')
  assertFieldCoverage(expected.lapFields, fieldSet(mergedLaps, new Set(['messageIndex'])), 'lap')
  assertFieldCoverage(expected.recordMetricFields, fieldSet(mergedRecords), 'record metric')

  Object.entries(expected.recordCounts).forEach(([key, value]) => {
    assert.equal(mergedRecordCounts[key], value, `record count mismatch for ${key}`)
  })
  assert.equal(mergedRecordCounts.distanceMonotonic, true, 'merged record distance must be monotonic')

  assertNear(mergedSession.totalDistance, expected.totalDistance, 1, 'totalDistance')
  assertNear(mergedSession.totalElapsedTime, expected.totalElapsedTime, 0.01, 'totalElapsedTime')
  assertNear(mergedSession.totalTimerTime, expected.totalTimerTime, 0.01, 'totalTimerTime')
  assertNear(mergedSession.totalAscent, expected.totalAscent, 1, 'totalAscent')
  assertNear(mergedSession.totalDescent, expected.totalDescent, 1, 'totalDescent')
  assertNear(mergedSession.totalCalories, expected.totalCalories, 1, 'totalCalories')
  assertNear(mergedSession.totalWork, expected.totalWork, 1, 'totalWork')
  assertNear(mergedSession.avgSpeed, expected.avgSpeed, 0.001, 'avgSpeed')
  assertNear(mergedSession.enhancedAvgSpeed, expected.avgSpeed, 0.001, 'enhancedAvgSpeed')
  assertNear(mergedSession.maxSpeed, expected.maxSpeed, 0.001, 'maxSpeed')
  assertNear(mergedSession.enhancedMaxSpeed, expected.maxSpeed, 0.001, 'enhancedMaxSpeed')
  assertNear(mergedSession.avgPower, expected.avgPower, 1, 'avgPower')
  assertNear(mergedSession.maxPower, expected.maxPower, 0, 'maxPower')
  assertNear(mergedSession.normalizedPower, expected.normalizedPower, 1, 'normalizedPower')
  assertNear(mergedSession.avgCadence, expected.avgCadence, 1, 'avgCadence')
  assertNear(mergedSession.maxCadence, expected.maxCadence, 0, 'maxCadence')
  assertNear(mergedSession.avgHeartRate, expected.avgHeartRate, 1, 'avgHeartRate')
  assertNear(mergedSession.maxHeartRate, expected.maxHeartRate, 0, 'maxHeartRate')
  assertNear(mergedSession.minHeartRate, expected.minHeartRate, 0, 'minHeartRate')
  assertNear(mergedSession.avgTemperature, expected.avgTemperature, 1, 'avgTemperature')

  if (expected.intensityFactorPresent) {
    assert.equal(mergedSession.intensityFactor !== undefined, true, 'intensityFactor should be preserved when present')
  }
  if (expected.trainingStressScorePresent) {
    assert.equal(mergedSession.trainingStressScore !== undefined, true, 'trainingStressScore should be preserved when present')
  }

  const summary = {
    outputPath,
    records: mergedRecords.length,
    laps: mergedLaps.length,
    totalDistance: mergedSession.totalDistance,
    totalAscent: mergedSession.totalAscent,
    avgSpeed: mergedSession.avgSpeed,
    avgPower: mergedSession.avgPower,
    normalizedPower: mergedSession.normalizedPower,
    avgCadence: mergedSession.avgCadence,
    avgHeartRate: mergedSession.avgHeartRate,
    maxHeartRate: mergedSession.maxHeartRate,
  }
  console.log(JSON.stringify(summary, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
