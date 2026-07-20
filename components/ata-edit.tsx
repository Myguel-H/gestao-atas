"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateAtaAction } from "@/app/actions/atas"
import type { Ata, Item } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Loader2 } from "lucide-react"

type ItemRow = Omit<Item, "id"> & { id?: number; key: string }

type AtaEditProps = {
  ata: Ata
  items: Item[]
}

const emptyRow = (): ItemRow => ({
  key: crypto.randomUUID(),
  ataId: 0,
  codigo: "",
  descricao: "",
  valorUnitario: "",
  marca: "",
  unidade: "",
  quantidade: "",
  createdAt: new Date(0),
})

export function AtaEdit({ ata, items }: AtaEditProps) {
  const router = useRouter()
  const [numero, setNumero] = useState(ata.numero)
  const [descricao, setDescricao] = useState(ata.descricao ?? "")
  const [modelo, setModelo] = useState<"novo" | "antigo">(ata.modelo === "antigo" ? "antigo" : "novo")
  const [rows, setRows] = useState<ItemRow[]>(
    items.map((item) => ({ ...item, key: crypto.randomUUID() })),
  )
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([])
  const [saving, startSaving] = useTransition()

  function updateRow(id: string, field: keyof Item, value: string) {
    setRows((prev) =>
      prev.map((row) => (row.key === id ? { ...row, [field]: value } : row)),
    )
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const row = prev.find((item) => item.key === id)
      if (row?.id) {
        setDeletedItemIds((prevIds) => [...prevIds, row.id!])
      }
      return prev.filter((item) => item.key !== id)
    })
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function save() {
    startSaving(async () => {
      try {
        const res = await updateAtaAction({
          ataId: ata.id,
          numero,
          descricao,
          modelo,
          items: rows.map(({ key, ...rest }) => rest),
          deletedItemIds,
        })
        if (res.ok) {
          toast.success("Ata atualizada com sucesso.")
          router.push("/atas")
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.log("[v0] Falha ao atualizar ata:", err)
        toast.error("Não foi possível atualizar a ata. Tente novamente.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar ata</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numero">Número da ata *</Label>
              <Input
                id="numero"
                placeholder="Ex: 02/2026"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="desc">Descrição (opcional)</Label>
              <Input
                id="desc"
                placeholder="Ex: Insumos de enfermagem"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modelo">Modelo da ata</Label>
              <Select value={modelo} onValueChange={(value) => setModelo(value as "novo" | "antigo")}> 
                <SelectTrigger id="modelo">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo (2026+)</SelectItem>
                  <SelectItem value="antigo">Antigo (até 2025)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Se o PDF estiver no formato antigo sem texto pesquisável, selecione "Antigo" antes de reenviar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Itens da ata ({rows.length})</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar item
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {rows.map((row, idx) => (
            <div key={row.key} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Item {idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive hover:text-destructive"
                  onClick={() => removeRow(row.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Código"
                  value={row.codigo}
                  onChange={(v) => updateRow(row.key, "codigo", v)}
                />
                <Field
                  label="Marca"
                  value={row.marca ?? ""}
                  onChange={(v) => updateRow(row.key, "marca", v)}
                />
                <Field
                  label="Valor unitário"
                  value={row.valorUnitario ?? ""}
                  onChange={(v) => updateRow(row.key, "valorUnitario", v)}
                />
                <Field
                  label="Unidade"
                  value={row.unidade ?? ""}
                  onChange={(v) => updateRow(row.key, "unidade", v)}
                />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Descritivo</Label>
                <textarea
                  value={row.descricao}
                  onChange={(e) => updateRow(row.key, "descricao", e.target.value)}
                  rows={2}
                  className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/atas")} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Salvar ata
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
