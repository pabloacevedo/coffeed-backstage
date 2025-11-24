"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, Coffee, Search } from "lucide-react"
import { EditUserDialog } from "./edit-user-dialog"

type User = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  created_at: string
  isAdmin?: boolean
  reviewsCount: number
  bookmarksCount: number
}

export function UsersList({ users }: { users: User[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users

    const query = searchQuery.toLowerCase()
    return users.filter((user) => {
      const name = (user.full_name || "").toLowerCase()
      const email = (user.email || "").toLowerCase()
      return name.includes(query) || email.includes(query)
    })
  }, [users, searchQuery])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o correo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/users/${user.id}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {user.full_name || "Usuario sin nombre"}
                      </p>
                      {user.isAdmin && (
                        <Badge variant="default" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Miembro desde{" "}
                      {new Date(user.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{user.reviewsCount}</span>
                      <span className="text-muted-foreground hidden sm:inline">reseñas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{user.bookmarksCount}</span>
                      <span className="text-muted-foreground hidden sm:inline">listas</span>
                    </div>
                  </div>
                  <EditUserDialog user={user} />
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery
                  ? "No se encontraron usuarios con ese criterio"
                  : "No hay usuarios registrados"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {searchQuery && filteredUsers.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredUsers.length} de {users.length} usuario{users.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
