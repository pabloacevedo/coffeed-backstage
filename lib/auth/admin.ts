import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Verifica que el usuario actual tenga permisos de administrador
 * Lanza un error si no está autenticado o no es admin
 *
 * IMPORTANTE: Esta función DEBE ser llamada en todas las Server Actions
 * que requieran permisos de administrador
 */
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient()

  // Obtener usuario autenticado
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("No autenticado")
  }

  // Verificar que tenga el rol de admin en user_metadata
  const isAdmin = user.user_metadata?.is_admin === true

  if (!isAdmin) {
    throw new Error("Acceso denegado: Se requieren permisos de administrador")
  }

  return user
}

/**
 * Verifica si el usuario actual es admin sin lanzar error
 * Útil para validaciones condicionales
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    await requireAdmin()
    return true
  } catch {
    return false
  }
}
