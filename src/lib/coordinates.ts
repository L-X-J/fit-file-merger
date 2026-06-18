export type Coordinate = [number, number]

const SEMICIRCLES_TO_DEGREES = 180 / 2 ** 31

export const getRecordCoordinate = (record: any): Coordinate | null => {
  if (record.positionLat === undefined || record.positionLong === undefined) {
    return null
  }

  const rawLat = Number(record.positionLat)
  const rawLng = Number(record.positionLong)

  if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) {
    return null
  }

  const lat = Math.abs(rawLat) > 90 ? rawLat * SEMICIRCLES_TO_DEGREES : rawLat
  const lng = Math.abs(rawLng) > 180 ? rawLng * SEMICIRCLES_TO_DEGREES : rawLng

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null
  }

  return [lat, lng]
}
