import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const supabase = createAdminSupabaseClient()

    const { data: topRated } = await supabase
      .from("coffee_shops")
      .select(`id, name, image, reviews(rating)`)
      .eq("deleted", false)
      .eq("active", true)

    const shopsWithRatings = (topRated as any[])
      ?.map((shop) => {
        const ratings = shop.reviews?.map((r: any) => r.rating) || []
        const avgRating = ratings.length > 0
          ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
          : 0
        return {
          id: shop.id,
          name: shop.name,
          image: shop.image,
          avgRating: Number(avgRating.toFixed(2)),
          reviewCount: ratings.length,
        }
      })
      .filter(shop => shop.reviewCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating) || []

    // Paginación
    const totalCount = shopsWithRatings.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const fromIndex = (page - 1) * pageSize
    const toIndex = fromIndex + pageSize
    const paginatedShops = shopsWithRatings.slice(fromIndex, toIndex)

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
    console.error("Error fetching top rated shops:", error)
    return NextResponse.json({ error: "Error fetching top rated shops" }, { status: 500 })
  }
}
