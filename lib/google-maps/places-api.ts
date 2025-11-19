/**
 * Integración con Google Places API para obtener información de cafeterías
 */

interface PlaceDetails {
  name: string
  formatted_address: string
  formatted_phone_number?: string
  website?: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  opening_hours?: {
    periods?: Array<{
      close?: { day: number; time: string }
      open: { day: number; time: string }
    }>
    weekday_text?: string[]
  }
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  rating?: number
  reviews?: Array<{
    text: string
    rating: number
  }>
  url?: string
}

interface PlacesApiResponse {
  result: PlaceDetails
  status: string
}

/**
 * Busca un lugar por su Place ID usando Google Places API
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY no está configurada')
  }

  try {
    console.log('🔍 Buscando detalles del lugar con Place ID:', placeId)

    const fields = [
      'name',
      'formatted_address',
      'formatted_phone_number',
      'website',
      'geometry',
      'opening_hours',
      'photos',
      'rating',
      'reviews',
      'url'
    ].join(',')

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}&language=es`

    console.log('📍 URL de la API:', url.replace(apiKey, 'HIDDEN'))

    const response = await fetch(url)
    const data: PlacesApiResponse = await response.json()

    console.log('📊 Respuesta de Google Places API:', { status: data.status })

    if (data.status === 'OK' && data.result) {
      return data.result
    }

    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No se encontró información para esta ubicación')
    }

    if (data.status === 'INVALID_REQUEST') {
      throw new Error(`Place ID inválido: ${placeId}. Verifica que la URL de Google Maps sea correcta.`)
    }

    throw new Error(`Error de Google Places API: ${data.status}`)
  } catch (error) {
    console.error('❌ Error fetching place details:', error)
    throw error
  }
}

/**
 * Busca un lugar por CID (Customer ID) de Google Maps
 */
export async function findPlaceByCid(cid: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY no está configurada')
  }

  try {
    // Convertir CID a Place ID requiere una búsqueda
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${cid}&inputtype=textquery&fields=place_id&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id
    }

    return null
  } catch (error) {
    console.error('Error finding place by CID:', error)
    return null
  }
}

/**
 * Busca un lugar cercano a coordenadas específicas usando Nearby Search
 * (más preciso que findplacefromtext cuando tenemos coordenadas exactas)
 */
export async function findPlaceByNearbySearch(lat: number, lng: number, name: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY no está configurada')
  }

  try {
    console.log('🎯 Buscando lugar cercano con Nearby Search:', { lat, lng, name })

    // Usar Nearby Search con radio pequeño (50m) para mayor precisión
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&keyword=${encodeURIComponent(name)}&key=${apiKey}&language=es`

    console.log('🌐 URL de Nearby Search:', searchUrl.replace(apiKey, 'HIDDEN'))

    const response = await fetch(searchUrl)
    const data = await response.json()

    console.log('📊 Resultado de Nearby Search:', {
      status: data.status,
      resultsCount: data.results?.length,
      firstResult: data.results?.[0]?.name
    })

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Si hay múltiples resultados, buscar coincidencia de nombre más cercana
      const exactMatch = data.results.find((result: any) =>
        result.name.toLowerCase().trim() === name.toLowerCase().trim()
      )

      if (exactMatch) {
        console.log('✅ Coincidencia exacta encontrada:', exactMatch.name, exactMatch.place_id)
        return exactMatch.place_id
      }

      // Si no hay coincidencia exacta, buscar coincidencia parcial
      const partialMatch = data.results.find((result: any) =>
        result.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(result.name.toLowerCase())
      )

      if (partialMatch) {
        console.log('✅ Coincidencia parcial encontrada:', partialMatch.name, partialMatch.place_id)
        return partialMatch.place_id
      }

      // Si no hay coincidencia, tomar el primer resultado (más cercano)
      console.log('⚠️ Sin coincidencia exacta, usando el más cercano:', data.results[0].name)
      return data.results[0].place_id
    }

    // Si no encontramos nada en 50m, intentar con radio más amplio (200m)
    if (data.status === 'ZERO_RESULTS') {
      console.log('🔄 Ampliando búsqueda a 200m...')
      const widerSearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=200&keyword=${encodeURIComponent(name)}&key=${apiKey}&language=es`

      const widerResponse = await fetch(widerSearchUrl)
      const widerData = await widerResponse.json()

      console.log('📊 Resultado de búsqueda ampliada:', {
        status: widerData.status,
        resultsCount: widerData.results?.length
      })

      if (widerData.status === 'OK' && widerData.results && widerData.results.length > 0) {
        // Priorizar coincidencia de nombre
        const match = widerData.results.find((result: any) =>
          result.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(result.name.toLowerCase())
        )

        if (match) {
          console.log('✅ Encontrado en búsqueda ampliada:', match.name, match.place_id)
          return match.place_id
        }

        return widerData.results[0].place_id
      }
    }

    return null
  } catch (error) {
    console.error('Error in nearby search:', error)
    return null
  }
}

/**
 * Busca un lugar por coordenadas y nombre desde la URL de Google Maps
 */
export async function findPlaceByCoordinatesAndName(url: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY no está configurada')
  }

  try {
    let decodedName = ''
    let lat: string | null = null
    let lng: string | null = null

    // Formato 1: /place/Nombre+del+Lugar/@lat,lng
    const nameMatch = url.match(/\/place\/([^/@]+)/)
    if (nameMatch) {
      const encodedName = nameMatch[1]
      decodedName = decodeURIComponent(encodedName.replace(/\+/g, ' '))
    }

    // Formato 2: ?q=Nombre+del+Lugar (para URLs con parámetro q)
    if (!decodedName) {
      const qMatch = url.match(/[?&]q=([^&]+)/)
      if (qMatch) {
        decodedName = decodeURIComponent(qMatch[1].replace(/\+/g, ' '))
        // Limpiar la dirección si viene con formato "Nombre - Dirección"
        // Ej: "M motel Limache - Avenida Palmira..." -> "M motel Limache"
        decodedName = decodedName.split(' - ')[0].trim()
      }
    }

    if (!decodedName) {
      console.log('⚠️ No se pudo extraer el nombre del lugar de la URL')
      return null
    }

    console.log('🔍 Buscando por nombre:', decodedName)

    // Extraer coordenadas del formato @lat,lng
    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (coordsMatch) {
      lat = coordsMatch[1]
      lng = coordsMatch[2]
      console.log('📍 Coordenadas encontradas:', { lat, lng })

      // Si tenemos coordenadas, usar Nearby Search (más preciso)
      console.log('🎯 Usando Nearby Search para mayor precisión...')
      const nearbyResult = await findPlaceByNearbySearch(
        parseFloat(lat),
        parseFloat(lng),
        decodedName
      )

      if (nearbyResult) {
        return nearbyResult
      }

      console.log('⚠️ Nearby Search no encontró resultados, intentando con findplacefromtext...')
    }

    // Si no tenemos coordenadas o Nearby Search falló, usar findplacefromtext
    let searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(decodedName)}&inputtype=textquery&fields=place_id,name`

    // Agregar location bias si tenemos coordenadas
    if (lat && lng) {
      searchUrl += `&locationbias=circle:500@${lat},${lng}`
    }

    searchUrl += `&key=${apiKey}`

    console.log('🌐 URL de búsqueda:', searchUrl.replace(apiKey, 'HIDDEN'))

    const response = await fetch(searchUrl)
    const data = await response.json()

    console.log('📊 Resultado de búsqueda:', { status: data.status, candidatesCount: data.candidates?.length })

    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      console.log('✅ Place ID encontrado:', data.candidates[0].place_id)
      return data.candidates[0].place_id
    }

    return null
  } catch (error) {
    console.error('Error finding place by coordinates:', error)
    return null
  }
}

/**
 * Obtiene la URL de una foto de Google Places
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 1200): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`
}

/**
 * Parsea la dirección de Google Maps al formato de nuestra base de datos
 */
export function parseAddress(formattedAddress: string) {
  const parts = formattedAddress.split(',').map(p => p.trim())

  // Limpiar la ciudad removiendo códigos postales (números al inicio)
  let city = parts[1] || ''
  // Remover números y espacios al inicio (ej: "8000600 Puerto Montt" -> "Puerto Montt")
  city = city.replace(/^\d+\s+/, '')

  return {
    street: parts[0] || '',
    city: city,
    state: parts[2] || '',
    country: parts[parts.length - 1] || '',
    postalCode: '',
  }
}

/**
 * Convierte los horarios de Google Places al formato de nuestra base de datos
 * Google usa: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
 * Nosotros usamos: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
 */
export function parseOpeningHours(openingHours?: PlaceDetails['opening_hours']) {
  if (!openingHours?.periods) {
    return []
  }

  const schedule = []

  // Convertir índices de Google (0=Dom) a nuestros índices (0=Lun)
  const convertGoogleDayToOurDay = (googleDay: number) => {
    // Google: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    // Nuestro: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
    return googleDay === 0 ? 6 : googleDay - 1
  }

  // Recorrer nuestros días (0=Lunes hasta 6=Domingo)
  for (let ourDay = 0; ourDay < 7; ourDay++) {
    // Convertir a día de Google para buscar
    const googleDay = ourDay === 6 ? 0 : ourDay + 1
    const period = openingHours.periods.find(p => p.open.day === googleDay)

    if (period) {
      schedule.push({
        dayOfWeek: ourDay,
        openTime: formatTime(period.open.time),
        closeTime: period.close ? formatTime(period.close.time) : '23:59',
        isClosed: false,
      })
    } else {
      schedule.push({
        dayOfWeek: ourDay,
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: true,
      })
    }
  }

  return schedule
}

/**
 * Formatea el tiempo de Google (e.g., "0900") a nuestro formato (e.g., "09:00")
 */
function formatTime(time: string): string {
  if (time.length === 4) {
    return `${time.substring(0, 2)}:${time.substring(2, 4)}`
  }
  return time
}
