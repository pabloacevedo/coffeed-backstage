import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "30")

    const supabase = createAdminSupabaseClient()

    // Obtener últimos 90 días de actividad
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: activityData } = await supabase
      .from("user_activity_logs")
      .select("user_id, created_at")
      .eq("event_type", "app_open")
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: false })

    const activityByDay: Record<string, { users: Set<string>; opens: number }> = {}
    activityData?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split("T")[0]
      if (!activityByDay[date]) {
        activityByDay[date] = { users: new Set(), opens: 0 }
      }
      if (log.user_id) activityByDay[date].users.add(log.user_id)
      activityByDay[date].opens++
    })

    const allActivitiesData = Object.entries(activityByDay)
      .map(([date, data]) => ({
        date,
        unique_users: data.users.size,
        total_opens: data.opens,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Paginación
    const totalCount = allActivitiesData.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const fromIndex = (page - 1) * pageSize
    const toIndex = fromIndex + pageSize
    const paginatedActivities = allActivitiesData.slice(fromIndex, toIndex)

    return NextResponse.json({
      data: paginatedActivities,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error("Error fetching daily activity:", error)
    return NextResponse.json({ error: "Error fetching daily activity" }, { status: 500 })
  }
}
