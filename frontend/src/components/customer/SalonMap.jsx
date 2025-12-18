import React, { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import LoadingSpinner from '../common/LoadingSpinner'
import { customerService } from '../../services/customer'
import { Link } from 'react-router-dom'

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

const SalonMap = ({ onNavigateNearest, onUserLocation }) => {
  const [loading, setLoading] = useState(true)
  const [salons, setSalons] = useState([])
  const [center, setCenter] = useState(defaultCenter)
  const [geoResolved, setGeoResolved] = useState([])
  const [userMarker, setUserMarker] = useState(null)
  const [error, setError] = useState(null)
  
  // Filter salons with valid coordinates
  const withCoordsForNearest = (geoResolved.length > 0 ? geoResolved : salons).filter(x => typeof x.lat === 'number' && typeof x.lng === 'number');

  // Leaflet refs
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const markersLayerRef = useRef(null)

  // Get user's current location
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          resolve({ lat: latitude, lng: longitude })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  useEffect(() => {
    const load = async () => {
      try {
        // Get user's current location
        try {
          const userLoc = await getUserLocation()
          setCenter([userLoc.lat, userLoc.lng])
          
          // Notify parent component of user's location
          if (onUserLocation) {
            onUserLocation(userLoc)
          }
        } catch (error) {
          console.warn('Could not get user location:', error.message)
        }

        // Fetch salon locations
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
            const resp = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'AuraCares-Salon-Finder/1.0' } })
            const data = await resp.json()
            if (Array.isArray(data) && data.length > 0) {
              const lat = Number(data[0].lat)
              const lng = Number(data[0].lon)
              if (Number.isFinite(lat) && Number.isFinite(lng)) {
                resolved.push({ ...s, lat, lng })
              }
            }
          } catch (geoError) {
            console.warn('Geocoding failed for salon:', s.name, geoError)
          }
          await new Promise(r => setTimeout(r, 250))
        }

        setGeoResolved(resolved)
      } catch (err) {
        console.error('Error loading map data:', err)
        setError('Failed to load salon locations. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Function to fetch salon services and create popup content
  const fetchSalonServices = async (salon) => {
    try {
      const response = await customerService.getSalonServices(salon._id)
      const services = response?.data || []
      
      // Create popup content with salon name, services, and action buttons
      let popupContent = `
        <div class="salon-popup">
          <h3 class="font-bold text-lg mb-2">${salon.name || 'Salon'}</h3>
          ${salon.address ? `<p class="text-gray-600 text-sm mb-2">${salon.address}</p>` : ''}
      `
      
      if (services.length > 0) {
        popupContent += '<div class="mb-3"><h4 class="font-semibold text-md mb-1">Services:</h4><ul class="list-disc pl-5">'
        services.slice(0, 5).forEach(service => {
          popupContent += `<li class="text-sm">${service.name} - ₹${service.price}</li>`
        })
        if (services.length > 5) {
          popupContent += `<li class="text-sm">+${services.length - 5} more services</li>`
        }
        popupContent += '</ul></div>'
      } else {
        popupContent += '<p class="text-gray-500 text-sm mb-3">No services available</p>'
      }
      
      popupContent += `
        <div class="flex gap-2 mt-2">
          <a href="/customer/salon/${salon._id}" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">View Salon</a>
          <a href="/customer/book-appointment/${salon._id}" class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Book Now</a>
        </div>
        </div>
      `
      
      return popupContent
    } catch (error) {
      console.error('Error fetching salon services:', error)
      return `
        <div class="salon-popup">
          <h3 class="font-bold text-lg mb-2">${salon.name || 'Salon'}</h3>
          ${salon.address ? `<p class="text-gray-600 text-sm mb-2">${salon.address}</p>` : ''}
          <p class="text-red-500 text-sm">Failed to load services</p>
          <div class="flex gap-2 mt-2">
            <a href="/customer/salon/${salon._id}" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">View Salon</a>
            <a href="/customer/book-appointment/${salon._id}" class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Book Now</a>
          </div>
        </div>
      `
    }
  }

  useEffect(() => {
    if (withCoordsForNearest.length > 0 && !mapRef.current && mapElRef.current) {
      try {
        mapRef.current = L.map(mapElRef.current).setView(center, 12)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(mapRef.current)
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current)
      } catch (mapError) {
        console.error('Error initializing map:', mapError)
        setError('Failed to initialize map. Please try again later.')
      }
    }
    
    // Update map view when center changes
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom())
    }
  }, [center, withCoordsForNearest]);

  // Update markers when coordinates list changes
  useEffect(() => {
    const map = mapRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return
    
    try {
      layer.clearLayers()
      const withCoords = (geoResolved.length > 0 ? geoResolved : salons).filter(x => typeof x.lat === 'number' && typeof x.lng === 'number')
      withCoords.forEach((s) => {
        try {
          const marker = L.marker([s.lat, s.lng])
          
          // Bind popup with loading state
          marker.bindPopup('<div class="text-sm">Loading...</div>', { maxWidth: 300 })
          
          // Add click event to fetch services and update popup
          marker.on('click', async function() {
            const popupContent = await fetchSalonServices(s)
            marker.getPopup().setContent(popupContent)
            marker.openPopup()
          })
          
          marker.addTo(layer)
        } catch (markerError) {
          console.warn('Error creating marker for salon:', s.name, markerError)
        }
      })
      
      // Add user location marker if available
      if (center && center[0] !== defaultCenter[0] && center[1] !== defaultCenter[1]) {
        try {
          // Remove existing user marker if it exists
          if (userMarker) {
            userMarker.remove()
          }
          
          const newUserMarker = L.marker(center, {
            title: 'Your Location'
          }).addTo(map)
          newUserMarker.bindPopup('<b>Your Current Location</b>').openPopup()
          setUserMarker(newUserMarker)
        } catch (userMarkerError) {
          console.warn('Error creating user location marker:', userMarkerError)
        }
      }
      
      // Center map on user location or first salon
      if (center && center[0] !== defaultCenter[0] && center[1] !== defaultCenter[1]) {
        map.setView(center, 14)
      } else if (withCoords.length > 0) {
        map.setView([withCoords[0].lat, withCoords[0].lng], 12)
      }
    } catch (updateError) {
      console.error('Error updating map markers:', updateError)
      setError('Failed to update map markers. Please try again later.')
    }
  }, [geoResolved, salons, center, userMarker])

  if (loading) return <LoadingSpinner text="Loading map..." />

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-red-600">
        {error}
      </div>
    )
  }

  // Removed duplicate declaration of withCoordsForNearest
  
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