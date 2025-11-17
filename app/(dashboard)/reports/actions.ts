"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function resolveReport(reportId: string) {
  console.log("[Server Action] Resolving report:", reportId)
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", reportId)
    .select()

  if (error) {
    console.error("[Server Action] Error resolving report:", error)
    throw new Error(error.message)
  }

  console.log("[Server Action] Report resolved successfully:", data)
  console.log("[Server Action] Revalidating path: /reports")

  revalidatePath("/reports", "page")

  return { success: true }
}

export async function dismissReport(reportId: string) {
  console.log("[Server Action] Dismissing report:", reportId)
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("reports")
    .update({ deleted: true })
    .eq("id", reportId)
    .select()

  if (error) {
    console.error("[Server Action] Error dismissing report:", error)
    throw new Error(error.message)
  }

  console.log("[Server Action] Report dismissed successfully:", data)
  console.log("[Server Action] Revalidating path: /reports")

  revalidatePath("/reports", "page")

  return { success: true }
}
