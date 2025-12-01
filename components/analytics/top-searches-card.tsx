"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SearchStat {
  query: string
  search_count: number
  avg_results: string
}

interface TopSearchesCardProps {
  searches: SearchStat[]
}

export function TopSearchesCard({ searches }: TopSearchesCardProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [allSearches, setAllSearches] = useState<SearchStat[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 50

  const loadAllSearches = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/searches?page=${page}&pageSize=${pageSize}`)
      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setAllSearches(result.data)
      setTotalPages(result.pagination.totalPages)
      setCurrentPage(result.pagination.page)
    } catch (error) {
      console.error("Error loading searches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowMore = async () => {
    await loadAllSearches(1)
    setShowAllModal(true)
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      await loadAllSearches(newPage)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Búsquedas Más Comunes
          </CardTitle>
          <CardDescription>Términos más buscados por los usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {searches.length > 0 ? (
              <>
                {searches.map((search: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{search.query || "Sin texto"}</p>
                        <p className="text-xs text-muted-foreground">
                          Promedio: {search.avg_results} resultados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{search.search_count}</p>
                      <p className="text-xs text-muted-foreground">búsquedas</p>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Ver todas las búsquedas
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay datos de búsquedas aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Todas las Búsquedas
            </DialogTitle>
            <DialogDescription>
              Historial completo de búsquedas ordenado por frecuencia
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando búsquedas...
            </div>
          ) : (
            <>
              <div className="space-y-3 mt-4">
                {allSearches.map((search, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {globalIndex}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{search.query || "Sin texto"}</p>
                          <p className="text-xs text-muted-foreground">
                            Promedio: {search.avg_results} resultados
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{search.search_count}</p>
                        <p className="text-xs text-muted-foreground">búsquedas</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
