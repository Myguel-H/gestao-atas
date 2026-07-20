import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AtaEdit } from "@/components/ata-edit"
import { db } from "@/lib/db"
import { atas, itens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export default async function EditAtaPage({ params }: { params: { ataId: string } }) {
  const ataId = Number(params.ataId)

  if (!Number.isInteger(ataId) || ataId <= 0) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader active="atas" />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href="/atas"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
            Ata não encontrada.
          </div>
        </div>
      </main>
    )
  }

  const [ata] = await db.select().from(atas).where(eq(atas.id, ataId)).limit(1)
  if (!ata) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader active="atas" />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href="/atas"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
            Ata não encontrada.
          </div>
        </div>
      </main>
    )
  }

  const items = await db
    .select()
    .from(itens)
    .where(eq(itens.ataId, ataId))
    .orderBy(itens.codigo)

  const data = { ata, items }

  return (
    <main className="min-h-screen bg-background">
      <AppHeader active="atas" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/atas"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="mb-6">
          <h1 className="text-balance text-2xl font-semibold text-foreground">
            Editar ata {data.ata.numero}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualize o número, descrição, modelo e os itens desta ata.
          </p>
        </div>
        <AtaEdit ata={data.ata} items={data.items} />
      </div>
    </main>
  )
}
