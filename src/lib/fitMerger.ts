import { FitFileData, MergeOptions } from './types'
import { Buffer } from 'buffer'

export const mergeFitFiles = async (files: FitFileData[], options: MergeOptions): Promise<Blob> => {
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

  const fitBuffer = await createFitFile(mergedData, validFiles)
  return new Blob([fitBuffer], { type: 'application/octet-stream' })
}

const readFileAsBuffer = (file: File): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      resolve(Buffer.from(arrayBuffer))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

const createFitFile = async (mergedData: any, originalFiles: FitFileData[]): Promise<Buffer> => {
  try {
    const fileBuffers = await Promise.all(
      originalFiles.map(fileData => readFileAsBuffer(fileData.file))
    )
    
    const firstFileBuffer = fileBuffers[0]
    const headerSize = firstFileBuffer.readUInt8(0)
    const protocolVersion = firstFileBuffer.readUInt8(1)
    const profileVersion = firstFileBuffer.readUInt16LE(2)
    
    const header = Buffer.alloc(14)
    header.writeUInt8(headerSize, 0)
    header.writeUInt8(protocolVersion, 1)
    header.writeUInt16LE(profileVersion, 2)
    
    const dataRecords: Buffer[] = []
    
    fileBuffers.forEach((fileBuffer) => {
      const fileHeaderSize = fileBuffer.readUInt8(0)
      const dataSize = fileBuffer.readUInt32LE(4)
      
      const dataStart = fileHeaderSize
      const dataEnd = dataStart + dataSize
      const dataSection = fileBuffer.slice(dataStart, dataEnd)
      
      dataRecords.push(dataSection)
    })
    
    const mergedDataBuffer = Buffer.concat(dataRecords)
    
    header.writeUInt32LE(mergedDataBuffer.length, 4)
    header.write('.FIT', 8, 4, 'ascii')
    
    const headerCRC = calculateCRC(header.slice(0, 12))
    header.writeUInt16LE(headerCRC, 12)
    
    const fileCRC = calculateCRC(Buffer.concat([header, mergedDataBuffer]))
    const crcBuffer = Buffer.alloc(2)
    crcBuffer.writeUInt16LE(fileCRC, 0)
    
    return Buffer.concat([header, mergedDataBuffer, crcBuffer])
  } catch (error) {
    throw new Error('Failed to create merged FIT file: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
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
