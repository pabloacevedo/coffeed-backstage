import { Suspense } from "react"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { Skeleton } from "@/components/ui/skeleton"
import { Users as UsersIcon } from "lucide-react"
import { UsersList } from "@/components/users/users-list"

async function getUsers() {
  const supabase = createAdminSupabaseClient()

  // Get all profiles - explicitly set a high limit to ensure we get all users
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000) // Set high limit to get all users

  if (error || !profiles) {
    console.error("Error fetching profiles:", error)
    return []
  }

  console.log(`📊 Total perfiles encontrados: ${profiles.length}`)

  // Get stats, email, and admin status for each user
  const usersWithStats = await Promise.all(
    profiles.map(async (profile) => {
      try {
        // Get user email and metadata from auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

        if (authError) {
          console.warn(`⚠️ Error obteniendo auth user para ${profile.id}:`, authError)
        }

        const [{ count: reviewsCount }, { count: bookmarksCount }] = await Promise.all([
          supabase
            .from("reviews")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .eq("deleted", false),
          supabase
            .from("bookmark_lists")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .eq("deleted", false),
        ])

        return {
          ...profile,
          email: authUser?.user?.email || "",
          isAdmin: authUser?.user?.user_metadata?.is_admin || false,
          reviewsCount: reviewsCount || 0,
          bookmarksCount: bookmarksCount || 0,
        }
      } catch (error) {
        console.error(`❌ Error procesando usuario ${profile.id}:`, error)
        // Return user with default values if there's an error
        return {
          ...profile,
          email: "",
          isAdmin: false,
          reviewsCount: 0,
          bookmarksCount: 0,
        }
      }
    })
  )

  console.log(`✅ Usuarios procesados: ${usersWithStats.length}`)

  return usersWithStats
}

async function UsersContent() {
  const users = await getUsers()
  return <UsersList users={users} />
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          Usuarios
        </h1>
        <p className="text-muted-foreground">
          Todos los usuarios registrados en la plataforma
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <UsersContent />
      </Suspense>
    </div>
  )
}
