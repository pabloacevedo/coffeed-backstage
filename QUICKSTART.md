# ⚡ Quick Start - Coffeed Backstage

Guía rápida para poner en marcha el panel en **5 minutos**.

## 1️⃣ Instalar dependencias

```bash
npm install
```

## 2️⃣ Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea/abre tu proyecto
2. Copia tus credenciales:
   - Project URL
   - anon key
   - service_role key (opcional)

## 3️⃣ Configurar variables de entorno

```bash
# Copia el ejemplo
cp .env.example .env.local

# Edita .env.local con tus credenciales de Supabase
```

En `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

## 4️⃣ Crear usuario administrador

En Supabase:
- Ve a **Authentication** → **Users**
- Click **Add user** → **Create new user**
- Email: `admin@coffeed.com`
- Password: `tu-password-segura`

## 5️⃣ Ejecutar proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## ✅ ¡Listo!

Inicia sesión con el email y password que creaste.

---

**¿Necesitas más detalles?** Lee [SETUP.md](SETUP.md)

**¿Problemas?** Revisa la sección de Troubleshooting en [SETUP.md](SETUP.md)
