import PDFParser from "pdf2json"

export type Modelo = "antigo" | "novo"

export const MARCA_NO_DESCRITIVO = "Marca no descritivo"

export type ParsedItem = {
  codigo: string
  descricao: string
  /** Apenas o número, sem o prefixo "R$". Ex: "132,50" */
  valorUnitario: string
  marca: string
  unidade: string
  quantidade: string
}

type Fragment = { x: number; s: string }
type Line = { y: number; parts: Fragment[] }

/** Colunas possíveis de uma ata. "total" é ignorada na saída. */
type ColKey = "seq" | "desc" | "und" | "marca" | "qtd" | "val" | "total"

type Anchor = { key: ColKey; x: number }

function decode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s.replace(/%/g, " ")
  }
}

/** Agrupa os fragmentos de texto de cada página em linhas pela coordenada Y. */
function pageToLines(page: any): Line[] {
  const byY = new Map<number, Fragment[]>()
  for (const t of page.Texts ?? []) {
    const s = (t.R ?? []).map((r: any) => decode(r.T)).join("")
    if (!s.trim()) continue
    const y = Math.round(t.y * 2) / 2
    if (!byY.has(y)) byY.set(y, [])
    byY.get(y)!.push({ x: t.x, s })
  }
  return [...byY.keys()]
    .sort((a, b) => a - b)
    .map((y) => ({ y, parts: byY.get(y)!.sort((a, b) => a.x - b.x) }))
}

/**
 * Detecta a linha de cabeçalho da tabela e devolve a posição X de cada coluna.
 * Isso adapta o parser a diferentes layouts (com ou sem coluna "Marca") sem
 * depender de limites de X fixos.
 */
function detectAnchors(line: Line): Anchor[] | null {
  const joined = line.parts
    .map((p) => p.s)
    .join(" ")
    .toLowerCase()
  const looksLikeHeader =
    joined.includes("valor") &&
    (joined.includes("material") ||
      joined.includes("descri") ||
      joined.includes("descrição") ||
      joined.includes("item") ||
      joined.includes("seq") ||
      joined.includes("codigo")) &&
    (joined.includes("unidade") ||
      joined.includes("und") ||
      joined.includes("qtd") ||
      joined.includes("qtde") ||
      joined.includes("qte") ||
      joined.includes("quantidade") ||
      joined.includes("uni"))
  if (!looksLikeHeader) return null

  const anchors: Anchor[] = []
  let valorCount = 0
  for (const p of line.parts) {
    const label = p.s.trim().toLowerCase()
    if (/^item$/.test(label) || /^seq/.test(label) || /^cod/.test(label)) {
      anchors.push({ key: "seq", x: p.x })
    } else if (/^material/.test(label) || /descri/.test(label) || /descrição/.test(label)) {
      anchors.push({ key: "desc", x: p.x })
    } else if (/^unidade/.test(label) || /^und/.test(label) || /^uni$/.test(label)) {
      anchors.push({ key: "und", x: p.x })
    } else if (/^marca/.test(label)) {
      anchors.push({ key: "marca", x: p.x })
    } else if (/^qtd/.test(label) || /^qtde/.test(label) || /^quantidade/.test(label) || /^qte/.test(label)) {
      anchors.push({ key: "qtd", x: p.x })
    } else if (/^valor/.test(label) || /^vl/.test(label) || /^pre[çc]o/.test(label)) {
      // Primeiro "Valor" = unitário, segundo = total.
      anchors.push({ key: valorCount === 0 ? "val" : "total", x: p.x })
      valorCount++
    }
  }

  const hasDesc = anchors.some((a) => a.key === "desc")
  const hasVal = anchors.some((a) => a.key === "val")
  if (!hasDesc || !hasVal) return null

  // Garante presença de "seq" no início para captar o número do item.
  if (!anchors.some((a) => a.key === "seq")) {
    anchors.unshift({ key: "seq", x: 0 })
  }
  return anchors.sort((a, b) => a.x - b.x)
}

/**
 * Classifica uma coordenada X na coluna correta usando pontos médios entre
 * as posições dos rótulos do cabeçalho. O conteúdo das células raramente fica
 * exatamente sob o rótulo, então os limites são as metades entre colunas.
 */
function classify(x: number, anchors: Anchor[]): ColKey {
  for (let i = 0; i < anchors.length; i++) {
    const next = anchors[i + 1]
    if (!next) return anchors[i].key
    const boundary = (anchors[i].x + next.x) / 2
    if (x < boundary) return anchors[i].key
  }
  return anchors[anchors.length - 1].key
}

type Row = Record<ColKey, string[]>

function emptyRow(): Row {
  return { seq: [], desc: [], und: [], marca: [], qtd: [], val: [], total: [] }
}

// Início de um item: "8411 - Cabo De Eletroestimulação"
const CODE_RE = /^([\d\.\s]{2,20})\s*[-–]\s*(.+)$/
// Valores monetários: "R$ 132,50" / "3.436,77"
const MONEY_RE = /(\d{1,3}(?:\.\d{3})*,\d{2})/g
// Linhas de qualificação de empresa (não são itens)
const CNPJ_RE = /\d{2}\.\d{3}\.\d{3}\/\d{4}/
// Cabeçalhos/rodapés de página e texto jurídico que não fazem parte da tabela.
const NOISE_LINE_RE =
  /Ata de Registro de pre|^P[áa]gina\b|Pregão Eletr|CL[ÁA]USULA|Insumos de Enfermagem$|^Processo/i

function normalizeCode(raw: string): string {
  return raw.replace(/[^\d]/g, "").trim()
}

function splitItemBlocks(text: string) {
  const cleaned = clean(text)
  const matches = [...cleaned.matchAll(/(\d{2,6})\s*[-–]\s*/g)]

  if (matches.length <= 1) {
    const m = cleaned.match(CODE_RE)
    return m
      ? [{ codigo: normalizeCode(m[1]), descricao: clean(m[2]) }]
      : []
  }

  return matches
    .map((match, index) => {
      const start = match.index ?? 0
      const end = matches[index + 1]?.index ?? cleaned.length
      const slice = cleaned.slice(start, end)
      const m = slice.match(CODE_RE)
      return m
        ? { codigo: normalizeCode(m[1]), descricao: clean(m[2]) }
        : null
    })
    .filter((block): block is { codigo: string; descricao: string } => Boolean(block))
}

function clean(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+;/g, ";")
    .replace(/\s+\./g, ".")
    .trim()
}

function cleanMarca(marca: string): string {
  const cleaned = marca
    .replace(/\bMarca:?\b/gi, "")
    .replace(/\b(Unid|Unid\.?|Unidade|Und)\b/gi, "")
    .replace(/\b(KG|G|L|ML|CX|CAIXA|PACOTE|PCT|PAR|KIT|JOGO|UN|UNS?)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;.\-–]+|[\s:;.\-–]+$/g, "")
    .trim()

  if (!cleaned || /^[\x00-\x1f]+$/.test(cleaned)) {
    return ""
  }

  const badMarca = /^(?:kg|g|l|ml|cx|caixa|pacote|pct|par|kit|jogo|un|uns|und|unid|unidade)$/i
  if (badMarca.test(cleaned)) {
    return ""
  }

  const match = cleaned.match(/^(?:\s*[:\-–]?\s*)(.+)$/)
  return match ? match[1].trim() : cleaned
}

function extractMarcaFromDescription(descricao: string) {
  const cleaned = clean(descricao)
  const match = cleaned.match(/\bmarca\b\s*[:\-–]?\s*([^;\.\n]+?)(?=\s+(?:unid(?:ade)?|und|qtd|qte|quantidade|kg|g|l|ml|cx|caixa|pacote|pct|par|kit|jogo|un|uns|\d|$))/i)
  if (!match) {
    return { descricao: cleaned, marca: "" }
  }

  const marca = cleanMarca(match[1])
  const descricaoSemMarca = clean(cleaned.replace(match[0], ""))
  return { descricao: descricaoSemMarca, marca }
}

// Conectivos que às vezes vazam do descritivo para a coluna de unidade.
const UNIT_STOPWORDS = new Set([
  "com", "de", "da", "do", "e", "para", "por", "a", "o", "em", "que", "no", "na",
])

function cleanUnidade(und: string): string {
  const words = und
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w && !UNIT_STOPWORDS.has(w.toLowerCase()))
  return words.join(" ").replace(/^Medida$/i, "")
}

type Draft = {
  codigo: string
  desc: string[]
  und: string
  qtd: string
  marca: string
  val: string
  hasValues: boolean
}

/** Junta dígitos que o PDF quebrou em fragmentos: "17.82 0" -> "17.820". */
function joinNumber(s: string): string {
  return s.replace(/(\d)\s+(?=[\d.,])/g, "$1").trim()
}

export async function parsePdf(
  buffer: Buffer,
  modelo: Modelo = "novo",
): Promise<ParsedItem[]> {
  const data = await new Promise<any>((resolve, reject) => {
    const parser = new PDFParser()
    parser.on("pdfParser_dataError", (err: any) => reject(err?.parserError ?? err))
    parser.on("pdfParser_dataReady", (d: any) => resolve(d))
    parser.parseBuffer(buffer)
  })

  const items: ParsedItem[] = []
  let cur: Draft | null = null
  let anchors: Anchor[] | null = null

  const flush = () => {
    if (!cur) return
    let descricao = clean(cur.desc.join(" "))
    const monies = [...cur.val.matchAll(MONEY_RE)].map((m) => m[1])
    const valorUnitario = monies.length ? monies[0] : ""

    let marca = modelo === "antigo" ? "" : cleanMarca(cur.marca)
    if (!marca) {
      const extracted = extractMarcaFromDescription(descricao)
      descricao = extracted.descricao
      marca = extracted.marca
    }

    const unidade = cleanUnidade(cur.und)
    const quantidade = joinNumber(clean(cur.qtd))

    const isNoise =
      !valorUnitario &&
      (CNPJ_RE.test(descricao) ||
        /\bLTDA\b|\bEIRELI\b|\bS\/?A\b/.test(descricao) ||
        /Material$/i.test(descricao))

    if (!isNoise && descricao && cur.codigo) {
      items.push({
        codigo: cur.codigo,
        descricao,
        valorUnitario,
        marca,
        unidade,
        quantidade,
      })
    }
    cur = null
  }

  for (const page of data.Pages ?? []) {
    const lines = pageToLines(page)
    for (const line of lines) {
      const maybeHeader = detectAnchors(line)
      if (maybeHeader) {
        anchors = maybeHeader
        continue
      }
      if (!anchors) continue

      const fullLine = clean(line.parts.map((p) => p.s).join(" "))
      if (!fullLine || NOISE_LINE_RE.test(fullLine)) continue

      const row = emptyRow()
      for (const p of line.parts) row[classify(p.x, anchors)].push(p.s)

      const descCell = clean(row.desc.join(" "))
      // A "linha de valores" é a que traz o preço unitário alinhado às colunas.
      const isValuesLine = MONEY_RE.test(row.val.join(" ") + row.total.join(" "))
      MONEY_RE.lastIndex = 0

      const blocks = splitItemBlocks(descCell)
      const m = descCell.match(CODE_RE)
      const seqCell = clean(row.seq.join(" "))
      const seqCode = normalizeCode(seqCell)
      const isItemStart =
        m &&
        /[a-zA-ZÀ-ÿ]/.test(m[2]) &&
        normalizeCode(m[1]).length >= 2 &&
        !/Material|Unidade|Medida/i.test(descCell)
      const seqLineStart =
        seqCode &&
        descCell &&
        /[a-zA-ZÀ-ÿ]/.test(descCell) &&
        !isValuesLine

      if (blocks.length > 1) {
        if (cur) flush()
        for (const block of blocks) {
          if (cur) flush()
          cur = {
            codigo: block.codigo,
            desc: [block.descricao],
            und: "",
            qtd: "",
            marca: "",
            val: "",
            hasValues: false,
          }
        }
      } else if (isItemStart) {
        flush()
        cur = {
          codigo: normalizeCode(m![1]),
          desc: [m![2].trim()],
          und: "",
          qtd: "",
          marca: "",
          val: "",
          hasValues: false,
        }
      } else if (seqLineStart) {
        flush()
        cur = {
          codigo: seqCode,
          desc: [descCell],
          und: "",
          qtd: "",
          marca: "",
          val: "",
          hasValues: false,
        }
      } else if (cur) {
        // Linha de continuação: se NÃO for a linha de valores, todo o texto é
        // descrição (o descritivo é largo e transborda para outras colunas).
        if (!isValuesLine) {
          cur.desc.push(fullLine)
        } else if (descCell) {
          cur.desc.push(descCell)
        }
      }

      // Só extrai unidade/marca/qtd/valor da linha de valores (colunas alinhadas).
      if (cur && isValuesLine && !cur.hasValues) {
        cur.hasValues = true
        const und = clean(row.und.join(" "))
        if (und && und !== "Medida") cur.und = und
        cur.marca = clean(row.marca.join(" "))
        cur.qtd = clean(row.qtd.join(" "))
        cur.val = clean(row.val.join(" "))
        if (!cur.val && row.total.length) {
          cur.val = clean(row.total.join(" "))
        }
      }
    }
  }
  flush()

  return items
}
