import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CoffeeShopsTable } from "@/components/coffee-shops/coffee-shops-table"

export default function CoffeeShopsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cafeterías</h1>
          <p className="text-muted-foreground">
            Gestiona todas las cafeterías de la plataforma
          </p>
        </div>
        <Button asChild>
          <Link href="/coffee-shops/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cafetería
          </Link>
        </Button>
      </div>

      <CoffeeShopsTable />
    </div>
  )
}
