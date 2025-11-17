/**
 * Integración con OpenAI para generar descripciones atractivas de cafeterías
 */

interface CoffeeShopInfo {
  name: string
  address: string
  rating?: number
  reviews?: Array<{ text: string; rating: number }>
}

/**
 * Genera una descripción atractiva para una cafetería usando OpenAI
 */
export async function generateCoffeeShopDescription(
  shopInfo: CoffeeShopInfo
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn('OPENAI_API_KEY no configurada, se usará descripción por defecto')
    return generateDefaultDescription(shopInfo)
  }

  try {
    // Seleccionar las mejores reseñas (las de mayor rating)
    const topReviews = shopInfo.reviews
      ?.sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map(r => r.text)
      .join('\n') || 'Sin reseñas disponibles'

    const prompt = `Genera una descripción atractiva y concisa (máximo 150 palabras) en español para la siguiente cafetería. La descripción debe ser acogedora, destacar lo especial del lugar y motivar a los usuarios a visitarla.

Nombre: ${shopInfo.name}
Ubicación: ${shopInfo.address}
Calificación: ${shopInfo.rating ? `${shopInfo.rating}/5 estrellas` : 'Sin calificación'}

Algunas reseñas de clientes:
${topReviews}

Instrucciones:
- Usa un tono amigable y acogedor
- Destaca los aspectos positivos mencionados en las reseñas
- Si es posible, menciona la atmósfera o especialidades del lugar
- Mantén la descripción entre 80-150 palabras
- No uses emojis
- Escribe en tercera persona`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing de cafeterías que crea descripciones atractivas y acogedoras.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const description = data.choices[0]?.message?.content?.trim()

    return description || generateDefaultDescription(shopInfo)
  } catch (error) {
    console.error('Error generating description with OpenAI:', error)
    return generateDefaultDescription(shopInfo)
  }
}

/**
 * Genera una descripción por defecto cuando OpenAI no está disponible
 */
function generateDefaultDescription(shopInfo: CoffeeShopInfo): string {
  const rating = shopInfo.rating
    ? `Con una calificación de ${shopInfo.rating}/5 estrellas, `
    : ''

  return `${rating}${shopInfo.name} es una cafetería ubicada en ${shopInfo.address}. Un lugar acogedor para disfrutar de un buen café y pasar un momento agradable.`
}
