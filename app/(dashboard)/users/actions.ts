"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function updateUser(
  userId: string,
  data: {
    full_name: string | null
    isAdmin: boolean
  }
) {
  console.log("[Server Action] Updating user:", userId, data)
  const supabase = createAdminSupabaseClient()

  try {
    // Update profile (full_name)
    if (data.full_name !== undefined) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", userId)

      if (profileError) {
        console.error("[Server Action] Error updating profile:", profileError)
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
      console.error("[Server Action] Error updating user metadata:", metadataError)
      throw new Error("Error al actualizar los permisos del usuario")
    }

    console.log("[Server Action] User updated successfully")
    revalidatePath("/users", "page")

    return { success: true }
  } catch (error: any) {
    console.error("[Server Action] Error updating user:", error)
    throw error
  }
}
