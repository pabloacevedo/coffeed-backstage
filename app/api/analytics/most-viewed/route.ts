import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const supabase = createAdminSupabaseClient()

    const { data: viewsData } = await supabase
      .from("views")
      .select(`coffee_shop_id, coffee_shops(id, name, image)`)

    const viewsByShop = (viewsData as any[])?.reduce((acc: any, view: any) => {
      const shopId = view.coffee_shop_id
      if (!acc[shopId]) {
        acc[shopId] = {
          id: shopId,
          name: view.coffee_shops?.name || "Desconocida",
          image: view.coffee_shops?.image,
          views: 0,
        }
      }
      acc[shopId].views++
      return acc
    }, {})

    const allShopsData = Object.values(viewsByShop || {}) as any[]
    const sortedShops = allShopsData.sort((a: any, b: any) => b.views - a.views)

    // Paginación
    const totalCount = sortedShops.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const fromIndex = (page - 1) * pageSize
    const toIndex = fromIndex + pageSize
    const paginatedShops = sortedShops.slice(fromIndex, toIndex)

    return NextResponse.json({
      data: paginatedShops,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error("Error fetching most viewed shops:", error)
    return NextResponse.json({ error: "Error fetching most viewed shops" }, { status: 500 })
  }
}
