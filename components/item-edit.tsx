"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateItemAction } from "@/app/actions/atas"
import type { Ata, Item } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type ItemEditProps = {
  ata: Ata
  item: Item
}

export function ItemEdit({ ata, item }: ItemEditProps) {
  const router = useRouter()
  const [codigo, setCodigo] = useState(item.codigo)
  const [descricao, setDescricao] = useState(item.descricao)
  const [valorUnitario, setValorUnitario] = useState(item.valorUnitario ?? "")
  const [marca, setMarca] = useState(item.marca ?? "")
  const [unidade, setUnidade] = useState(item.unidade ?? "")
  const [quantidade, setQuantidade] = useState(item.quantidade ?? "")
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      try {
        const res = await updateItemAction({
          itemId: item.id,
          codigo,
          descricao,
          valorUnitario,
          marca,
          unidade,
          quantidade,
        })

        if (res.ok) {
          toast.success("Item atualizado com sucesso.")
          router.push(`/atas/${ata.id}`)
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.log("[v0] Falha ao atualizar item:", err)
        toast.error("Não foi possível atualizar o item. Tente novamente.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Editar item da ata {ata.numero}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valorUnitario">Valor unitário</Label>
            <Input
              id="valorUnitario"
              value={valorUnitario}
              onChange={(e) => setValorUnitario(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unidade">Unidade Med.</Label>
            <Input
              id="unidade"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantidade">Quantidade</Label>
          <Input
            id="quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descricao">Descrição *</Label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/atas/${ata.id}`)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Salvar item
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
