import React, { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import LoadingSpinner from '../common/LoadingSpinner'
import { customerService } from '../../services/customer'

// Fix default marker icons in Leaflet when using bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const defaultCenter = [20.5937, 78.9629] // India centroid fallback

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const SalonMap = ({ onNavigateNearest }) => {
  const [loading, setLoading] = useState(true)
  const [salons, setSalons] = useState([])
  const [center, setCenter] = useState(defaultCenter)
  const [geoResolved, setGeoResolved] = useState([])

  // Leaflet refs
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const markersLayerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await customerService.getSalonLocations()
        const items = res?.data || []
        setSalons(items)

        // Start with salons that already have coords
        const initial = items.filter(x => typeof x.lat === 'number' && typeof x.lng === 'number' && !Number.isNaN(x.lat) && !Number.isNaN(x.lng))
        let resolved = [...initial]

        // Geocode up to 10 entries that have address but no coords (best-effort)
        const toGeocode = items.filter(x => (!x.lat && !x.lng) && x.address)
        const limited = toGeocode.slice(0, 10)
        for (let i = 0; i < limited.length; i++) {
          const s = limited[i]
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(s.address)}`
            const resp = await fetch(url, { headers: { 'Accept': 'application/json' } })
            const data = await resp.json()
            if (Array.isArray(data) && data.length > 0) {
              const lat = Number(data[0].lat)
              const lng = Number(data[0].lon)
              if (Number.isFinite(lat) && Number.isFinite(lng)) {
                resolved.push({ ...s, lat, lng })
              }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 250))
        }

        setGeoResolved(resolved)
        if (resolved.length > 0) setCenter([resolved[0].lat, resolved[0].lng])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapRef.current && mapElRef.current) {
      mapRef.current = L.map(mapElRef.current).setView(center, 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current)
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current)
    }
  }, [center])

  // Update markers when coordinates list changes
  useEffect(() => {
    const map = mapRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const withCoords = (geoResolved.length > 0 ? geoResolved : salons).filter(x => typeof x.lat === 'number' && typeof x.lng === 'number')
    withCoords.forEach((s) => {
      const marker = L.marker([s.lat, s.lng])
      const html = `<div class="text-sm"><div class="font-semibold">${s.name ?? ''}</div>${s.address ? `<div class=\"text-gray-600 mt-1\">${s.address}</div>` : ''}</div>`
      marker.bindPopup(html)
      marker.addTo(layer)
    })
    if (withCoords.length > 0) {
      map.setView([withCoords[0].lat, withCoords[0].lng], 12)
    }
  }, [geoResolved, salons])

  if (loading) return <LoadingSpinner text="Loading map..." />

  const withCoordsForNearest = (geoResolved.length > 0 ? geoResolved : salons).filter(x => typeof x.lat === 'number' && typeof x.lng === 'number')

  if (!salons || salons.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-600">
        No salons registered yet
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="h-96">
        {withCoordsForNearest.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-gray-600">
            No salon coordinates available to display on map
          </div>
        ) : (
          <div ref={mapElRef} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
      {onNavigateNearest && (
        <div className="p-3 border-t flex justify-end">
          <button
            onClick={async () => {
              try {
                if (!salons || salons.length === 0) {
                  alert('No salons registered yet')
                  return
                }
                if (!navigator.geolocation) {
                  alert('Geolocation not supported in this browser')
                  return
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const { latitude, longitude } = pos.coords
                    let min = { d: Infinity, s: null }
                    withCoordsForNearest.forEach((x) => {
                      const d = haversineKm(latitude, longitude, x.lat, x.lng)
                      if (d < min.d) min = { d, s: x }
                    })
                    if (!min.s) {
                      alert('No salons available')
                      return
                    }
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${min.s.lat},${min.s.lng}`
                    window.open(url, '_blank')
                  },
                  () => alert('Unable to get your location')
                )
              } catch (e) {
                console.error(e)
                alert('Failed to navigate to nearest salon')
              }
            }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Browse Salon (Nearest)
          </button>
        </div>
      )}
    </div>
  )
}

export default SalonMap


