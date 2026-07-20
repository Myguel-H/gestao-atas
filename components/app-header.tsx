import Link from "next/link"
import { FileSearch } from "lucide-react"

export function AppHeader({
  active,
}: {
  active?: "consulta" | "atas"
}) {
  const linkCls = (key: string) =>
    `text-sm font-medium transition-colors ${
      active === key
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground"
    }`

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileSearch className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold text-foreground">
            Consulta de Atas
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className={linkCls("consulta")}>
            Consultar
          </Link>
          <Link href="/atas" className={linkCls("atas")}>
            Gerenciar atas
          </Link>
        </nav>
      </div>
    </header>
  )
}
