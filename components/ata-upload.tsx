"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { parsePdfAction, saveAtaAction } from "@/app/actions/atas"
import type { ParsedItem } from "@/lib/pdf-parser"
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
import { Upload, Plus, Trash2, Loader2, FileText } from "lucide-react"

type Row = ParsedItem & { key: string }

const emptyRow = (): Row => ({
  key: crypto.randomUUID(),
  codigo: "",
  descricao: "",
  valorUnitario: "",
  marca: "",
  unidade: "",
  quantidade: "",
})

export function AtaUpload() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [numero, setNumero] = useState("")
  const [descricao, setDescricao] = useState("")
  const [modelo, setModelo] = useState<"novo" | "antigo">("novo")
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<Row[] | null>(null)
  const [parsing, startParsing] = useTransition()
  const [saving, startSaving] = useTransition()

  function handleFile(file: File) {
    const MAX_MB = 25
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`O PDF tem mais de ${MAX_MB}MB. Envie um arquivo menor.`)
      return
    }
    setFileName(file.name)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("modelo", modelo)
    startParsing(async () => {
      try {
        const res = await parsePdfAction(formData)
        if (res.ok) {
          setRows(res.items.map((i) => ({ ...i, key: crypto.randomUUID() })))
          toast.success(`${res.items.length} itens extraídos. Revise antes de salvar.`)
        } else {
          setRows([emptyRow()])
          toast.error(res.error)
        }
      } catch (err) {
        console.log("[v0] Falha no parsePdfAction:", err)
        setRows([emptyRow()])
        toast.error(
          "Não foi possível processar o PDF. Você pode adicionar os itens manualmente.",
        )
      }
    })
  }

  function updateRow(key: string, field: keyof ParsedItem, value: string) {
    setRows((prev) =>
      prev
        ? prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
        : prev,
    )
  }

  function removeRow(key: string) {
    setRows((prev) => (prev ? prev.filter((r) => r.key !== key) : prev))
  }

  function save() {
    if (!rows) return
    startSaving(async () => {
      try {
        const res = await saveAtaAction({
          numero,
          descricao,
          modelo,
          items: rows.map(({ key, ...rest }) => rest),
        })
        if (res.ok) {
          toast.success("Ata salva com sucesso.")
          router.push("/atas")
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        console.log("[v0] Falha no saveAtaAction:", err)
        toast.error("Não foi possível salvar a ata. Tente novamente.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da ata</CardTitle>
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

          <div className="flex flex-col gap-1.5">
            <Label>Arquivo PDF da ata</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-60"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Lendo PDF...
                </>
              ) : fileName ? (
                <>
                  <FileText className="h-5 w-5" />
                  {fileName} — clique para trocar
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Clique para enviar o PDF
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              A leitura é automática, mas o layout do PDF pode gerar erros. Revise
              os itens abaixo antes de salvar. Você também pode adicionar itens manualmente.
            </p>
          </div>
        </CardContent>
      </Card>

      {rows !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Revisar itens ({rows.length})
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((p) => [...(p ?? []), emptyRow()])}
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar item
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {rows.map((row, idx) => (
              <div
                key={row.key}
                className="rounded-lg border border-border p-4"
              >
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
                  <Field label="Código" value={row.codigo} onChange={(v) => updateRow(row.key, "codigo", v)} />
                  <Field label="Marca" value={row.marca} onChange={(v) => updateRow(row.key, "marca", v)} />
                  <Field label="Valor unitário" value={row.valorUnitario} onChange={(v) => updateRow(row.key, "valorUnitario", v)} />
                  <Field label="Unidade" value={row.unidade} onChange={(v) => updateRow(row.key, "unidade", v)} />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/atas")}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Salvar ata
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
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
