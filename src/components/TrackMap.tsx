import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import { FitFileData } from '@/lib/types'
import { formatDistance, formatDuration } from '@/lib/fitParser'
import type { Language } from '@/lib/i18n'

interface TrackMapProps {
  files: FitFileData[]
  onClose?: () => void
  lang: Language
  t: any
  inline?: boolean
}

export const TrackMap = ({ files, onClose, lang, t, inline = false }: TrackMapProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView([0, 0], 2)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const allCoords: L.LatLngTuple[] = []
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

    files.forEach((file, index) => {
      if (file.status === 'parsed' && file.parsed?.records) {
        const coords: L.LatLngTuple[] = []
        
        file.parsed.records.forEach((record: any) => {
          if (record.position_lat !== undefined && record.position_long !== undefined) {
            const lat = record.position_lat
            const lng = record.position_long
            coords.push([lat, lng])
            allCoords.push([lat, lng])
          }
        })

        if (coords.length > 0) {
          const polyline = L.polyline(coords, {
            color: colors[index % colors.length],
            weight: 3,
            opacity: 0.7
          }).addTo(map)

          const startMarker = L.circleMarker(coords[0], {
            radius: 8,
            fillColor: colors[index % colors.length],
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map)

          const endMarker = L.circleMarker(coords[coords.length - 1], {
            radius: 6,
            fillColor: '#fff',
            color: colors[index % colors.length],
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map)

          const popupContent = `
            <div style="font-family: 'Space Grotesk', sans-serif;">
              <strong>${file.name}</strong><br/>
              ${file.metadata?.distance ? `${t.distance}: ${formatDistance(file.metadata.distance)}` : ''}<br/>
              ${file.metadata?.duration ? `${t.duration}: ${formatDuration(file.metadata.duration)}` : ''}
            </div>
          `
          polyline.bindPopup(popupContent)
          startMarker.bindPopup(popupContent)
        }
      }
    })

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords)
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [files, t, lang])

  const calculateStats = () => {
    let totalDistance = 0
    let totalTime = 0
    let totalMovingTime = 0
    let maxSpeed = 0
    let totalElevation = 0
    let maxPower = 0
    let totalPowerReadings = 0
    let powerSum = 0

    files.forEach(file => {
      if (file.status === 'parsed' && file.metadata) {
        totalDistance += file.metadata.distance || 0
        totalTime += file.metadata.duration || 0
      }

      let fileElevationAdded = false

      if (file.parsed?.sessions?.[0]) {
        const session = file.parsed.sessions[0]
        totalMovingTime += session.total_timer_time || 0
        if (session.max_speed) {
          maxSpeed = Math.max(maxSpeed, session.max_speed)
        }
        if (session.max_power) {
          maxPower = Math.max(maxPower, session.max_power)
        }
        if (session.avg_power) {
          powerSum += session.avg_power * (session.total_timer_time || 0)
          totalPowerReadings += session.total_timer_time || 0
        }

        if (session.total_ascent !== undefined && session.total_ascent !== null && session.total_ascent > 0) {
          totalElevation += session.total_ascent
          fileElevationAdded = true
        }
      }

      if (!fileElevationAdded && file.parsed?.records) {
        const elevations: number[] = []
        const powers: number[] = []
        
        file.parsed.records.forEach((record: any) => {
          if (record.altitude !== undefined && record.altitude !== null) {
            elevations.push(record.altitude)
          }
          if (record.power !== undefined && record.power !== null && record.power > 0) {
            powers.push(record.power)
          }
        })

        if (elevations.length > 1) {
          let fileElevationGain = 0
          for (let i = 1; i < elevations.length; i++) {
            const diff = elevations[i] - elevations[i - 1]
            if (diff > 0) {
              fileElevationGain += diff
            }
          }
          totalElevation += fileElevationGain
        }

        if (powers.length > 0 && maxPower === 0) {
          maxPower = Math.max(...powers)
        }
      } else if (file.parsed?.records) {
        const powers: number[] = []
        
        file.parsed.records.forEach((record: any) => {
          if (record.power !== undefined && record.power !== null && record.power > 0) {
            powers.push(record.power)
          }
        })

        if (powers.length > 0 && maxPower === 0) {
          maxPower = Math.max(...powers)
        }
      }
    })

    const avgSpeed = totalMovingTime > 0 ? (totalDistance / (totalMovingTime / 3600)) : 0
    const avgPower = totalPowerReadings > 0 ? powerSum / totalPowerReadings : 0

    return { 
      totalDistance, 
      totalTime, 
      totalMovingTime, 
      avgSpeed, 
      maxSpeed, 
      totalElevation,
      avgPower,
      maxPower 
    }
  }

  const stats = calculateStats()

  const mapContent = (
    <>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div ref={containerRef} className="flex-1 min-h-[300px] lg:min-h-[500px]" />

        <div className="lg:w-80 p-4 border-t lg:border-t-0 lg:border-l space-y-4 overflow-y-auto">
          <div>
            <h3 className="font-semibold mb-3">{t.mergedTrack}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground">{t.totalDistance}</p>
                <p className="text-lg font-semibold">{formatDistance(stats.totalDistance)}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground">{t.totalTime}</p>
                <p className="text-lg font-semibold">{formatDuration(stats.totalTime)}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground">{t.movingTime}</p>
                <p className="text-lg font-semibold">{formatDuration(stats.totalMovingTime)}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground">{t.avgSpeed}</p>
                <p className="text-lg font-semibold">{stats.avgSpeed.toFixed(1)} km/h</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground">{t.maxSpeed}</p>
                <p className="text-lg font-semibold">{(stats.maxSpeed * 3.6).toFixed(1)} km/h</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-xs text-muted-foreground">{t.elevation}</p>
                <p className="text-lg font-semibold">{stats.totalElevation.toFixed(0)} m</p>
              </div>
              {stats.avgPower > 0 && (
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">{lang === 'zh' ? '平均功率' : 'Avg Power'}</p>
                  <p className="text-lg font-semibold">{stats.avgPower.toFixed(0)} W</p>
                </div>
              )}
              {stats.maxPower > 0 && (
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">{lang === 'zh' ? '最大功率' : 'Max Power'}</p>
                  <p className="text-lg font-semibold">{stats.maxPower.toFixed(0)} W</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">{t.uploadedFiles} ({files.length})</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 6] }}
                  />
                  <span className="flex-1 truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (inline) {
    return (
      <Card className="w-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{t.mapView}</h3>
        </div>
        {mapContent}
      </Card>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{t.mapView}</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          )}
        </div>
        {mapContent}
      </Card>
    </div>
  )
}
