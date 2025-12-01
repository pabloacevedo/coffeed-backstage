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
 *
 * Estrategia: Las coordenadas de Google Maps URL son exactas, así que:
 * 1. Primero buscar en radio muy pequeño (15m) sin filtro de nombre
 * 2. Si hay un solo resultado, usarlo (es el lugar exacto)
 * 3. Si hay múltiples, usar nombre como desempate
 * 4. Expandir radio gradualmente si no hay resultados
 */
export async function findPlaceByNearbySearch(lat: number, lng: number, name: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY no está configurada')
  }

  try {
    console.log('🎯 Buscando lugar cercano con Nearby Search:', { lat, lng, name })

    // Paso 1: Búsqueda muy precisa (15m) SIN filtro de keyword para encontrar el lugar exacto
    // Nota: No usar filtro de type para capturar cualquier establecimiento en el radio
    const preciseUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=15&key=${apiKey}&language=es`

    console.log('🌐 URL de búsqueda precisa (15m):', preciseUrl.replace(apiKey, 'HIDDEN'))

    const preciseResponse = await fetch(preciseUrl)
    const preciseData = await preciseResponse.json()

    console.log('📊 Resultado de búsqueda precisa:', {
      status: preciseData.status,
      resultsCount: preciseData.results?.length,
      results: preciseData.results?.map((r: any) => r.name)
    })

    if (preciseData.status === 'OK' && preciseData.results && preciseData.results.length > 0) {
      // Si hay exactamente un resultado en 15m, es el lugar exacto
      if (preciseData.results.length === 1) {
        console.log('✅ Único resultado en 15m (lugar exacto):', preciseData.results[0].name, preciseData.results[0].place_id)
        return preciseData.results[0].place_id
      }

      // Si hay múltiples en 15m, usar nombre como desempate
      const exactMatch = preciseData.results.find((result: any) =>
        result.name.toLowerCase().trim() === name.toLowerCase().trim()
      )

      if (exactMatch) {
        console.log('✅ Coincidencia exacta de nombre en 15m:', exactMatch.name, exactMatch.place_id)
        return exactMatch.place_id
      }

      // Buscar coincidencia parcial
      const partialMatch = preciseData.results.find((result: any) =>
        result.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(result.name.toLowerCase())
      )

      if (partialMatch) {
        console.log('✅ Coincidencia parcial en 15m:', partialMatch.name, partialMatch.place_id)
        return partialMatch.place_id
      }

      // Sin coincidencia de nombre, usar el más cercano (primero de la lista)
      console.log('⚠️ Múltiples resultados sin coincidencia de nombre, usando el primero:', preciseData.results[0].name)
      return preciseData.results[0].place_id
    }

    // Paso 2: Búsqueda con radio medio (50m) usando keyword de nombre
    console.log('🔄 Ampliando búsqueda a 50m con keyword...')
    const mediumUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&keyword=${encodeURIComponent(name)}&key=${apiKey}&language=es`

    const mediumResponse = await fetch(mediumUrl)
    const mediumData = await mediumResponse.json()

    console.log('📊 Resultado de búsqueda media (50m):', {
      status: mediumData.status,
      resultsCount: mediumData.results?.length,
      firstResult: mediumData.results?.[0]?.name
    })

    if (mediumData.status === 'OK' && mediumData.results && mediumData.results.length > 0) {
      // Ordenar por similitud de nombre
      const sortedResults = mediumData.results.sort((a: any, b: any) => {
        const aExact = a.name.toLowerCase().trim() === name.toLowerCase().trim() ? 0 : 1
        const bExact = b.name.toLowerCase().trim() === name.toLowerCase().trim() ? 0 : 1
        return aExact - bExact
      })

      console.log('✅ Encontrado en 50m:', sortedResults[0].name, sortedResults[0].place_id)
      return sortedResults[0].place_id
    }

    // Paso 3: Búsqueda amplia (200m) como último recurso
    if (mediumData.status === 'ZERO_RESULTS') {
      console.log('🔄 Ampliando búsqueda a 200m...')
      const wideUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=200&keyword=${encodeURIComponent(name)}&key=${apiKey}&language=es`

      const wideResponse = await fetch(wideUrl)
      const wideData = await wideResponse.json()

      console.log('📊 Resultado de búsqueda amplia (200m):', {
        status: wideData.status,
        resultsCount: wideData.results?.length
      })

      if (wideData.status === 'OK' && wideData.results && wideData.results.length > 0) {
        // Priorizar coincidencia exacta de nombre
        const match = wideData.results.find((result: any) =>
          result.name.toLowerCase().trim() === name.toLowerCase().trim()
        ) || wideData.results.find((result: any) =>
          result.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(result.name.toLowerCase())
        ) || wideData.results[0]

        console.log('✅ Encontrado en búsqueda amplia:', match.name, match.place_id)
        return match.place_id
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

    // Extraer coordenadas - PRIORIZAR el formato del lugar específico (!8m2!3d!4d)
    // sobre las coordenadas del mapa (@lat,lng)

    // Formato 1 (PRIORITARIO): !8m2!3d[lat]!4d[lng] - coordenadas exactas del lugar
    let coordsMatch = url.match(/!8m2!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)

    // Formato 2: !3d[lat]!4d[lng] (sin el !8m2, pero aún coordenadas del lugar)
    if (!coordsMatch) {
      const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      if (dataMatch) {
        coordsMatch = dataMatch
      }
    }

    // Formato 3: @lat,lng (coordenadas del mapa - menos preciso, usar como fallback)
    if (!coordsMatch) {
      const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (atMatch) {
        coordsMatch = atMatch
        console.log('⚠️ Usando coordenadas del mapa (menos preciso)')
      }
    }

    // Formato 4: ll=lat,lng
    if (!coordsMatch) {
      const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (llMatch) {
        coordsMatch = llMatch
      }
    }

    // Formato 5: center=lat,lng
    if (!coordsMatch) {
      const centerMatch = url.match(/[?&]center=(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (centerMatch) {
        coordsMatch = centerMatch
      }
    }

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
 * Nosotros usamos: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 0=Domingo
 */
export function parseOpeningHours(openingHours?: PlaceDetails['opening_hours']) {
  if (!openingHours?.periods) {
    return []
  }

  const schedule = []

  // Mapeo de días de Google a nuestro sistema
  // Google: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  // Nuestro: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 0=Dom
  const googleToOurDay: Record<number, number> = {
    0: 0, // Domingo -> 0
    1: 1, // Lunes -> 1
    2: 2, // Martes -> 2
    3: 3, // Miércoles -> 3
    4: 4, // Jueves -> 4
    5: 5, // Viernes -> 5
    6: 6, // Sábado -> 6
  }

  // Recorrer todos los días de la semana en nuestro formato (1-6, 0)
  const ourDays = [1, 2, 3, 4, 5, 6, 0] // Lunes a Domingo
  const googleDays = [1, 2, 3, 4, 5, 6, 0] // Lunes a Domingo en formato Google

  for (let i = 0; i < 7; i++) {
    const ourDay = ourDays[i]
    const googleDay = googleDays[i]
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
