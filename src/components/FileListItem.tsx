import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Mountain,
  Route,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate, formatDistance, formatDuration, formatElevation } from '@/lib/fitParser'
import { getRecordCoordinate } from '@/lib/coordinates'
import type { FitFileData } from '@/lib/types'
import type { Language, Translations } from '@/lib/i18n'

interface FileListItemProps {
  fileData: FitFileData
  onRemove: () => void
  lang: Language
  t: Translations
  showTrack?: boolean
}

export const FileListItem = ({
  fileData,
  onRemove,
  lang,
  t,
  showTrack = false,
}: FileListItemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!showTrack || !canvasRef.current || fileData.status !== 'parsed' || !fileData.parsed?.messages?.recordMesgs) {
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    const coordinates: [number, number][] = []
    fileData.parsed.messages.recordMesgs.forEach((record: any) => {
      const coordinate = getRecordCoordinate(record)
      if (coordinate) {
        coordinates.push(coordinate)
      }
    })

    context.clearRect(0, 0, canvas.width, canvas.height)
    if (coordinates.length === 0) return

    const latitudes = coordinates.map((coordinate) => coordinate[0])
    const longitudes = coordinates.map((coordinate) => coordinate[1])
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    const padding = 20
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2

    context.strokeStyle = 'rgba(45, 100, 216, 0.22)'
    context.lineWidth = 2
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()

    coordinates.forEach((coordinate, index) => {
      const x = padding + ((coordinate[1] - minLng) / (maxLng - minLng || 1)) * width
      const y = padding + height - ((coordinate[0] - minLat) / (maxLat - minLat || 1)) * height
      if (index === 0) {
        context.moveTo(x, y)
      } else {
        context.lineTo(x, y)
      }
    })

    context.stroke()
  }, [fileData, showTrack])

  const statusBadge = (() => {
    switch (fileData.status) {
      case 'parsing':
        return (
          <Badge variant="secondary">
            <LoaderCircle className="size-3 animate-spin" />
            {t.parsing}
          </Badge>
        )
      case 'parsed':
        return (
          <Badge className="border-transparent bg-primary/12 text-primary">
            <CheckCircle2 className="size-3" />
            {t.parsed}
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <CircleAlert className="size-3" />
            {t.error}
          </Badge>
        )
      default:
        return <Badge variant="outline">{t.pending}</Badge>
    }
  })()

  const metrics = [
    fileData.metadata?.sport
      ? {
          label: t.sport,
          value: fileData.metadata.sport,
          icon: <Activity className="size-4 text-primary" />,
        }
      : null,
    fileData.metadata?.duration !== undefined
      ? {
          label: t.duration,
          value: formatDuration(fileData.metadata.duration),
          icon: <Clock3 className="size-4 text-primary" />,
        }
      : null,
    fileData.metadata?.startTime
      ? {
          label: t.startTime,
          value: formatDate(fileData.metadata.startTime, lang),
          icon: <CalendarClock className="size-4 text-primary" />,
        }
      : null,
    fileData.metadata?.distance !== undefined
      ? {
          label: t.distance,
          value: formatDistance(fileData.metadata.distance),
          icon: <Route className="size-4 text-primary" />,
        }
      : null,
    fileData.metadata?.totalAscent !== undefined
      ? {
          label: t.elevation,
          value: formatElevation(fileData.metadata.totalAscent),
          icon: <Mountain className="size-4 text-primary" />,
        }
      : null,
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-border/70 bg-background/88 px-5 py-5 shadow-sm transition-colors',
          fileData.status === 'error' && 'border-destructive/35 bg-destructive/5'
        )}
      >
        {showTrack && fileData.status === 'parsed' && (
          <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-100"
          />
        )}

        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-base font-semibold">{fileData.name}</h4>
                {statusBadge}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={`${t.removeFile}: ${fileData.name}`}
            >
              <Trash2 />
            </Button>
          </div>

          {metrics.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.map((metric, index) => {
                if (!metric) return null
                return (
                  <div
                    key={`${fileData.id}-metric-${index}`}
                    className="rounded-2xl border border-border/65 bg-background/82 px-3 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/10">
                        {metric.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className="truncate text-sm font-medium capitalize">{metric.value}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {fileData.status === 'error' && fileData.error && (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {fileData.error}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
