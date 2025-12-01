"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Eye, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CoffeeShop {
  id: string
  name: string
  image: string | null
}

interface TopRatedShop extends CoffeeShop {
  avgRating: number
  reviewCount: number
}

interface MostViewedShop extends CoffeeShop {
  views: number
}

interface MostSharedShop extends CoffeeShop {
  shares: number
}

// Top Rated Coffee Shops Card
export function TopRatedCard({ shops }: { shops: TopRatedShop[] }) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [allShops, setAllShops] = useState<TopRatedShop[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 20

  const loadAllShops = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/top-rated?page=${page}&pageSize=${pageSize}`)
      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setAllShops(result.data)
      setTotalPages(result.pagination.totalPages)
      setCurrentPage(result.pagination.page)
    } catch (error) {
      console.error("Error loading shops:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowMore = async () => {
    await loadAllShops(1)
    setShowAllModal(true)
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      await loadAllShops(newPage)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            Cafeterías mejor calificadas
          </CardTitle>
          <CardDescription>Top 10 cafeterías con mejor calificación promedio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shops.length > 0 ? (
              <>
                {shops.map((shop, index) => (
                  <div key={shop.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    {shop.image ? (
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shop.reviewCount} reseñas
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{shop.avgRating}</span>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Ver todas las cafeterías
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Todas las Cafeterías Calificadas
            </DialogTitle>
            <DialogDescription>
              Todas las cafeterías con reseñas ordenadas por calificación
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando cafeterías...
            </div>
          ) : (
            <>
              <div className="space-y-4 mt-4">
                {allShops.map((shop, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1
                  return (
                    <div key={shop.id} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        {globalIndex}
                      </div>
                      {shop.image ? (
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{shop.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {shop.reviewCount} reseñas
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{shop.avgRating}</span>
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

// Most Viewed Coffee Shops Card
export function MostViewedCard({ shops }: { shops: MostViewedShop[] }) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [allShops, setAllShops] = useState<MostViewedShop[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 20

  const loadAllShops = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/most-viewed?page=${page}&pageSize=${pageSize}`)
      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setAllShops(result.data)
      setTotalPages(result.pagination.totalPages)
      setCurrentPage(result.pagination.page)
    } catch (error) {
      console.error("Error loading shops:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowMore = async () => {
    await loadAllShops(1)
    setShowAllModal(true)
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      await loadAllShops(newPage)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Cafeterías más vistas
          </CardTitle>
          <CardDescription>Top 10 cafeterías con más visualizaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shops.length > 0 ? (
              <>
                {shops.map((shop: any, index) => (
                  <div key={shop.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 font-bold text-purple-600 dark:text-purple-400">
                      {index + 1}
                    </div>
                    {shop.image ? (
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{shop.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-bold">{shop.views}</span>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Ver todas las cafeterías
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Todas las Cafeterías por Vistas
            </DialogTitle>
            <DialogDescription>
              Todas las cafeterías ordenadas por número de visualizaciones
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando cafeterías...
            </div>
          ) : (
            <>
              <div className="space-y-4 mt-4">
                {allShops.map((shop, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1
                  return (
                    <div key={shop.id} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 font-bold text-purple-600 dark:text-purple-400">
                        {globalIndex}
                      </div>
                      {shop.image ? (
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{shop.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-bold">{shop.views}</span>
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

// Most Shared Coffee Shops Card
export function MostSharedCard({ shops }: { shops: MostSharedShop[] }) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [allShops, setAllShops] = useState<MostSharedShop[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 20

  const loadAllShops = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/most-shared?page=${page}&pageSize=${pageSize}`)
      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setAllShops(result.data)
      setTotalPages(result.pagination.totalPages)
      setCurrentPage(result.pagination.page)
    } catch (error) {
      console.error("Error loading shops:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowMore = async () => {
    await loadAllShops(1)
    setShowAllModal(true)
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      await loadAllShops(newPage)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            Cafeterías más compartidas
          </CardTitle>
          <CardDescription>Top 10 cafeterías más compartidas por los usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shops.length > 0 ? (
              <>
                {shops.map((shop: any, index) => (
                  <div key={shop.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 font-bold text-green-600 dark:text-green-400">
                      {index + 1}
                    </div>
                    {shop.image ? (
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{shop.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-bold">{shop.shares}</span>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Ver todas las cafeterías
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Todas las Cafeterías por Compartidos
            </DialogTitle>
            <DialogDescription>
              Todas las cafeterías ordenadas por número de veces compartidas
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando cafeterías...
            </div>
          ) : (
            <>
              <div className="space-y-4 mt-4">
                {allShops.map((shop, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1
                  return (
                    <div key={shop.id} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 font-bold text-green-600 dark:text-green-400">
                        {globalIndex}
                      </div>
                      {shop.image ? (
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{shop.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-bold">{shop.shares}</span>
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
