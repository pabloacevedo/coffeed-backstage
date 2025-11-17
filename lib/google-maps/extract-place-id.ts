/**
 * Extrae el Place ID de una URL de Google Maps
 * Soporta varios formatos de URLs de Google Maps
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    // Formato 1: https://maps.app.goo.gl/... (URL corta)
    // Estas URLs necesitan ser expandidas primero
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      return 'NEEDS_EXPANSION'
    }

    // Formato 2: ChIJ... (Place ID formato moderno)
    // Ejemplo: !1s0ChIJN3F_UZIEdkgRMAXkhrsMnUk
    const modernPlaceIdMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/)
    if (modernPlaceIdMatch) {
      return modernPlaceIdMatch[1]
    }

    // Formato 3: Buscar en el data parameter
    // Ejemplo: data=!4m6!3m5!1sChIJN3F_UZIEdkgRMAXkhrsMnUk
    const dataPlaceIdMatch = url.match(/data=[^&]*!1s(ChIJ[A-Za-z0-9_-]+)/)
    if (dataPlaceIdMatch) {
      return dataPlaceIdMatch[1]
    }

    // Formato 4: CID (Customer ID)
    const cidMatch = url.match(/[?&]cid=(\d+)/)
    if (cidMatch) {
      return `CID:${cidMatch[1]}`
    }

    // Formato 5: Buscar cualquier ChIJ en la URL
    const anyChIJMatch = url.match(/ChIJ[A-Za-z0-9_-]+/)
    if (anyChIJMatch) {
      return anyChIJMatch[0]
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
