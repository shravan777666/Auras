import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
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

const SalonMap = ({ onNavigateNearest, onUserLocation, salons: propSalons }) => {
  const [loading, setLoading] = useState(true)
  const [salons, setSalons] = useState(propSalons || [])
  const [center, setCenter] = useState(defaultCenter)
  const [geoResolved, setGeoResolved] = useState([])
  const [userMarker, setUserMarker] = useState(null)
  const [error, setError] = useState(null)
  
  // Filter salons with valid coordinates
  const withCoords = useMemo(() => {
    return (geoResolved.length > 0 ? geoResolved : salons).filter(x => typeof x.lat === 'number' && typeof x.lng === 'number');
  }, [geoResolved, salons]);

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

  // Update salons when prop changes
  useEffect(() => {
    if (propSalons && propSalons.length > 0) {
      setSalons(propSalons);
    }
  }, [propSalons]);

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

        // Fetch salon locations only if not provided as props
        let items = []
        if (propSalons && propSalons.length > 0) {
          items = propSalons
        } else {
          const res = await customerService.getSalonLocations()
          items = res?.data || []
        }
        
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Function to create popup content with salon name, services, and action buttons
  const createPopupContent = useCallback((salon) => {
    // For now, we'll show basic salon info without services since the salon data
    // from getSalonLocations() doesn't include services. We can enhance this later
    // by fetching services on demand or including them in the salon data.
    const salonName = salon.name || salon.salonName || 'Salon';
    
    // Escape HTML special characters to prevent rendering issues
    const escapeHtml = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    const safeSalonName = escapeHtml(salonName);
    const safeAddress = salon.address ? escapeHtml(salon.address) : '';
    const safePhone = salon.phone ? escapeHtml(salon.phone) : '';
    
    // Create complete popup HTML
    const popupContent = `
      <div style="min-width: 280px; max-width: 380px; font-family: system-ui, -apple-system, sans-serif;">
        <h3 style="font-weight: bold; font-size: 1.25rem; margin: 0 0 0.5rem 0; color: #1f2937; line-height: 1.3;">${safeSalonName}</h3>
        ${safeAddress ? `<p style="color: #6b7280; font-size: 0.875rem; margin: 0 0 0.5rem 0; line-height: 1.4;">📍 ${safeAddress}</p>` : ''}
        ${safePhone ? `<p style="color: #6b7280; font-size: 0.875rem; margin: 0 0 0.75rem 0;">📞 ${safePhone}</p>` : ''}
        <p style="color: #9ca3af; font-size: 0.875rem; margin-bottom: 1rem; font-style: italic; margin-top: 0.5rem;">Click "View Details" to see available services</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <a href="/customer/salon/${salon._id}" style="padding: 0.625rem 1rem; background-color: #2563eb; color: white; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; text-decoration: none; display: inline-block; text-align: center; flex: 1; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">View Details</a>
          <a href="/customer/book-appointment/${salon._id}" style="padding: 0.625rem 1rem; background-color: #16a34a; color: white; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; text-decoration: none; display: inline-block; text-align: center; flex: 1; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#15803d'" onmouseout="this.style.backgroundColor='#16a34a'">Book Now</a>
        </div>
      </div>
    `;
    
    return popupContent;
  }, [])

  // Initialize map and update markers when data is available
  useEffect(() => {
    if (withCoords.length > 0 && mapElRef.current) {
      try {
        // Initialize map if not already created
        if (!mapRef.current) {
          mapRef.current = L.map(mapElRef.current).setView(center, 12)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
          }).addTo(mapRef.current)
          markersLayerRef.current = L.layerGroup().addTo(mapRef.current)
        }
        
        // Update markers
        const map = mapRef.current
        const layer = markersLayerRef.current
        if (map && layer) {
          layer.clearLayers()
          withCoords.forEach((s) => {
            try {
              const marker = L.marker([s.lat, s.lng])
              
              // Create popup content
              const popupContent = createPopupContent(s);
              
              // Bind popup
              marker.bindPopup(popupContent, { 
                maxWidth: 400,
                minWidth: 280,
                maxHeight: 400,
                autoPan: true,
                closeButton: true,
                autoClose: false,
                className: 'salon-info-popup'
              });
              
              marker.addTo(layer)
            } catch (markerError) {
              console.warn('Error creating marker for salon:', s.name, markerError)
            }
          })
          
          // Center map appropriately
          if (center && center[0] !== defaultCenter[0] && center[1] !== defaultCenter[1]) {
            map.setView(center, 14)
          } else {
            map.setView([withCoords[0].lat, withCoords[0].lng], 12)
          }
        }
      } catch (mapError) {
        console.error('Error initializing/updating map:', mapError)
        setError('Failed to initialize map. Please try again later.')
      }
    }
  }, [withCoords, center, createPopupContent]); // Depend on actual data and center

  // Update map view when center changes (for user location updates)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
      
      // Add/update user location marker
      const map = mapRef.current;
      if (center && center[0] !== defaultCenter[0] && center[1] !== defaultCenter[1]) {
        try {
          // Remove existing user marker if it exists
          if (userMarker) {
            userMarker.remove();
          }
          
          const newUserMarker = L.marker(center, {
            title: 'Your Location'
          }).addTo(map);
          newUserMarker.bindPopup('<b>Your Current Location</b>');
          setUserMarker(newUserMarker);
        } catch (userMarkerError) {
          console.warn('Error creating user location marker:', userMarkerError);
        }
      }
    }
  }, [center, userMarker]); // Depend on center and userMarker

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
        {withCoords.length === 0 ? (
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
                    withCoords.forEach((x) => {
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