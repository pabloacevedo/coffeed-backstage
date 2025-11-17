# Configuración de APIs para Coffeed Backstage

Este documento explica cómo configurar las APIs necesarias para la funcionalidad de importación de cafeterías desde Google Maps.

## Variables de Entorno Requeridas

Copia `.env.example` a `.env.local` y completa las siguientes variables:

```bash
cp .env.example .env.local
```

## 1. Google Maps API (Requerida)

La API de Google Maps es necesaria para importar cafeterías automáticamente desde Google Maps.

### Pasos para obtener la API Key:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services > Credentials**
4. Haz clic en **Create Credentials > API Key**
5. Copia la API Key generada

### Habilitar APIs necesarias:

En [Google Cloud Console](https://console.cloud.google.com/apis/library), busca y habilita:

- **Places API (New)** - Para obtener detalles de lugares
- **Places API** - Para compatibilidad con versiones anteriores
- **Maps JavaScript API** - Para funcionalidades del mapa

### Configurar restricciones (Recomendado para producción):

1. En **APIs & Services > Credentials**, edita tu API Key
2. En **API restrictions**, selecciona "Restrict key"
3. Selecciona solo las APIs habilitadas arriba
4. En **Application restrictions** (para producción):
   - Selecciona "HTTP referrers"
   - Agrega tu dominio: `https://tudominio.com/*`

### Agregar la variable:

```env
GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

**Costo:** Google Maps ofrece $200 USD de crédito mensual gratuito. La mayoría de proyectos pequeños no superan este límite.

## 2. OpenAI API (Opcional)

La API de OpenAI se usa para generar descripciones atractivas automáticamente. Si no se configura, el sistema usará descripciones por defecto.

### Pasos para obtener la API Key:

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a [API Keys](https://platform.openai.com/api-keys)
4. Haz clic en **Create new secret key**
5. Copia la API Key (solo se muestra una vez)

### Configurar límites de uso (Recomendado):

1. Ve a [Usage limits](https://platform.openai.com/account/limits)
2. Establece un límite mensual de gasto (ej: $10 USD)

### Agregar la variable:

```env
OPENAI_API_KEY=tu_api_key_aqui
```

**Costo:** Usamos el modelo `gpt-4o-mini` que es muy económico (~$0.15 por 1M de tokens de entrada). Para generar descripciones, cada cafetería cuesta aproximadamente $0.0001 - $0.0003 USD.

**Nota:** Si no configuras esta variable, el sistema funcionará normalmente pero usará descripciones genéricas en lugar de descripciones personalizadas.

## 3. Supabase (Ya configurada)

Las credenciales de Supabase ya están configuradas en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wdjpssfxsvdvjjksmdsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Verificar configuración

Después de configurar las variables de entorno:

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `/coffee-shops/new`
3. Haz clic en "Importar desde Google Maps"
4. Prueba con una URL de Google Maps de una cafetería

## Solución de problemas

### Error: "GOOGLE_MAPS_API_KEY no está configurada"

- Verifica que hayas agregado la variable en `.env.local`
- Reinicia el servidor de desarrollo
- Asegúrate de que no haya espacios antes o después del valor

### Error: "This API project is not authorized to use this API"

- Ve a Google Cloud Console
- Habilita las APIs mencionadas arriba
- Espera 1-2 minutos para que los cambios se propaguen

### Error de cuota de Google Maps

- Verifica tu facturación en Google Cloud Console
- Asegúrate de tener una tarjeta de crédito registrada
- Revisa los límites de uso en el dashboard

### OpenAI no genera descripciones

- Verifica que la API Key sea correcta
- Asegúrate de tener créditos disponibles en tu cuenta
- Si no quieres usar OpenAI, simplemente deja la variable vacía o comentada

## Seguridad

⚠️ **IMPORTANTE:**

- Nunca compartas tus API Keys públicamente
- No las incluyas en el código fuente
- No las commits en Git (`.env.local` está en `.gitignore`)
- Rota las keys si sospechas que fueron comprometidas
- Para producción, usa las restricciones de API adecuadas

## Costos estimados

Para un proyecto pequeño/mediano (100 cafeterías importadas al mes):

- **Google Maps API:** GRATIS (dentro de los $200 USD mensuales)
- **OpenAI API:** ~$0.01 - $0.03 USD por mes

Total estimado: **$0 - $3 USD/mes** para proyectos pequeños.
