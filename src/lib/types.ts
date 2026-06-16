export interface FitFileData {
  id: string
  name: string
  file: File
  parsed?: any
  metadata?: {
    activityType?: string
    duration?: number
    startTime?: Date
    distance?: number
    sport?: string
  }
  error?: string
  status: 'pending' | 'parsing' | 'parsed' | 'error'
}

export interface MergeOptions {
  sortChronologically: boolean
  preserveAllData: boolean
  removeDuplicateTimestamps: boolean
}
