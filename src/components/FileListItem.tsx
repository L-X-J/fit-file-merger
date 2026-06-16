import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Trash, Clock, MapPin, CheckCircle, Warning, CircleNotch, TrendUp } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FitFileData } from '@/lib/types'
import { formatDuration, formatDistance, formatDate, formatElevation } from '@/lib/fitParser'
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
    if (!showTrack || !canvasRef.current || fileData.status !== 'parsed' || !fileData.parsed?.messages?.recordMesgs) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords: [number, number][] = []
    fileData.parsed.messages.recordMesgs.forEach((record: any) => {
      if (record.positionLat !== undefined && record.positionLong !== undefined) {
        coords.push([record.positionLat, record.positionLong])
      }
    })

    if (coords.length === 0) return

    const lats = coords.map(c => c[0])
    const lngs = coords.map(c => c[1])
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const padding = 20
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
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
    ctx.fillStyle = 'rgba(16, 185, 129, 0.7)'
    ctx.beginPath()
    ctx.arc(startX, startY, 4, 0, 2 * Math.PI)
    ctx.fill()

    const endX = padding + ((coords[coords.length - 1][1] - minLng) / (maxLng - minLng || 1)) * width
    const endY = padding + height - ((coords[coords.length - 1][0] - minLat) / (maxLat - minLat || 1)) * height
    ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'
    ctx.beginPath()
    ctx.arc(endX, endY, 4, 0, 2 * Math.PI)
    ctx.fill()
  }, [showTrack, fileData])

  const getStatusBadge = () => {
    switch (fileData.status) {
      case 'parsing':
        return (
          <Badge variant="secondary" className="gap-1">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <CircleNotch size={14} />
            </motion.div>
            {t.parsing}
          </Badge>
        )
      case 'parsed':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
            <CheckCircle size={14} weight="fill" />
            {t.parsed}
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <Warning size={14} weight="fill" />
            {t.error}
          </Badge>
        )
      default:
        return <Badge variant="outline">{t.pending}</Badge>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className="relative p-5 border hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden">
        {showTrack && fileData.status === 'parsed' && fileData.parsed?.records && (
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={180} 
            className="absolute inset-0 w-full h-full opacity-100 pointer-events-none"
          />
        )}
        
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate mb-2">{fileData.name}</h4>
                {getStatusBadge()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="hover:bg-destructive/10 hover:text-destructive rounded-full transition-all"
              >
                <Trash size={18} weight="duotone" />
              </Button>
            </div>

            {fileData.status === 'parsed' && fileData.metadata && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {fileData.metadata.sport && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-primary" weight="duotone" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t.sport}</p>
                      <p className="font-medium capitalize truncate">{fileData.metadata.sport}</p>
                    </div>
                  </div>
                )}
                {fileData.metadata.duration !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-primary" weight="duotone" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t.duration}</p>
                      <p className="font-medium truncate">{formatDuration(fileData.metadata.duration)}</p>
                    </div>
                  </div>
                )}
                {(fileData.metadata.distance !== undefined || fileData.metadata.totalAscent !== undefined) && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-3 p-3 bg-card/90 backdrop-blur-sm rounded-lg border border-border/50">
                      {fileData.metadata.distance !== undefined && (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="text-xs text-muted-foreground">{t.distance}:</div>
                          <div className="font-semibold text-lg text-primary">{formatDistance(fileData.metadata.distance)}</div>
                        </div>
                      )}
                      {fileData.metadata.totalAscent !== undefined && (
                        <div className="flex items-center gap-2 flex-1">
                          <TrendUp size={16} className="text-muted-foreground" weight="duotone" />
                          <div className="text-xs text-muted-foreground">{t.elevation}:</div>
                          <div className="font-semibold text-base">{formatElevation(fileData.metadata.totalAscent)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {fileData.status === 'error' && fileData.error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
              >
                {fileData.error}
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
