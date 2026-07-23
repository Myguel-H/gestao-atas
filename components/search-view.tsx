"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import type { Ata, Item } from "@/lib/db/schema"
import { searchItemsAction, updateItemAction, deleteItemAction } from "@/app/actions/atas"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, PackageSearch, ChevronDown, ChevronUp, Edit3, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function SearchView({ atas }: { atas: Ata[] }) {
  const [selectedAtas, setSelectedAtas] = useState<number[]>(
    atas.length > 0 ? [atas[0].id] : [],
  )
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Item[] | null>(null)
  const [editRows, setEditRows] = useState<Record<number, { codigo: string; descricao: string; valorUnitario: string; marca: string; unidade: string; quantidade: string }>>({})
  const [isPending, startTransition] = useTransition()
  const [isAtaMenuOpen, setIsAtaMenuOpen] = useState(false)

  function toggleAta(ataId: number) {
    setSelectedAtas((prev) =>
      prev.includes(ataId) ? prev.filter((id) => id !== ataId) : [...prev, ataId],
    )
  }

  function startEdit(item: Item) {
    setEditRows((prev) => ({
      ...prev,
      [item.id]: {
        codigo: item.codigo,
        descricao: item.descricao,
        valorUnitario: item.valorUnitario ?? "",
        marca: item.marca ?? "",
        unidade: item.unidade ?? "",
        quantidade: item.quantidade ?? "",
      },
    }))
  }

  function cancelEdit(itemId: number) {
    setEditRows((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  function updateDraft(itemId: number, field: keyof typeof editRows[number], value: string) {
    setEditRows((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))
  }

  function saveItem(itemId: number) {
    const draft = editRows[itemId]
    if (!draft) return

    startTransition(async () => {
      try {
        const res = await updateItemAction({
          itemId,
          codigo: draft.codigo,
          descricao: draft.descricao,
          valorUnitario: draft.valorUnitario,
          marca: draft.marca,
          unidade: draft.unidade,
          quantidade: draft.quantidade,
        })

        if (res.ok) {
          setResults((prev) =>
            prev
              ? prev.map((item) =>
                  item.id === itemId ? { ...item, ...draft } : item,
                )
              : prev,
          )
          cancelEdit(itemId)
          toast.success("Item atualizado com sucesso.")
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.error(err)
        toast.error("Falha ao atualizar o item. Tente novamente.")
      }
    })
  }

  function deleteItem(itemId: number) {
    const confirmed = window.confirm("Deseja excluir este item? Esta ação não pode ser desfeita.")
    if (!confirmed) return

    startTransition(async () => {
      try {
        const res = await deleteItemAction({ itemId })
        if (res.ok) {
          setResults((prev) => prev ? prev.filter((item) => item.id !== itemId) : prev)
          cancelEdit(itemId)
          toast.success("Item excluído com sucesso.")
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.error(err)
        toast.error("Falha ao excluir o item. Tente novamente.")
      }
    })
  }

  function runSearch() {
    if (selectedAtas.length === 0) return
    startTransition(async () => {
      const items = await searchItemsAction({
        ataIds: selectedAtas,
        query,
      })
      setResults(items)
      setIsAtaMenuOpen(false)
    })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    runSearch()
  }

  if (atas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <PackageSearch className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Nenhuma ata cadastrada</p>
            <p className="text-sm text-muted-foreground">
              Cadastre uma ata para começar a consultar os itens.
            </p>
          </div>
          <Link href="/atas/nova">
            <Button>Cadastrar ata</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-visible">
        <CardContent className="pt-6 overflow-visible">
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(24rem,1fr)_minmax(28rem,1fr)]">
              <div className="flex flex-col gap-1.5">
                <Label>Atas</Label>
                <div className="relative inline-block text-left w-full overflow-visible">
                  <button
                    type="button"
                    onClick={() => setIsAtaMenuOpen((prev) => !prev)}
                    className="inline-flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm hover:bg-muted"
                  >
                    <span className="truncate">
                      {selectedAtas.length === 0
                        ? "Selecione as atas"
                        : `${selectedAtas.length} ata${selectedAtas.length > 1 ? "s" : ""} selecionada${selectedAtas.length > 1 ? "s" : ""}`}
                    </span>
                    {isAtaMenuOpen ? (
                      <ChevronUp className="ml-2 h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="ml-2 h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {isAtaMenuOpen && (
                    <div
                      className="absolute left-0 right-0 z-10 mt-2 max-h-[50vh] overflow-y-auto rounded-lg border border-input bg-popover p-2 shadow-lg"
                      onWheel={(e) => {
                        const target = e.currentTarget
                        target.scrollTop += e.deltaY
                      }}
                    >
                      {atas.map((a) => {
                        const label = `${a.numero}${a.modelo === "antigo" ? " (Antiga)" : " (Nova)"}${a.descricao ? ` — ${a.descricao}` : ""}`
                        const checked = selectedAtas.includes(a.id)
                        return (
                          <label
                            key={a.id}
                            className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAta(a.id)}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                            />
                            <span className="truncate">{label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="q">Busca</Label>
                <Input
                  id="q"
                  placeholder="Ex: sonda, empresa ou código"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Selecione as atas e clique em Buscar para listar os itens das atas escolhidas.
              </p>
              <Button type="submit" disabled={isPending || selectedAtas.length === 0} className="w-full sm:w-auto">
                <Search className="mr-1.5 h-4 w-4" />
                {isPending ? "Buscando" : "Buscar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <ResultsList
          results={results}
          query={query}
          editRows={editRows}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveItem={saveItem}
          onDeleteItem={deleteItem}
          onUpdateDraft={updateDraft}
        />
      )}
    </div>
  )
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escaped})`, "gi")
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="rounded bg-yellow-200 px-0.5 text-current">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

function ResultsList({
  results,
  query,
  editRows,
  onStartEdit,
  onCancelEdit,
  onSaveItem,
  onDeleteItem,
  onUpdateDraft,
}: {
  results: Item[]
  query: string
  editRows: Record<number, { codigo: string; descricao: string; valorUnitario: string; marca: string; unidade: string; quantidade: string }>
  onStartEdit: (item: Item) => void
  onCancelEdit: (itemId: number) => void
  onSaveItem: (itemId: number) => void
  onDeleteItem: (itemId: number) => void
  onUpdateDraft: (itemId: number, field: keyof typeof editRows[number], value: string) => void
}) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum item encontrado para esse código nesta ata.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "item encontrado" : "itens encontrados"}
      </p>
      {results.map((item) => {
        const draft = editRows[item.id]
        const isEditing = Boolean(draft)

        return (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p>Cód Material : </p>
                  <span className="rounded-md bg-accent px-2.5 py-1 font-mono text-sm font-semibold text-accent-foreground">
                    {item.codigo}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {item.valorUnitario && !isEditing && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valor unitário</p>
                      <p className="text-lg font-semibold text-foreground">
                        R$ {item.valorUnitario}
                      </p>
                    </div>
                  )}
                  {!isEditing ? (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onStartEdit(item)}>
                        <Edit3 className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => onDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => onSaveItem(item.id)}>
                        Salvar
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onCancelEdit(item.id)}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`codigo-${item.id}`}>Código</Label>
                    <Input
                      id={`codigo-${item.id}`}
                      value={draft.codigo}
                      onChange={(e) => onUpdateDraft(item.id, "codigo", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`valorUnitario-${item.id}`}>Valor unitário</Label>
                    <Input
                      id={`valorUnitario-${item.id}`}
                      value={draft.valorUnitario}
                      onChange={(e) => onUpdateDraft(item.id, "valorUnitario", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`marca-${item.id}`}>Marca</Label>
                    <Input
                      id={`marca-${item.id}`}
                      value={draft.marca}
                      onChange={(e) => onUpdateDraft(item.id, "marca", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`unidade-${item.id}`}>Unidade Med.</Label>
                    <Input
                      id={`unidade-${item.id}`}
                      value={draft.unidade}
                      onChange={(e) => onUpdateDraft(item.id, "unidade", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor={`quantidade-${item.id}`}>Quantidade</Label>
                    <Input
                      id={`quantidade-${item.id}`}
                      value={draft.quantidade}
                      onChange={(e) => onUpdateDraft(item.id, "quantidade", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor={`descricao-${item.id}`}>Descrição</Label>
                    <Input
                      id={`descricao-${item.id}`}
                      value={draft.descricao}
                      onChange={(e) => onUpdateDraft(item.id, "descricao", e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    {highlightText(item.descricao, query)}
                  </p>
                  <br />
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    {item.marca && (
                      <span>Marca do item: {highlightText(item.marca, query)}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    {item.unidade && <span>Unidade Med. : {item.unidade}</span>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
