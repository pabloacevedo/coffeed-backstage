import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    const supabase = createAdminSupabaseClient()

    // Primero obtener el total
    const { count } = await supabase
      .from("user_activity_logs")
      .select("*", { count: "exact", head: true })

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    // Obtener la página actual
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data } = await supabase
      .from("user_activity_logs")
      .select("id, event_type, created_at, metadata, device_info, user_id")
      .order("created_at", { ascending: false })
      .range(from, to)

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Error fetching activities" }, { status: 500 })
  }
}
