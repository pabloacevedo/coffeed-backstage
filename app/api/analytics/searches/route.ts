import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    const supabase = createAdminSupabaseClient()

    // Obtener todas las búsquedas
    const { data: allSearchData } = await supabase
      .from("user_activity_logs")
      .select("metadata")
      .eq("event_type", "search")
      .order("created_at", { ascending: false })

    const searchCounts: Record<string, { count: number; totalResults: number }> = {}
    allSearchData?.forEach((log: any) => {
      const metadata = log.metadata as any
      const query = metadata?.search_query
      if (query) {
        if (!searchCounts[query]) {
          searchCounts[query] = { count: 0, totalResults: 0 }
        }
        searchCounts[query].count++
        searchCounts[query].totalResults += metadata?.results_count || 0
      }
    })

    const allSearchesData = Object.entries(searchCounts)
      .map(([query, data]) => ({
        query,
        search_count: data.count,
        avg_results: (data.totalResults / data.count).toFixed(1),
      }))
      .sort((a, b) => b.search_count - a.search_count)

    // Paginación
    const totalCount = allSearchesData.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const fromIndex = (page - 1) * pageSize
    const toIndex = fromIndex + pageSize
    const paginatedSearches = allSearchesData.slice(fromIndex, toIndex)

    return NextResponse.json({
      data: paginatedSearches,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error("Error fetching searches:", error)
    return NextResponse.json({ error: "Error fetching searches" }, { status: 500 })
  }
}
