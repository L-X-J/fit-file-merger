import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Activity, Map as MapIcon, Mountain, Route, Timer, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDistance, formatDuration } from '@/lib/fitParser'
import { getRecordCoordinate } from '@/lib/coordinates'
import type { Translations } from '@/lib/i18n'
import type { FitFileData } from '@/lib/types'

const TRACK_COLORS = ['#2f6df6', '#0f8f77', '#ea580c', '#8b5cf6', '#d946ef', '#d97706']

interface TrackMapProps {
  files: FitFileData[]
  onClose?: () => void
  t: Translations
  inline?: boolean
  minimal?: boolean
  staticPreview?: boolean
}

export const TrackMap = ({
  files,
  onClose,
  t,
  inline = false,
  minimal = false,
  staticPreview = false,
}: TrackMapProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const parsedFiles = useMemo(
    () => files.filter((file) => file.status === 'parsed' && file.parsed?.messages?.recordMesgs),
    [files]
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([18, 0], 2)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      layerGroupRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()
    const allCoordinates: L.LatLngTuple[] = []

    parsedFiles.forEach((file, index) => {
      const coordinates: L.LatLngTuple[] = []
      file.parsed.messages.recordMesgs.forEach((record: any) => {
        const coordinate = getRecordCoordinate(record)
        if (coordinate) {
          coordinates.push(coordinate)
          allCoordinates.push(coordinate)
        }
      })

      if (coordinates.length === 0) return

      const color = minimal ? '#0f6ff1' : TRACK_COLORS[index % TRACK_COLORS.length]

      const polyline = L.polyline(coordinates, {
        color,
        weight: minimal ? 5 : 4,
        opacity: minimal ? 0.92 : 0.82,
      }).addTo(layerGroup)

      if (!minimal) {
        L.circleMarker(coordinates[0], {
          radius: 6,
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: 1,
        }).addTo(layerGroup)

        L.circleMarker(coordinates[coordinates.length - 1], {
          radius: 5,
          color,
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 1,
        }).addTo(layerGroup)
      }

      const popupContent = `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 180px;">
          <strong>${file.name}</strong><br />
          ${file.metadata?.distance ? `${t.distance}: ${formatDistance(file.metadata.distance)}` : ''}<br />
          ${file.metadata?.duration ? `${t.duration}: ${formatDuration(file.metadata.duration)}` : ''}
        </div>
      `
      polyline.bindPopup(popupContent)
    })

    if (minimal && allCoordinates.length > 0) {
      L.marker(allCoordinates[0], {
        icon: L.divIcon({
          className: 'map-start-marker',
          html: '<span></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(layerGroup)

      L.marker(allCoordinates[allCoordinates.length - 1], {
        icon: L.divIcon({
          className: 'map-end-marker',
          html: '<span></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(layerGroup)
    }

    if (allCoordinates.length > 0) {
      map.fitBounds(L.latLngBounds(allCoordinates), { padding: [36, 36] })
    } else {
      map.setView([18, 0], 2)
    }

    window.setTimeout(() => map.invalidateSize(), 50)
  }, [minimal, parsedFiles, t.distance, t.duration])

  const stats = useMemo(() => {
    let totalDistance = 0
    let totalTime = 0
    let totalMovingTime = 0
    let maxSpeed = 0
    let totalElevation = 0
    let maxPower = 0
    let totalPowerSamples = 0
    let powerSum = 0

    parsedFiles.forEach((file) => {
      if (file.metadata) {
        totalDistance += file.metadata.distance || 0
        totalTime += file.metadata.duration || 0
        totalElevation += file.metadata.totalAscent || 0
      }

      const session = file.parsed?.messages?.sessionMesgs?.[0]
      if (session) {
        totalMovingTime += session.totalTimerTime || 0
        if (session.maxSpeed) maxSpeed = Math.max(maxSpeed, session.maxSpeed)
        if (session.maxPower) maxPower = Math.max(maxPower, session.maxPower)
        if (session.avgPower && session.totalTimerTime) {
          powerSum += session.avgPower * session.totalTimerTime
          totalPowerSamples += session.totalTimerTime
        }
      }

      file.parsed?.messages?.recordMesgs?.forEach((record: any) => {
        if (record.power !== undefined && record.power !== null && record.power > 0) {
          maxPower = Math.max(maxPower, record.power)
        }
      })
    })

    const avgSpeed = totalMovingTime > 0 ? totalDistance / (totalMovingTime / 3600) : 0
    const avgPower = totalPowerSamples > 0 ? powerSum / totalPowerSamples : 0

    return {
      totalDistance,
      totalTime,
      totalMovingTime,
      avgSpeed,
      maxSpeed,
      totalElevation,
      avgPower,
      maxPower,
    }
  }, [parsedFiles])

  const statTiles = [
    {
      label: t.totalDistance,
      value: formatDistance(stats.totalDistance),
      icon: <Route className="size-4 text-primary" />,
    },
    {
      label: t.totalTime,
      value: formatDuration(stats.totalTime),
      icon: <Timer className="size-4 text-primary" />,
    },
    {
      label: t.movingTime,
      value: formatDuration(stats.totalMovingTime),
      icon: <Activity className="size-4 text-primary" />,
    },
    {
      label: t.elevation,
      value: `${stats.totalElevation.toFixed(0)} m`,
      icon: <Mountain className="size-4 text-primary" />,
    },
  ]

  const legendFiles = parsedFiles.map((file, index) => ({
    id: file.id,
    name: file.name,
    color: TRACK_COLORS[index % TRACK_COLORS.length],
  }))

  const mapContent = (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-background/85">
        <div ref={containerRef} className="min-h-[320px] w-full lg:min-h-[540px]" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {statTiles.map((tile) => (
            <div key={tile.label} className="map-stat-tile">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10">
                {tile.icon}
              </div>
              <p className="text-xs text-muted-foreground">{tile.label}</p>
              <p className="mt-1 text-lg font-semibold">{tile.value}</p>
            </div>
          ))}

          {stats.avgPower > 0 && (
            <div className="map-stat-tile">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="size-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{t.avgPower}</p>
              <p className="mt-1 text-lg font-semibold">{stats.avgPower.toFixed(0)} W</p>
            </div>
          )}

          {stats.maxPower > 0 && (
            <div className="map-stat-tile">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="size-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{t.maxPower}</p>
              <p className="mt-1 text-lg font-semibold">{stats.maxPower.toFixed(0)} W</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{t.uploadedFiles}</p>
            <Badge variant="secondary">{legendFiles.length}</Badge>
          </div>

          {legendFiles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {legendFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/65 bg-background/85 px-3 py-3 text-sm"
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: file.color }}
                  />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-background/75 px-4 py-5 text-sm text-muted-foreground">
              {t.noTrackDescription}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (inline) {
    if (minimal) {
      if (staticPreview) {
        return (
          <div className="merged-map overflow-hidden rounded-xl border border-border/70 bg-white/85 shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
            <img
              src="/reference-map-preview.png"
              alt={t.mergedTrack}
              className="h-[380px] w-full object-cover"
            />
          </div>
        )
      }

      return (
        <div className="merged-map overflow-hidden rounded-xl border border-border/70 bg-white/85 shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
          <div className="min-h-[340px] w-full lg:min-h-[380px]" ref={containerRef} />
        </div>
      )
    }

    return (
      <Card className="panel-surface overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <MapIcon />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle>{t.previewTitle}</CardTitle>
              <CardDescription>
                {parsedFiles.length > 0 ? t.previewDescription : t.noTrackData}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {parsedFiles.length > 0 ? (
            mapContent
          ) : (
            <div className="rounded-[28px] border border-dashed border-border/80 bg-muted/35 px-6 py-14 text-center">
              <p className="text-base font-medium">{t.noTrackData}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.noTrackDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 p-4 backdrop-blur-sm">
      <Card className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                <MapIcon />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>{t.mapView}</CardTitle>
                <CardDescription>{t.previewDescription}</CardDescription>
              </div>
            </div>
            {onClose && (
              <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                <X />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-6">{mapContent}</CardContent>
      </Card>
    </div>
  )
}
