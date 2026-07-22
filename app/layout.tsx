import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Consulta de Atas',
  description: 'Consulte itens de atas de registro de preços por código',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        <div className="min-h-screen flex flex-col">
          {children}
          <footer className="border-t border-border bg-card px-4 py-8 text-sm text-muted-foreground">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:justify-between">
              <div className="max-w-xl space-y-2">
                <p className="font-semibold text-foreground">Myguel Henryque Dachery Do Prado</p>
                <p>Setor de compras</p>
                <p>Telefone: <a href="tel:+554635200941" className="text-primary hover:underline">(46) 3520-0941</a></p>
                <p>Email: <a href="mailto:comprasconsud@gmail.com" className="text-primary hover:underline">comprasconsud@gmail.com</a></p>
              </div>
              <div className="max-w-xl space-y-2">
                <p className="font-semibold text-foreground">Consud</p>
                <p>
                  Endereço: <a
                    href="https://www.google.com/search?sa=X&sca_esv=80e3327b61e6e700&biw=1920&bih=911&sxsrf=APpeQnsTqg-HZodzrX48yuF3eQFnQJ3ibw:1784737030613&q=consud+endere%C3%A7o&ludocid=1939504647037812008&ved=2ahUKEwiHmejF1-aVAxV1ALkGHWwjNRcQ6BN6BAgaEAI"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Rodovia Contorno, Rod. Vitorio Traiano, 501 - Água Branca, Francisco Beltrão - PR, 85601-838
                  </a>
                </p>
                <p>
                  Telefone geral: <a
                    href="https://www.google.com/search?sca_esv=80e3327b61e6e700&sxsrf=APpeQnsIfiZ4XQPgjCT9b0MW_pXsv9wlzQ:1784736817322&q=consud&source=lnms&fbs=ABfTbFVGaQeaqnsRPI5sOMG32KszkLt6nAp8aiRKj5vMjqZApKYr2wv-EHakX1SS4JF8fY1OAHmsXq59YBfu7dh6O2RM03m9LuaqZa9S5KBk8FC57zOEk2xpmC6US-mSs7WN7sEnuHEMqJkgcxuIDuO8zMKJDOPiOkqFa4zIHqKemQY6STVfv3IaJoy57x4fhASEq4BLG8AS_Q9XOsblqjMKsxaootfNaQQG6mV0TTVSZWD77tAd8Nw&sa=X&ved=2ahUKEwi99o3g1uaVAxXnA7kGHeOpLi4Q0pQJegQIDBAB&biw=1920&bih=911&dpr=1#"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    (46) 3520-0900
                  </a>
                </p>
                <p>
                  GitHub do projeto: <a
                    href="https://github.com/Myguel-H/gestao-atas.git"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    github.com/Myguel-H/gestao-atas.git
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </div>
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
