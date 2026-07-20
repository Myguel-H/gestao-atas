import { AppHeader } from "@/components/app-header"
import { SearchView } from "@/components/search-view"
import { getAtasAction } from "@/app/actions/atas"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const atas = await getAtasAction()

  return (
    <main className="min-h-screen bg-background">
      <AppHeader active="consulta" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-balance text-2xl font-semibold text-foreground">
            Consultar item da ata
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha a ata e pesquise pelo código para ver o descritivo, valor unitário e marca.
          </p>
        </div>
        <SearchView atas={atas} />
      </div>
    </main>
  )
}
