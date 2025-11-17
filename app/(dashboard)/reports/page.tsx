import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Flag, Coffee, Clock, Edit, PowerOff } from "lucide-react"
import { ReportActions } from "@/components/reports/report-actions"
import { ReportCoffeeShopActions } from "@/components/reports/report-coffee-shop-actions"
import Link from "next/link"

async function getReports(coffeeShopId?: string) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from("reports")
    .select(`
      *,
      coffee_shops(name, image)
    `)
    .order("created_at", { ascending: false })

  // Filter by coffee shop if provided
  if (coffeeShopId) {
    query = query.eq("coffee_shop_id", coffeeShopId)
  }

  const { data: reports, error } = await query

  if (error) {
    console.error("[getReports] Error fetching reports:", error)
    return []
  }

  console.log("[getReports] Fetched reports count:", reports?.length || 0)
  console.log("[getReports] Reports status distribution:", {
    pending: reports?.filter(r => r.status === 'pending' && !r.deleted).length || 0,
    resolved: reports?.filter(r => r.status === 'resolved' && !r.deleted).length || 0,
    deleted: reports?.filter(r => r.deleted).length || 0,
  })

  return (reports || []) as any[]
}

async function ReportsContent({ coffeeShopId, coffeeShopName }: { coffeeShopId?: string; coffeeShopName?: string }) {
  const reports = await getReports(coffeeShopId)
  // Filter out deleted reports
  const activeReports = reports.filter((r) => !r.deleted)
  const pendingReports = activeReports.filter((r) => r.status === "pending")
  const resolvedReports = activeReports.filter((r) => r.status === "resolved")

  const ReportCard = ({ report }: { report: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Flag className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{report.coffee_shops?.name || "Cafetería"}</p>
                <Badge variant={report.status === "pending" ? "destructive" : "secondary"}>
                  {report.status === "pending" ? "Pendiente" : "Resuelto"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{report.report_type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(report.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.description && (
          <p className="text-sm text-muted-foreground">{report.description}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/coffee-shops/${report.coffee_shop_id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar cafetería
            </Link>
          </Button>
          <ReportCoffeeShopActions
            coffeeShopId={report.coffee_shop_id}
            coffeeShopName={report.coffee_shops?.name || "Cafetería"}
          />
        </div>

        {report.status === "pending" && (
          <div className="pt-2 border-t">
            <ReportActions reportId={report.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending">
          Pendientes ({pendingReports.length})
        </TabsTrigger>
        <TabsTrigger value="resolved">
          Resueltos ({resolvedReports.length})
        </TabsTrigger>
        <TabsTrigger value="all">Todos ({activeReports.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {pendingReports.length > 0 ? (
          pendingReports.map((report) => <ReportCard key={report.id} report={report} />)
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No hay reportes pendientes
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="resolved" className="space-y-4">
        {resolvedReports.length > 0 ? (
          resolvedReports.map((report) => <ReportCard key={report.id} report={report} />)
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No hay reportes resueltos
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        {activeReports.length > 0 ? (
          activeReports.map((report) => <ReportCard key={report.id} report={report} />)
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No hay reportes
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ coffee_shop?: string }>
}) {
  const params = await searchParams
  const coffeeShopId = params.coffee_shop

  // Get coffee shop name if filtering
  let coffeeShopName = null
  if (coffeeShopId) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from("coffee_shops")
      .select("name")
      .eq("id", coffeeShopId)
      .single()
    coffeeShopName = data?.name
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Flag className="h-8 w-8 text-red-600" />
          Reportes
          {coffeeShopName && (
            <span className="text-2xl text-muted-foreground">- {coffeeShopName}</span>
          )}
        </h1>
        <p className="text-muted-foreground">
          {coffeeShopName
            ? `Reportes de ${coffeeShopName}`
            : "Gestiona reportes de información incorrecta sobre cafeterías"
          }
        </p>
        {coffeeShopId && (
          <Button variant="outline" size="sm" asChild className="mt-2">
            <Link href="/reports">
              Ver todos los reportes
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ReportsContent coffeeShopId={coffeeShopId} coffeeShopName={coffeeShopName || undefined} />
      </Suspense>
    </div>
  )
}
