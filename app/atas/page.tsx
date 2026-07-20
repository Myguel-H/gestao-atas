import Link from "next/link"
import { Plus } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AtasManager } from "@/components/atas-manager"
import { Button } from "@/components/ui/button"
import { getAtasWithCountAction } from "@/app/actions/atas"

export const dynamic = "force-dynamic"

export default async function AtasPage() {
  const atas = await getAtasWithCountAction()

  return (
    <main className="min-h-screen bg-background">
      <AppHeader active="atas" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-balance text-2xl font-semibold text-foreground">
              Gerenciar atas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre novas atas e remova as que não usa mais.
            </p>
          </div>
          <Link href="/atas/nova">
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              Nova ata
            </Button>
          </Link>
        </div>
        <AtasManager atas={atas} />
      </div>
    </main>
  )
}
