import Image from "next/image"
import Link from "next/link"

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
    <header className="border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-[180px] min-w-[140px]">
            <Image
              src="/logoconsud.png"
              alt="Logo Consud"
              width={180}
              height={48}
              className="object-contain"
            />
          </div>
        </Link>

        <nav className="flex items-center gap-8 text-sm font-medium tracking-wide">
          <Link href="/" className={linkCls("consulta")}>Consultar</Link>
          <Link href="/atas" className={linkCls("atas")}>Gerenciar atas</Link>
        </nav>
      </div>
    </header>
  )
}
