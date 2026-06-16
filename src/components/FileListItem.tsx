import { useEffect, useRef } from 'react'
import { Trash, DotsSixVertical, Clock, CalendarBlank, CheckCircle, Warning } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FitFileData } from '@/lib/types'
import { formatDuration, formatDistance, formatDate } from '@/lib/fitParser'
import { motion } from 'framer-motion'
import type { Language } from '@/lib/i18n'

interface FileListItemProps {
  fileData: FitFileData
  onRemove: () => void
  lang: Language
  t: any
  showTrack?: boolean
}

export const FileListItem = ({ fileData, onRemove, lang, t, showTrack = false }: FileListItemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!showTrack || !canvasRef.current || fileData.status !== 'parsed' || !fileData.parsed?.records) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords: [number, number][] = []
    fileData.parsed.records.forEach((record: any) => {
      if (record.position_lat !== undefined && record.position_long !== undefined) {
        coords.push([record.position_lat, record.position_long])
      }
    })

    if (coords.length === 0) return

    const lats = coords.map(c => c[0])
    const lngs = coords.map(c => c[1])
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const padding = 10
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#3b82f6'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    coords.forEach((coord, i) => {
      const x = padding + ((coord[1] - minLng) / (maxLng - minLng || 1)) * width
      const y = padding + height - ((coord[0] - minLat) / (maxLat - minLat || 1)) * height
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    const startX = padding + ((coords[0][1] - minLng) / (maxLng - minLng || 1)) * width
    const startY = padding + height - ((coords[0][0] - minLat) / (maxLat - minLat || 1)) * height
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(startX, startY, 4, 0, 2 * Math.PI)
    ctx.fill()

    const endX = padding + ((coords[coords.length - 1][1] - minLng) / (maxLng - minLng || 1)) * width
    const endY = padding + height - ((coords[coords.length - 1][0] - minLat) / (maxLat - minLat || 1)) * height
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(endX, endY, 4, 0, 2 * Math.PI)
    ctx.fill()
  }, [showTrack, fileData])

  const getStatusBadge = () => {
    switch (fileData.status) {
      case 'parsing':
        return <Badge variant="secondary">{t.parsing}</Badge>
      case 'parsed':
        return <Badge className="bg-accent text-accent-foreground"><CheckCircle className="mr-1" size={14} />{t.parsed}</Badge>
      case 'error':
        return <Badge variant="destructive"><Warning className="mr-1" size={14} />{t.error}</Badge>
      default:
        return <Badge variant="outline">{t.pending}</Badge>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
            <DotsSixVertical size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{fileData.name}</h4>
                <div className="mt-1">
                  {getStatusBadge()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash size={18} />
              </Button>
            </div>

            {showTrack && fileData.status === 'parsed' && fileData.parsed?.records && (
              <div className="mb-3">
                <canvas 
                  ref={canvasRef} 
                  width={400} 
                  height={120} 
                  className="w-full h-auto bg-muted/30 rounded border border-border"
                />
              </div>
            )}

            {fileData.status === 'parsed' && fileData.metadata && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {fileData.metadata.sport && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t.sport}</p>
                    <p className="font-medium capitalize">{fileData.metadata.sport}</p>
                  </div>
                )}
                {fileData.metadata.duration !== undefined && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.duration}</p>
                      <p className="font-medium">{formatDuration(fileData.metadata.duration)}</p>
                    </div>
                  </div>
                )}
                {fileData.metadata.distance !== undefined && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t.distance}</p>
                    <p className="font-medium">{formatDistance(fileData.metadata.distance)}</p>
                  </div>
                )}
                {fileData.metadata.startTime && (
                  <div className="flex items-center gap-1">
                    <CalendarBlank size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.startTime}</p>
                      <p className="font-medium">{formatDate(fileData.metadata.startTime, lang)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {fileData.status === 'error' && fileData.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {fileData.error}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
