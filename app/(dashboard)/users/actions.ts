"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"

export async function updateUser(
  userId: string,
  data: {
    full_name: string | null
    isAdmin: boolean
    newPassword?: string
  }
) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin ANTES de cualquier operación
  const adminUser = await requireAdmin()
  const supabase = createAdminSupabaseClient()

  try {
    // Validación adicional: No permitir que un admin se quite sus propios permisos
    if (userId === adminUser.id && !data.isAdmin) {
      throw new Error("No puedes quitarte tus propios permisos de administrador")
    }

    // Update password if provided
    if (data.newPassword && data.newPassword.trim()) {
      if (data.newPassword.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }

      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: data.newPassword }
      )

      if (passwordError) {
        throw new Error("Error al actualizar la contraseña")
      }
    }

    // Update profile (full_name)
    if (data.full_name !== undefined) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", userId)

      if (profileError) {
        throw new Error("Error al actualizar el perfil")
      }
    }

    // Update user metadata (admin role)
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          is_admin: data.isAdmin,
        },
      }
    )

    if (metadataError) {
      throw new Error("Error al actualizar los permisos del usuario")
    }

    revalidatePath("/users", "page")

    return { success: true }
  } catch (error: any) {
    throw error
  }
}
