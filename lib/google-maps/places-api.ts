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
 * Busca un lugar por coordenadas y nombre desde la URL de Google Maps
 */
export async function findPlaceByCoordinatesAndName(url: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY no está configurada')
  }

  try {
    // Extraer el nombre del lugar desde la URL
    // Formato: /place/Nombre+del+Lugar/@lat,lng
    const nameMatch = url.match(/\/place\/([^/@]+)/)
    if (!nameMatch) return null

    const encodedName = nameMatch[1]
    const decodedName = decodeURIComponent(encodedName.replace(/\+/g, ' '))

    console.log('🔍 Buscando por nombre:', decodedName)

    // Extraer coordenadas
    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (!coordsMatch) return null

    const lat = coordsMatch[1]
    const lng = coordsMatch[2]

    console.log('📍 Coordenadas:', { lat, lng })

    // Usar Find Place From Text con location bias
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(decodedName)}&inputtype=textquery&fields=place_id,name&locationbias=circle:500@${lat},${lng}&key=${apiKey}`

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

  return {
    street: parts[0] || '',
    city: parts[1] || '',
    state: parts[2] || '',
    country: parts[parts.length - 1] || '',
    postalCode: '',
  }
}

/**
 * Convierte los horarios de Google Places al formato de nuestra base de datos
 */
export function parseOpeningHours(openingHours?: PlaceDetails['opening_hours']) {
  if (!openingHours?.periods) {
    return []
  }

  const schedule = []

  for (let day = 0; day < 7; day++) {
    const period = openingHours.periods.find(p => p.open.day === day)

    if (period) {
      schedule.push({
        dayOfWeek: day,
        openTime: formatTime(period.open.time),
        closeTime: period.close ? formatTime(period.close.time) : '23:59',
        isClosed: false,
      })
    } else {
      schedule.push({
        dayOfWeek: day,
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
