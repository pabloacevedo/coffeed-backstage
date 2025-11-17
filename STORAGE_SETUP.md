# Configuración del Storage en Supabase

Para habilitar la funcionalidad de subida de imágenes, necesitas configurar un bucket en Supabase.

## Pasos para configurar el bucket:

1. **Ir a Supabase Dashboard**
   - Accede a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Crear el bucket "images"**
   - Ve a la sección "Storage" en el menú lateral
   - Click en "Create a new bucket"
   - Nombre: `images`
   - **Importante**: Marca la opción "Public bucket" para que las URLs sean accesibles públicamente
   - Click en "Create bucket"

3. **Configurar políticas de acceso (RLS)**

   Ve a la sección "Policies" del bucket y crea las siguientes políticas:

   **Política 1: Permitir SELECT (lectura pública)**
   ```sql
   -- Policy name: Public read access
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'images' );
   ```

   **Política 2: Permitir INSERT (solo usuarios autenticados)**
   ```sql
   -- Policy name: Authenticated users can upload
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK ( bucket_id = 'images' );
   ```

   **Política 3: Permitir UPDATE (solo usuarios autenticados)**
   ```sql
   -- Policy name: Authenticated users can update
   CREATE POLICY "Authenticated users can update"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING ( bucket_id = 'images' );
   ```

   **Política 4: Permitir DELETE (solo usuarios autenticados)**
   ```sql
   -- Policy name: Authenticated users can delete
   CREATE POLICY "Authenticated users can delete"
   ON storage.objects FOR DELETE
   TO authenticated
   USING ( bucket_id = 'images' );
   ```

4. **Estructura de carpetas**

   El sistema creará automáticamente la siguiente estructura:
   ```
   images/
   └── coffee-shops/
       ├── [coffee-shop-id]-[timestamp].jpg
       ├── [coffee-shop-id]-[timestamp].png
       └── ...
   ```

5. **Verificar configuración**

   Una vez configurado, deberías poder:
   - Ver las imágenes públicamente sin autenticación
   - Subir imágenes solo si estás autenticado
   - Actualizar/eliminar imágenes solo si estás autenticado

## Troubleshooting

### Error: "Bucket not found"
- Verifica que el bucket se llame exactamente `images`
- Verifica que el bucket esté público

### Error: "Access denied"
- Verifica que las políticas RLS estén configuradas correctamente
- Verifica que estés autenticado en el panel de administración

### Las imágenes no se ven
- Verifica que el bucket sea público
- Verifica que la URL pública sea correcta
- Revisa la consola del navegador para ver errores CORS

## Configuración alternativa usando el SQL Editor

También puedes ejecutar este script SQL directamente en el SQL Editor de Supabase:

```sql
-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear políticas
CREATE POLICY IF NOT EXISTS "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' );

CREATE POLICY IF NOT EXISTS "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'images' );

CREATE POLICY IF NOT EXISTS "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'images' );
```
