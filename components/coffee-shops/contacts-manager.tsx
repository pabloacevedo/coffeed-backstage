/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Phone, Instagram, Globe, Plus, Save, Trash2, MessageCircle } from "lucide-react"

interface Contact {
  id?: string
  type: "phone" | "instagram" | "web" | "whatsapp"
  value: string
}

interface ContactsManagerProps {
  coffeeShopId: string
  existingContacts: any[]
}

const contactTypes = [
  { value: "phone", label: "Teléfono", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "web", label: "Sitio Web", icon: Globe },
]

export function ContactsManager({ coffeeShopId, existingContacts }: ContactsManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [contacts, setContacts] = useState<Contact[]>(
    existingContacts.length > 0
      ? existingContacts.map((c) => ({
        id: c.id,
        type: c.type,
        value: c.value,
      }))
      : []
  )

  const handleAddContact = () => {
    setContacts([...contacts, { type: "phone", value: "" }])
  }

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const handleTypeChange = (index: number, type: string) => {
    const newContacts = [...contacts]
    newContacts[index].type = type as "phone" | "instagram" | "web" | "whatsapp"
    setContacts(newContacts)
  }

  const handleValueChange = (index: number, value: string) => {
    const newContacts = [...contacts]
    newContacts[index].value = value
    setContacts(newContacts)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Delete all existing contacts first
      if (existingContacts.length > 0) {
        const { error: deleteError } = await supabase
          .from("contacts")
          .delete()
          .eq("coffee_shop_id", coffeeShopId)

        if (deleteError) throw deleteError
      }

      // Filter out empty contacts
      const validContacts = contacts.filter((c) => c.value.trim() !== "")

      // Insert all contacts
      if (validContacts.length > 0) {
        const contactsToInsert = validContacts.map((contact) => ({
          coffee_shop_id: coffeeShopId,
          type: contact.type,
          value: contact.value.trim(),
          deleted: false,
        }))

        const { error: insertError } = await supabase
          .from("contacts")
          .insert(contactsToInsert)

        if (insertError) throw insertError
      }

      toast.success("Contactos actualizados correctamente")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar contactos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Phone className="mr-2 h-4 w-4" />
          Gestionar Contactos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Contactos</DialogTitle>
          <DialogDescription>
            Agrega o edita los métodos de contacto de la cafetería
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row gap-3 rounded-lg border p-4"
            >
              <div className="space-y-2 flex-1">
                <Label htmlFor={`type-${index}`}>Tipo</Label>
                <Select
                  value={contact.type}
                  onValueChange={(value) => handleTypeChange(index, value)}
                >
                  <SelectTrigger id={`type-${index}`}>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-[2]">
                <Label htmlFor={`value-${index}`}>Valor</Label>
                <Input
                  id={`value-${index}`}
                  type="text"
                  value={contact.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder={
                    contact.type === "phone"
                      ? "+56 9 1234 5678"
                      : contact.type === "whatsapp"
                        ? "+56 9 1234 5678"
                        : contact.type === "instagram"
                          ? "@cafeteria"
                          : "https://cafeteria.com"
                  }
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveContact(index)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={handleAddContact}
            type="button"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Contacto
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Guardando..." : "Guardar Contactos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
