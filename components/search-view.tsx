"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import type { Ata, Item } from "@/lib/db/schema"
import { searchItemsAction } from "@/app/actions/atas"
import { Card, CardContent } from "@/components/ui/card"
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
import { Search, PackageSearch } from "lucide-react"

export function SearchView({ atas }: { atas: Ata[] }) {
  const [ataId, setAtaId] = useState<string>(
    atas.length > 0 ? String(atas[0].id) : "",
  )
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Item[] | null>(null)
  const [isPending, startTransition] = useTransition()

  function runSearch() {
    if (!ataId) return
    startTransition(async () => {
      const items = await searchItemsAction({
        ataId: Number(ataId),
        query,
      })
      setResults(items)
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
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4 md:flex-row md:items-end"
          >
            <div className="flex flex-col gap-1.5 md:w-64">
              <Label htmlFor="ata">Ata</Label>
              <Select
                value={ataId}
                onValueChange={(value) => setAtaId(value ?? "")}
              >
                <SelectTrigger id="ata">
                  <SelectValue placeholder="Selecione a ata" />
                </SelectTrigger>
                <SelectContent>
                  {atas.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.numero}
                      {a.modelo === "antigo" ? " (Antiga)" : " (Nova)"}
                      {a.descricao ? ` — ${a.descricao}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="q">Código do item</Label>
              <Input
                id="q"
                inputMode="numeric"
                placeholder="Ex: 5100"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending} className="md:w-32">
              <Search className="mr-1.5 h-4 w-4" />
              {isPending ? "Buscando" : "Buscar"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Deixe o código em branco e clique em Buscar para listar todos os itens da ata.
          </p>
        </CardContent>
      </Card>

      {results !== null && <ResultsList results={results} />}
    </div>
  )
}

function ResultsList({ results }: { results: Item[] }) {
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
      {results.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-accent px-2.5 py-1 font-mono text-sm font-semibold text-accent-foreground">
                  {item.codigo}
                </span>
                {item.marca && (
                  <span className="text-sm text-muted-foreground">
                    {item.marca}
                  </span>
                )}
              </div>
              {item.valorUnitario && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor unitário</p>
                  <p className="text-lg font-semibold text-foreground">
                    R$ {item.valorUnitario}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {item.descricao}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              {item.unidade && <span>Unidade: {item.unidade}</span>}
              {item.quantidade && <span>Qtd. registrada: {item.quantidade}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
