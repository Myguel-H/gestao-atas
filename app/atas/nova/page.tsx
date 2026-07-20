import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AtaUpload } from "@/components/ata-upload"

export default function NovaAtaPage() {
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
            Cadastrar nova ata
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie o PDF da ata, revise os itens extraídos e salve.
          </p>
        </div>
        <AtaUpload />
      </div>
    </main>
  )
}
