"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"

export async function resolveReport(reportId: string) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin
  await requireAdmin()
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", reportId)
    .select()

  if (error) {
    throw new Error("Error al resolver el reporte")
  }

  if (!data || data.length === 0) {
    throw new Error("Reporte no encontrado")
  }

  revalidatePath("/reports", "page")

  return { success: true }
}

export async function dismissReport(reportId: string) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin
  await requireAdmin()
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("reports")
    .update({ deleted: true })
    .eq("id", reportId)
    .select()

  if (error) {
    throw new Error("Error al descartar el reporte")
  }

  if (!data || data.length === 0) {
    throw new Error("Reporte no encontrado")
  }

  revalidatePath("/reports", "page")

  return { success: true }
}
