import { FitFileData, MergeOptions } from './types'
import { Buffer } from 'buffer'

export const mergeFitFiles = (files: FitFileData[], options: MergeOptions): Blob => {
  const validFiles = files.filter(f => f.status === 'parsed' && f.parsed)
  
  if (validFiles.length === 0) {
    throw new Error('No valid files to merge')
  }

  let mergedRecords: any[] = []
  let mergedLaps: any[] = []
  let mergedSessions: any[] = []
  const fileIds: any[] = []
  
  validFiles.forEach((fileData) => {
    const parsed = fileData.parsed
    
    if (parsed.records) {
      mergedRecords = mergedRecords.concat(parsed.records)
    }
    
    if (parsed.laps) {
      mergedLaps = mergedLaps.concat(parsed.laps)
    }
    
    if (parsed.sessions) {
      mergedSessions = mergedSessions.concat(parsed.sessions)
    }
    
    if (parsed.file_ids && parsed.file_ids.length > 0) {
      fileIds.push(parsed.file_ids[0])
    }
  })

  if (options.sortChronologically && mergedRecords.length > 0) {
    mergedRecords.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return timeA - timeB
    })
    
    if (mergedLaps.length > 0) {
      mergedLaps.sort((a, b) => {
        const timeA = a.start_time ? new Date(a.start_time).getTime() : 0
        const timeB = b.start_time ? new Date(b.start_time).getTime() : 0
        return timeA - timeB
      })
    }
    
    if (mergedSessions.length > 0) {
      mergedSessions.sort((a, b) => {
        const timeA = a.start_time ? new Date(a.start_time).getTime() : 0
        const timeB = b.start_time ? new Date(b.start_time).getTime() : 0
        return timeA - timeB
      })
    }
  }

  if (options.removeDuplicateTimestamps && mergedRecords.length > 0) {
    const seen = new Set<number>()
    mergedRecords = mergedRecords.filter((record) => {
      if (!record.timestamp) return true
      const time = new Date(record.timestamp).getTime()
      if (seen.has(time)) return false
      seen.add(time)
      return true
    })
  }

  const mergedData = {
    file_ids: fileIds.length > 0 ? [fileIds[0]] : [],
    records: mergedRecords,
    laps: mergedLaps,
    sessions: mergedSessions,
    activity: validFiles[0].parsed.activity || {}
  }

  const fitBuffer = createFitFile(mergedData)
  return new Blob([fitBuffer], { type: 'application/octet-stream' })
}

const createFitFile = (data: any): Buffer => {
  const header = Buffer.alloc(14)
  header.writeUInt8(14, 0)
  header.writeUInt8(0x10, 1)
  header.writeUInt16LE(2064, 2)
  header.writeUInt32LE(0, 4)
  header.write('.FIT', 8, 4, 'ascii')
  
  const dataMessages = Buffer.alloc(0)
  
  const crc = calculateCRC(Buffer.concat([header, dataMessages]))
  const crcBuffer = Buffer.alloc(2)
  crcBuffer.writeUInt16LE(crc, 0)
  
  return Buffer.concat([header, dataMessages, crcBuffer])
}

const calculateCRC = (buffer: Buffer): number => {
  const crcTable = [
    0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
    0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400
  ]
  
  let crc = 0
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i]
    let tmp = crcTable[crc & 0xF]
    crc = (crc >> 4) & 0x0FFF
    crc = crc ^ tmp ^ crcTable[byte & 0xF]
    tmp = crcTable[crc & 0xF]
    crc = (crc >> 4) & 0x0FFF
    crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0xF]
  }
  
  return crc
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
