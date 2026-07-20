"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import type { Ata } from "@/lib/db/schema"
import { deleteAtaAction } from "@/app/actions/atas"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Trash2, FileText, Loader2, Pencil } from "lucide-react"

type AtaWithCount = Ata & { itemCount: number }

export function AtasManager({ atas }: { atas: AtaWithCount[] }) {
  const [list, setList] = useState(atas)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirmDelete(ata: AtaWithCount) {
    if (
      !window.confirm(
        `Excluir a ata "${ata.numero}" e seus ${ata.itemCount} itens? Esta ação não pode ser desfeita.`,
      )
    )
      return
    setDeletingId(ata.id)
    startTransition(async () => {
      await deleteAtaAction(ata.id)
      setList((prev) => prev.filter((a) => a.id !== ata.id))
      setDeletingId(null)
      toast.success("Ata excluída.")
    })
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhuma ata cadastrada ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((ata) => (
        <Card key={ata.id}>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-foreground">{ata.numero}</p>
                <p className="text-sm text-muted-foreground">
                  {ata.descricao ? `${ata.descricao} · ` : ""}
                  {ata.itemCount} {ata.itemCount === 1 ? "item" : "itens"}
                  {" · "}
                  {ata.modelo === "antigo" ? "Antiga" : "Nova"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {Number.isInteger(ata.id) && ata.id > 0 ? (
                <Link
                  href={`/atas/${String(ata.id)}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center justify-center")}
                >
                  <Pencil className="h-4 w-4" />
                </Link>
              ) : (
                <Button variant="ghost" size="sm" disabled>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={isPending && deletingId === ata.id}
                onClick={() => confirmDelete(ata)}
              >
                {isPending && deletingId === ata.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
