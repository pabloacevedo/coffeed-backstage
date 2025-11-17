# ☕ Coffeed Backstage

Panel de administración completo para gestionar la plataforma **Coffeed App** - una aplicación móvil para descubrir y reseñar cafeterías.

## 🚀 Características

### 📊 Dashboard
- Métricas en tiempo real (cafeterías, usuarios, reseñas, reportes)
- Visualización de actividad reciente
- Estadísticas de visualizaciones
- Calificación promedio de la plataforma

### ☕ Gestión de Cafeterías
- CRUD completo de cafeterías
- Vista de detalles con tabs (información, horarios, reseñas)
- Activar/desactivar cafeterías
- Soft delete (eliminación reversible)
- Búsqueda y filtrado
- Gestión de:
  - Información básica (nombre, descripción, imagen)
  - Direcciones
  - Horarios de atención
  - Información de contacto
  - Reseñas de usuarios

### 👥 Gestión de Usuarios
- Listado de todos los usuarios registrados
- Estadísticas por usuario:
  - Cantidad de reseñas
  - Colecciones creadas
- Vista de perfil con avatar

### ⭐ Moderación de Reseñas
- Visualización de todas las reseñas
- Información de usuario y cafetería
- Calificación y comentarios
- Ordenamiento por fecha

### 🚩 Sistema de Reportes
- Gestión de reportes de información incorrecta
- Estados: Pendiente, Resuelto
- Filtrado por estado (Tabs)
- Acciones rápidas:
  - Resolver reporte
  - Descartar reporte

### 📈 Analíticas
- Top 10 cafeterías mejor calificadas
- Top 10 cafeterías más vistas
- Actividad de reseñas (últimos 30 días)
- Métricas de engagement

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** Shadcn/ui
- **Iconos:** Lucide React
- **Notificaciones:** Sonner

### Backend & Base de Datos
- **BaaS:** Supabase
- **Base de Datos:** PostgreSQL
- **Autenticación:** Supabase Auth
- **Real-time:** Supabase Subscriptions
- **Storage:** Supabase Storage

### Herramientas
- **Tipado:** TypeScript estricto
- **Linting:** ESLint
- **Gestión de dependencias:** npm

## 📦 Instalación

1. **Clonar el repositorio**
\`\`\`bash
cd coffeed-backstage
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

3. **Configurar variables de entorno**

Copia \`.env.example\` a \`.env.local\` y configura tus credenciales de Supabase:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edita \`.env.local\`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
\`\`\`

4. **Ejecutar en desarrollo**
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en \`http://localhost:3000\`

## 🗄️ Estructura del Proyecto

\`\`\`
coffeed-backstage/
├── app/
│   ├── (dashboard)/          # Rutas protegidas del dashboard
│   │   ├── page.tsx          # Dashboard principal
│   │   ├── coffee-shops/     # Gestión de cafeterías
│   │   │   ├── page.tsx      # Listado
│   │   │   └── [id]/         # Detalles y edición
│   │   ├── users/            # Gestión de usuarios
│   │   ├── reviews/          # Moderación de reseñas
│   │   ├── reports/          # Sistema de reportes
│   │   ├── analytics/        # Analíticas
│   │   ├── settings/         # Configuración
│   │   └── layout.tsx        # Layout con sidebar
│   ├── login/                # Autenticación
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Estilos globales
├── components/
│   ├── ui/                   # Componentes Shadcn/ui
│   ├── app-sidebar.tsx       # Navegación lateral
│   ├── coffee-shops/         # Componentes de cafeterías
│   └── reports/              # Componentes de reportes
├── lib/
│   ├── supabase/             # Cliente y tipos de Supabase
│   │   ├── client.ts         # Cliente browser
│   │   ├── server.ts         # Cliente server
│   │   ├── middleware.ts     # Middleware de auth
│   │   └── types.ts          # Tipos TypeScript generados
│   └── utils.ts              # Utilidades
├── middleware.ts             # Middleware de Next.js
└── package.json
\`\`\`

## 🔐 Autenticación

El panel utiliza **Supabase Auth** para la autenticación. Los usuarios deben estar registrados en la base de datos de Supabase para acceder.

### Crear un usuario administrador

1. Ve a tu dashboard de Supabase
2. Authentication → Users
3. Add user → Create new user
4. Ingresa email y contraseña

### Protección de rutas

Todas las rutas dentro de \`(dashboard)\` están protegidas por el middleware de autenticación en \`middleware.ts\`. Los usuarios no autenticados son redirigidos a \`/login\`.

## 📊 Base de Datos

El proyecto utiliza las siguientes tablas principales de Supabase:

- \`coffee_shops\` - Información de cafeterías
- \`addresses\` - Direcciones de cafeterías
- \`schedules\` - Horarios de atención
- \`contacts\` - Información de contacto
- \`reviews\` - Reseñas de usuarios
- \`reports\` - Reportes de información incorrecta
- \`bookmark_lists\` - Colecciones de usuarios
- \`bookmarks\` - Cafeterías guardadas
- \`views\` - Analytics de visualizaciones
- \`profiles\` - Perfiles de usuarios

Todas las tablas incluyen:
- Soft delete (\`deleted\` boolean)
- Timestamps (\`created_at\`, \`updated_at\`)
- Row Level Security (RLS) para seguridad

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

\`\`\`bash
npm run build
\`\`\`

### Variables de Entorno en Producción

Asegúrate de configurar:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\` (solo backend)

## 🔧 Scripts Disponibles

\`\`\`bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
\`\`\`

## 🎨 Personalización

### Temas y Colores

Los colores se configuran en \`app/globals.css\` usando variables CSS de Tailwind. Puedes personalizarlos según tu marca.

### Agregar nuevos componentes Shadcn/ui

\`\`\`bash
npx shadcn@latest add [component-name]
\`\`\`

## 📱 Integración con Coffeed App

Este panel de administración está diseñado para trabajar con la misma base de datos de Supabase que utiliza la aplicación móvil **Coffeed App**.

Cambios realizados en el backstage se reflejan inmediatamente en la app móvil gracias a las suscripciones en tiempo real de Supabase.

## ✨ Futuras Mejoras

- [ ] Editor visual de cafeterías con mapas interactivos
- [ ] Sistema de roles y permisos (admin, moderador, editor)
- [ ] Exportación de datos (CSV, PDF)
- [ ] Dashboard con gráficos avanzados (Recharts)
- [ ] Notificaciones en tiempo real
- [ ] Auditoría de cambios (log de actividades)
- [ ] Bulk actions (acciones en lote)
- [ ] Filtros avanzados y búsqueda full-text
- [ ] Dark mode
- [ ] Multi-idioma (i18n)

---

Hecho con ☕ por Pablo Acevedo
