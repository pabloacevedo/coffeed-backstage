import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    const supabase = createAdminSupabaseClient()

    // Obtener todos los dispositivos
    let allDevices: any[] = []
    let from = 0
    const fetchSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("device_info, created_at")
        .range(from, from + fetchSize - 1)

      if (error || !data || data.length === 0) {
        hasMore = false
      } else {
        allDevices = [...allDevices, ...data]
        from += fetchSize
        hasMore = data.length === fetchSize
      }
    }

    // Agrupar por modelo
    const deviceData: Record<string, { count: number; lastActivity: string }> = {}
    allDevices.forEach((log: any) => {
      const deviceInfo = log.device_info as any
      const modelIdentifier = deviceInfo?.modelName || deviceInfo?.modelId || "Desconocido"

      if (!deviceData[modelIdentifier]) {
        deviceData[modelIdentifier] = { count: 0, lastActivity: log.created_at }
      }

      deviceData[modelIdentifier].count++

      if (new Date(log.created_at) > new Date(deviceData[modelIdentifier].lastActivity)) {
        deviceData[modelIdentifier].lastActivity = log.created_at
      }
    })

    // Convertir a array y ordenar
    const allDevicesArray = Object.entries(deviceData)
      .map(([model, data]) => ({
        model,
        count: data.count,
        lastActivity: data.lastActivity
      }))
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

    // Paginación
    const totalCount = allDevicesArray.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const fromIndex = (page - 1) * pageSize
    const toIndex = fromIndex + pageSize
    const paginatedDevices = allDevicesArray.slice(fromIndex, toIndex)

    return NextResponse.json({
      data: paginatedDevices,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Error fetching devices" }, { status: 500 })
  }
}
