import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Star as StarIcon, Coffee } from "lucide-react"

async function getReviews() {
  const supabase = await createServerSupabaseClient()

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      profiles(full_name, avatar_url),
      coffee_shops(name, image)
    `)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(50)

  return (reviews || []) as any[]
}

async function ReviewsContent() {
  const reviews = await getReviews()

  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {review.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{review.profiles?.full_name || "Usuario"}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coffee className="h-3 w-3" />
                    <span>{review.coffee_shops?.name}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          {review.comment && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <StarIcon className="h-8 w-8 fill-yellow-400 text-yellow-400" />
          Reseñas
        </h1>
        <p className="text-muted-foreground">
          Todas las reseñas de usuarios sobre cafeterías
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ReviewsContent />
      </Suspense>
    </div>
  )
}
