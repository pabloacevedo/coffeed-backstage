import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const supabase = createAdminSupabaseClient()

    const { data: sharesData } = await supabase
      .from("user_activity_logs")
      .select("*")
      .eq("event_type", "share_shop")

    const sharesByShopId: Record<string, number> = {}
    sharesData?.forEach((log) => {
      const metadata = log.metadata as any
      const shopId = metadata?.shop_id
      if (shopId) {
        sharesByShopId[shopId] = (sharesByShopId[shopId] || 0) + 1
      }
    })

    const shopIds = Object.keys(sharesByShopId)

    if (shopIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page: 1,
          pageSize,
          totalPages: 0,
          totalCount: 0
        }
      })
    }

    const { data: shopsData } = await supabase
      .from("coffee_shops")
      .select("id, name, image")
      .in("id", shopIds)
      .eq("deleted", false)

    const allShopsData = shopsData?.map(shop => ({
      id: shop.id,
      name: shop.name,
      image: shop.image,
      shares: sharesByShopId[shop.id]
    })).sort((a, b) => b.shares - a.shares) || []

    // Paginación
    const totalCount = allShopsData.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const fromIndex = (page - 1) * pageSize
    const toIndex = fromIndex + pageSize
    const paginatedShops = allShopsData.slice(fromIndex, toIndex)

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
    console.error("Error fetching most shared shops:", error)
    return NextResponse.json({ error: "Error fetching most shared shops" }, { status: 500 })
  }
}
