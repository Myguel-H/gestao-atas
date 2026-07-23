import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { ItemEdit } from "@/components/item-edit"
import { getItemWithAtaAction } from "@/app/actions/atas"

export const dynamic = "force-dynamic"

export default async function ItemEditPage({ params }: { params: { itemId: string } }) {
  const itemId = Number(params.itemId)
  const data = await getItemWithAtaAction(itemId)

  if (!data) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader active="consulta" />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
            Item não encontrado.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <AppHeader active="consulta" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href={`/atas/${data.ata.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para ata {data.ata.numero}
        </Link>
        <div className="mb-6">
          <h1 className="text-balance text-2xl font-semibold text-foreground">
            Editar item da ata {data.ata.numero}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Altere código, descrição, valor, marca, unidade e quantidade deste item.
          </p>
        </div>
        <ItemEdit ata={data.ata} item={data.item} />
      </div>
    </main>
  )
}
