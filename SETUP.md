# 🚀 Guía de Configuración - Coffeed Backstage

Esta guía te ayudará a configurar y poner en marcha el panel de administración de Coffeed.

## ✅ Prerequisitos

- Node.js 18+ instalado
- Una cuenta de Supabase (gratuita)
- Git

## 📝 Paso 1: Configurar Supabase

### 1.1 Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta (si no tienes una)
2. Crea un nuevo proyecto
3. Anota la URL y las API Keys que te proporciona Supabase

### 1.2 Configurar la base de datos

Tu proyecto de Coffeed App ya debe tener las tablas creadas. Si no es así, necesitas crear las siguientes tablas en Supabase:

**Tablas principales:**
- `coffee_shops` - Información de cafeterías
- `addresses` - Direcciones
- `schedules` - Horarios
- `contacts` - Contactos
- `reviews` - Reseñas
- `reports` - Reportes
- `bookmark_lists` - Listas de favoritos
- `bookmarks` - Favoritos
- `views` - Analytics
- `profiles` - Perfiles de usuarios

**Nota:** Si ya tienes la app móvil funcionando, estas tablas ya deben existir en tu proyecto de Supabase.

### 1.3 Obtener las credenciales

En tu dashboard de Supabase:

1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) - ⚠️ Mantén esto secreto

## 📝 Paso 2: Configurar el Proyecto

### 2.1 Instalar dependencias

```bash
npm install
```

### 2.2 Configurar variables de entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` y agrega tus credenciales:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Importante:** Nunca compartas o subas a Git el archivo `.env.local`

## 📝 Paso 3: Crear un Usuario Administrador

Para poder iniciar sesión en el panel, necesitas crear un usuario en Supabase:

### Opción 1: Desde el Dashboard de Supabase

1. Ve a **Authentication** → **Users** en tu proyecto de Supabase
2. Click en **Add user** → **Create new user**
3. Ingresa:
   - Email: `admin@coffeed.com` (o el que prefieras)
   - Password: Una contraseña segura
4. Click en **Create user**

### Opción 2: Desde SQL Editor

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Nota: Supabase creará el usuario automáticamente cuando uses el signup
-- Por ahora, puedes crear un usuario desde el dashboard
```

## 📝 Paso 4: Ejecutar el Proyecto

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### Iniciar Sesión

1. Ve a `http://localhost:3000`
2. Serás redirigido a `/login`
3. Ingresa el email y contraseña del usuario que creaste
4. ¡Listo! Ya puedes acceder al dashboard

## 📝 Paso 5: Build para Producción

### Compilar el proyecto

```bash
npm run build
```

### Ejecutar en modo producción

```bash
npm start
```

## 🚀 Despliegue en Vercel

### Método 1: Deploy con Git (Recomendado)

1. Sube tu código a GitHub/GitLab/Bitbucket
2. Ve a [vercel.com](https://vercel.com)
3. Click en **New Project**
4. Importa tu repositorio
5. Configura las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click en **Deploy**

### Método 2: Deploy CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Hacer deploy
vercel

# Deploy a producción
vercel --prod
```

## 🔐 Seguridad

### Row Level Security (RLS)

Asegúrate de tener RLS habilitado en todas tus tablas de Supabase. Ejemplo de políticas:

```sql
-- Ejemplo: Solo admins pueden modificar coffee_shops
CREATE POLICY "Admins can do everything" ON coffee_shops
FOR ALL
USING (
  auth.jwt()->>'role' = 'admin'
);

-- Lectura pública de cafeterías activas
CREATE POLICY "Public can view active shops" ON coffee_shops
FOR SELECT
USING (active = true AND deleted = false);
```

### Crear roles de Admin

Para crear un sistema de roles más robusto, puedes:

1. Crear una tabla `admin_users`:
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'moderator', -- 'admin', 'moderator', 'editor'
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. Agregar políticas basadas en esta tabla

## 🐛 Troubleshooting

### Error: "Invalid supabaseUrl"
- Verifica que hayas configurado correctamente `.env.local`
- Asegúrate de que la URL comience con `https://`

### Error: "User not found" al hacer login
- Verifica que hayas creado el usuario en Supabase
- Verifica que el email y contraseña sean correctos

### Error: "Failed to fetch"
- Verifica tu conexión a internet
- Verifica que la URL de Supabase sea correcta
- Verifica que el proyecto de Supabase esté activo

### No puedo ver las cafeterías/datos
- Verifica que tu base de datos tenga datos
- Verifica las políticas RLS de Supabase
- Revisa la consola del navegador para ver errores

## 📚 Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Shadcn/ui](https://ui.shadcn.com)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

## 🎨 Personalización

### Cambiar colores del tema

Edita `app/globals.css`:

```css
:root {
  --primary: 24 100% 50%; /* Naranja para Coffeed */
  --secondary: 38 92% 50%; /* Ámbar */
  /* Cambia estos valores según tu marca */
}
```

### Agregar nuevos módulos

1. Crea una nueva carpeta en `app/(dashboard)/`
2. Agrega el item al menú en `components/app-sidebar.tsx`
3. Implementa tu funcionalidad

## 💡 Tips

1. **Usa las herramientas de desarrollo:**
   - Next.js tiene un excelente modo de desarrollo con hot reload
   - Usa las DevTools del navegador para debuggear

2. **Monitorea Supabase:**
   - Revisa el Dashboard de Supabase para ver queries
   - Monitorea el uso de la API

3. **Backups:**
   - Supabase hace backups automáticos (plan gratuito: 7 días)
   - Para producción, considera backups adicionales

## ✅ Checklist de Lanzamiento

Antes de lanzar a producción:

- [ ] Variables de entorno configuradas en Vercel
- [ ] RLS habilitado en todas las tablas
- [ ] Usuario administrador creado
- [ ] Build exitoso (`npm run build`)
- [ ] Dominio custom configurado (opcional)
- [ ] SSL/HTTPS habilitado
- [ ] Políticas de seguridad revisadas
- [ ] Backup de base de datos configurado
- [ ] Monitoreo y logs configurados

## 🆘 Soporte

Si necesitas ayuda:
- Revisa la [documentación](README.md)
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

¡Listo! Tu panel de administración Coffeed Backstage está configurado y funcionando. ☕
