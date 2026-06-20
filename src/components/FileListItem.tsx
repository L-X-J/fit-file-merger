import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Bike,
  Calendar,
  Check,
  CircleAlert,
  Clock3,
  Footprints,
  LoaderCircle,
  MapPinned,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getRecordCoordinate } from '@/lib/coordinates'
import { formatDistance } from '@/lib/fitParser'
import { cn } from '@/lib/utils'
import type { FitFileData } from '@/lib/types'
import type { Language, Translations } from '@/lib/i18n'

type ReviewAccent = 'emerald' | 'blue' | 'orange'

interface FileListItemProps {
  fileData: FitFileData
  onRemove: () => void
  lang: Language
  t: Translations
  showTrack?: boolean
  accent?: ReviewAccent
}

const accentStyles: Record<
  ReviewAccent,
  {
    icon: string
    glow: string
    stroke: string
    shadowStroke: string
    wash: string
  }
> = {
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    glow: 'bg-emerald-500/8',
    stroke: 'rgba(39, 155, 89, 0.36)',
    shadowStroke: 'rgba(39, 155, 89, 0.09)',
    wash: 'from-emerald-50/72',
  },
  blue: {
    icon: 'bg-blue-100 text-primary',
    glow: 'bg-blue-500/8',
    stroke: 'rgba(37, 99, 235, 0.34)',
    shadowStroke: 'rgba(37, 99, 235, 0.08)',
    wash: 'from-blue-50/72',
  },
  orange: {
    icon: 'bg-orange-100 text-orange-600',
    glow: 'bg-orange-500/8',
    stroke: 'rgba(249, 115, 22, 0.36)',
    shadowStroke: 'rgba(249, 115, 22, 0.09)',
    wash: 'from-orange-50/72',
  },
}

const formatClockDuration = (seconds?: number) => {
  if (!seconds) return 'N/A'

  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`
}

const formatActivityDate = (date?: Date, lang: Language = 'en') => {
  if (!date) return { date: 'N/A', time: '' }

  const locale = lang === 'zh' ? 'en-US' : 'en-US'

  return {
    date: new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
  }
}

const getActivityLabel = (sport?: string) => {
  const normalized = sport?.toLowerCase() || ''

  if (normalized.includes('run')) return 'running activity'
  if (
    normalized.includes('bike') ||
    normalized.includes('ride') ||
    normalized.includes('cycling')
  ) {
    return 'cycling activity'
  }

  return normalized ? `${normalized} activity` : 'activity'
}

const getSportIcon = (sport?: string) => {
  const normalized = sport?.toLowerCase() || ''

  if (
    normalized.includes('bike') ||
    normalized.includes('ride') ||
    normalized.includes('cycling')
  ) {
    return <Bike className="size-5" />
  }

  return <Footprints className="size-5" />
}

const getStatus = (fileData: FitFileData, t: Translations) => {
  switch (fileData.status) {
    case 'parsed':
      return {
        icon: <Check className="size-3.5" />,
        label: t.parsed,
        detail: t.parseSuccess,
        className: 'text-emerald-700',
        bubble: 'bg-emerald-100 text-emerald-700',
      }
    case 'error':
      return {
        icon: <CircleAlert className="size-3.5" />,
        label: t.error,
        detail: t.parseFailed,
        className: 'text-rose-700',
        bubble: 'bg-rose-100 text-rose-700',
      }
    case 'parsing':
      return {
        icon: <LoaderCircle className="size-3.5 animate-spin" />,
        label: t.parsing,
        detail: '',
        className: 'text-slate-600',
        bubble: 'bg-slate-100 text-slate-600',
      }
    default:
      return {
        icon: <LoaderCircle className="size-3.5" />,
        label: t.pending,
        detail: '',
        className: 'text-slate-600',
        bubble: 'bg-slate-100 text-slate-600',
      }
  }
}

export const FileListItem = ({
  fileData,
  onRemove,
  lang,
  t,
  showTrack = false,
  accent = 'emerald',
}: FileListItemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tone = accentStyles[accent]
  const date = formatActivityDate(fileData.metadata?.startTime, lang)
  const status = getStatus(fileData, t)

  useEffect(() => {
    const canvas = canvasRef.current
    const records = fileData.parsed?.messages?.recordMesgs

    if (!showTrack || !canvas || fileData.status !== 'parsed' || !records) {
      return
    }

    const drawTrack = () => {
      const context = canvas.getContext('2d')
      if (!context) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)

      const coordinates: [number, number][] = []
      records.forEach((record: any) => {
        const coordinate = getRecordCoordinate(record)
        if (coordinate) coordinates.push(coordinate)
      })

      if (coordinates.length < 2) return

      const centerLat =
        coordinates.reduce((sum, coordinate) => sum + coordinate[0], 0) / coordinates.length
      const longitudeScale = Math.cos((centerLat * Math.PI) / 180) || 1
      const projected = coordinates.map(([lat, lng]) => ({
        x: lng * longitudeScale,
        y: lat,
      }))

      const minX = Math.min(...projected.map((point) => point.x))
      const maxX = Math.max(...projected.map((point) => point.x))
      const minY = Math.min(...projected.map((point) => point.y))
      const maxY = Math.max(...projected.map((point) => point.y))
      const rangeX = maxX - minX || 1
      const rangeY = maxY - minY || 1
      const padding = Math.max(10, Math.min(rect.width, rect.height) * 0.08)
      const availableWidth = Math.max(1, rect.width - padding * 2)
      const availableHeight = Math.max(1, rect.height - padding * 2)
      const scaleX = availableWidth / rangeX
      const scaleY = availableHeight / rangeY

      context.strokeStyle = tone.shadowStroke
      context.lineWidth = 7
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.beginPath()

      projected.forEach((point, index) => {
        const x = padding + (point.x - minX) * scaleX
        const y = padding + availableHeight - (point.y - minY) * scaleY

        if (index === 0) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      })

      context.stroke()

      context.strokeStyle = tone.stroke
      context.lineWidth = 2.6
      context.beginPath()

      projected.forEach((point, index) => {
        const x = padding + (point.x - minX) * scaleX
        const y = padding + availableHeight - (point.y - minY) * scaleY

        if (index === 0) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      })

      context.stroke()

      const start = projected[0]
      const end = projected[projected.length - 1]
      ;[start, end].forEach((point) => {
        const x = padding + (point.x - minX) * scaleX
        const y = padding + availableHeight - (point.y - minY) * scaleY
        context.beginPath()
        context.arc(x, y, 2.6, 0, Math.PI * 2)
        context.fillStyle = tone.stroke
        context.fill()
      })
    }

    drawTrack()

    const resizeObserver = new ResizeObserver(drawTrack)
    resizeObserver.observe(canvas)

    return () => resizeObserver.disconnect()
  }, [accent, fileData, showTrack, tone.shadowStroke, tone.stroke])

  return (
    <motion.div
      className="w-full min-w-0"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative isolate min-h-[11.9rem] w-full min-w-0 overflow-hidden rounded-[1.15rem] border-border/70 bg-white/90 p-0 shadow-[0_14px_38px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:min-h-[14.4rem]',
          fileData.status === 'error' && 'border-rose-200 bg-rose-50/70'
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute -left-16 bottom-0 h-32 w-80 rounded-full blur-3xl',
            tone.glow
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-tr to-transparent',
            tone.wash
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.95)_46%,rgba(255,255,255,0.86)_100%)]" />

        {showTrack && fileData.status === 'parsed' && (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute bottom-2 left-0 h-[50%] w-[52%] opacity-55 [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.25)_26%,#000_48%)] sm:-bottom-1 sm:left-0 sm:h-[54%] sm:w-[43%]"
            aria-hidden="true"
          />
        )}

        <div className="relative px-4 py-4 sm:px-8 sm:py-7">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 size-10 rounded-xl border border-border/70 bg-white/82 text-slate-700 shadow-sm sm:right-6 sm:top-5 sm:size-11"
            onClick={onRemove}
            aria-label={`${t.removeFile}: ${fileData.name}`}
          >
            <Trash2 className="size-4" />
          </Button>

          <div className="flex min-w-0 items-start gap-4 pr-12 sm:gap-9">
            <span
              className={cn(
                'inline-flex size-14 shrink-0 items-center justify-center rounded-full sm:size-[4.35rem]',
                tone.icon
              )}
            >
              <span className="sm:[&_svg]:size-6">{getSportIcon(fileData.metadata?.sport)}</span>
            </span>
            <div className="min-w-0 pt-1">
              <h4 className="truncate text-[1.05rem] font-bold leading-tight text-slate-950 sm:text-[1.5rem]">
                {fileData.name}
              </h4>
              <p className="mt-2 truncate text-sm font-medium text-slate-600 sm:text-[1.18rem]">
                {getActivityLabel(fileData.metadata?.sport)}
              </p>
            </div>
          </div>

          <div className="mt-7 grid max-w-full grid-cols-[minmax(0,1.15fr)_minmax(0,0.75fr)_minmax(0,1.1fr)] divide-x divide-slate-200/80 overflow-hidden pl-[4.15rem] text-[0.78rem] sm:mt-9 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,1fr)] sm:pl-[11rem] sm:text-base">
            <div className="min-w-0 pr-2 sm:pr-3">
              <div className="flex min-w-0 items-start gap-1.5 sm:gap-2">
                <Calendar className="mt-0.5 size-3.5 shrink-0 text-slate-500 sm:size-5" />
                <span className="min-w-0">
                  <span className="block whitespace-nowrap font-bold leading-5 text-slate-900">
                    {date.date}
                  </span>
                  <span className="mt-1 block whitespace-nowrap text-xs font-semibold text-slate-500 sm:text-sm">
                    {date.time}
                  </span>
                </span>
              </div>
            </div>

            <div className="min-w-0 px-2 sm:px-3">
              <div className="flex min-w-0 items-start gap-1.5 sm:gap-2">
                <Clock3 className="mt-0.5 size-3.5 shrink-0 text-slate-500 sm:size-5" />
                <span className="min-w-0">
                  <span className="block truncate font-bold leading-5 text-slate-900">
                    {formatClockDuration(fileData.metadata?.duration)}
                  </span>
                  <span className="mt-1 block truncate text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.duration}
                  </span>
                </span>
              </div>
            </div>

            <div className="min-w-0 pl-2 sm:pl-3">
              <div className="flex min-w-0 items-start gap-1.5 sm:gap-2">
                <MapPinned className="mt-0.5 size-3.5 shrink-0 text-slate-500 sm:size-5" />
                <span className="min-w-0">
                  <span className="block truncate font-bold leading-5 text-slate-900">
                    {formatDistance(fileData.metadata?.distance)}
                  </span>
                  <span className="mt-1 block truncate text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.distance}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end sm:mt-8">
            <div className={cn('flex items-center gap-3 text-sm font-bold sm:text-lg', status.className)}>
              <span
                className={cn(
                  'inline-flex size-7 items-center justify-center rounded-full sm:size-9',
                  status.bubble
                )}
              >
                {status.icon}
              </span>
              <span>
                <span className="block leading-5">{status.label}</span>
                {status.detail && (
                  <span className="block text-xs font-semibold leading-4 text-slate-500">
                    {status.detail}
                  </span>
                )}
              </span>
            </div>
          </div>

          {fileData.status === 'error' && fileData.error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-white/72 px-4 py-3 text-sm font-medium text-rose-700">
              {fileData.error}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
