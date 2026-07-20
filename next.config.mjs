/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // pdf2json e pg usam APIs nativas do Node e leem arquivos internos em runtime;
  // precisam ficar fora do bundle do servidor para funcionar corretamente.
  serverExternalPackages: ["pdf2json", "pg"],
  experimental: {
    serverActions: {
      // O padrão do Next é 1MB. PDFs de atas passam disso e faziam a
      // requisição da Server Action falhar (causando o reload da página).
      bodySizeLimit: "25mb",
    },
  },
}

export default nextConfig
