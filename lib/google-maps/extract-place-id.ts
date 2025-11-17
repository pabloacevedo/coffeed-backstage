/**
 * Extrae el Place ID de una URL de Google Maps
 * Soporta varios formatos de URLs de Google Maps
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    // Formato 1: https://www.google.com/maps/place/...?cid=123456789
    const cidMatch = url.match(/[?&]cid=(\d+)/)
    if (cidMatch) {
      return cidMatch[1]
    }

    // Formato 2: https://www.google.com/maps/place/Name/@lat,lng,zoom/data=!4m6!3m5!1s0x123:0x456!8m2!3d...
    const placeIdMatch = url.match(/!1s([^!]+)/)
    if (placeIdMatch) {
      return placeIdMatch[1]
    }

    // Formato 3: https://maps.app.goo.gl/... (URL corta)
    // Estas URLs necesitan ser expandidas primero
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      // Retornamos null para indicar que necesitamos expandir la URL
      return 'NEEDS_EXPANSION'
    }

    // Formato 4: ftid (feature ID)
    const ftidMatch = url.match(/!1s([A-Za-z0-9_-]+):0x([A-Za-z0-9]+)/)
    if (ftidMatch) {
      return `${ftidMatch[1]}:0x${ftidMatch[2]}`
    }

    return null
  } catch (error) {
    console.error('Error extracting Place ID:', error)
    return null
  }
}

/**
 * Expande una URL corta de Google Maps
 */
export async function expandShortUrl(shortUrl: string): Promise<string | null> {
  try {
    // Usar fetch con redirect: 'follow' para obtener la URL final
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
    })

    // La URL final después de todas las redirecciones
    const finalUrl = response.url

    if (finalUrl && finalUrl !== shortUrl) {
      return finalUrl
    }

    return null
  } catch (error) {
    console.error('Error expanding short URL:', error)
    return null
  }
}
