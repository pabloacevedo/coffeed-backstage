"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"

/**
 * Activa o desactiva una cafetería
 */
export async function toggleCoffeeShopStatus(shopId: string, newStatus: boolean) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin
  await requireAdmin()
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("coffee_shops")
    .update({ active: newStatus })
    .eq("id", shopId)
    .select()

  if (error) {
    throw new Error("Error al cambiar el estado de la cafetería")
  }

  if (!data || data.length === 0) {
    throw new Error("Cafetería no encontrada")
  }

  revalidatePath("/coffee-shops", "page")
  revalidatePath(`/coffee-shops/${shopId}`, "page")

  return { success: true, data: data[0] }
}

/**
 * Desactiva una cafetería (usado desde reportes)
 */
export async function deactivateCoffeeShop(shopId: string) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin
  await requireAdmin()
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("coffee_shops")
    .update({ active: false })
    .eq("id", shopId)
    .select()

  if (error) {
    throw new Error("Error al desactivar la cafetería")
  }

  if (!data || data.length === 0) {
    throw new Error("Cafetería no encontrada")
  }

  revalidatePath("/coffee-shops", "page")
  revalidatePath(`/coffee-shops/${shopId}`, "page")
  revalidatePath("/reports", "page")

  return { success: true }
}
