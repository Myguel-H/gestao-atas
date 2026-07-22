"use server"

import { db } from "@/lib/db"
import { atas, itens } from "@/lib/db/schema"
import type { Ata, Item } from "@/lib/db/schema"
import { parsePdf, type ParsedItem, type Modelo } from "@/lib/pdf-parser"
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function parsePdfAction(
  formData: FormData,
): Promise<{ ok: true; items: ParsedItem[] } | { ok: false; error: string }> {
  const file = formData.get("file")
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "Nenhum arquivo enviado." }
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "O arquivo precisa ser um PDF." }
  }

  const rawModelo = String(formData.get("modelo") ?? "novo")
  const modelo: Modelo = rawModelo === "antigo" ? "antigo" : "novo"

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const items = await parsePdf(buffer, modelo)
    if (items.length === 0) {
      return {
        ok: false,
        error:
          "Não consegui identificar itens neste PDF. Você pode adicioná-los manualmente na próxima etapa.",
      }
    }
    return { ok: true, items }
  } catch (e) {
    console.log("[v0] Erro ao ler PDF:", e instanceof Error ? e.message : e)
    return { ok: false, error: "Falha ao ler o PDF." }
  }
}

export async function saveAtaAction(input: {
  numero: string
  descricao: string
  modelo?: Modelo
  items: ParsedItem[]
}): Promise<{ ok: true; ataId: number } | { ok: false; error: string }> {
  const numero = input.numero.trim()
  if (!numero) return { ok: false, error: "Informe o número da ata." }

  const validItems = input.items.filter(
    (i) => i.codigo.trim() && i.descricao.trim(),
  )
  if (validItems.length === 0) {
    return { ok: false, error: "Adicione ao menos um item válido." }
  }

  try {
    const [ata] = await db
      .insert(atas)
      .values({
        numero,
        descricao: input.descricao.trim() || null,
        modelo: input.modelo ?? "novo",
      })
      .returning({ id: atas.id })

    await db.insert(itens).values(
      validItems.map((i) => ({
        ataId: ata.id,
        codigo: i.codigo.trim(),
        descricao: i.descricao.trim(),
        valorUnitario: i.valorUnitario.trim() || null,
        marca: i.marca.trim() || null,
        unidade: i.unidade.trim() || null,
        quantidade: i.quantidade.trim() || null,
      })),
    )

    revalidatePath("/")
    revalidatePath("/atas")
    return { ok: true, ataId: ata.id }
  } catch (e) {
    console.log("[v0] Erro ao salvar ata:", e instanceof Error ? e.message : e)
    return { ok: false, error: "Erro ao salvar no banco de dados." }
  }
}

export async function getAtasAction() {
  return db.select().from(atas).orderBy(desc(atas.createdAt))
}

export async function getAtasWithCountAction() {
  return db
    .select({
      id: atas.id,
      numero: atas.numero,
      descricao: atas.descricao,
      modelo: atas.modelo,
      createdAt: atas.createdAt,
      itemCount: sql<number>`cast(count(${itens.id}) as int)`,
    })
    .from(atas)
    .leftJoin(itens, eq(itens.ataId, atas.id))
    .groupBy(atas.id)
    .orderBy(desc(atas.createdAt))
}

export async function getAtaByIdAction(ataId: number) {
  if (!Number.isInteger(ataId) || ataId <= 0) {
    return null
  }

  const [ata] = await db.select().from(atas).where(eq(atas.id, ataId)).limit(1)
  if (!ata) return null
  const items = await db
    .select()
    .from(itens)
    .where(eq(itens.ataId, ataId))
    .orderBy(itens.codigo)
  return { ata, items }
}

export async function updateAtaAction(input: {
  ataId: number
  numero: string
  descricao: string
  modelo: Modelo
  items: Array<Omit<Item, "id"> & { id?: number }>
  deletedItemIds: number[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const numero = input.numero.trim()
  if (!numero) return { ok: false, error: "Informe o número da ata." }

  try {
    await db
      .update(atas)
      .set({
        numero,
        descricao: input.descricao.trim() || null,
        modelo: input.modelo,
      })
      .where(eq(atas.id, input.ataId))

    const existingItems = input.items.filter((item) => item.id)
    const newItems = input.items.filter((item) => !item.id && item.codigo.trim() && item.descricao.trim())

    for (const item of existingItems) {
      const trimmedCodigo = item.codigo.trim()
      const trimmedDescricao = item.descricao.trim()
      if (!trimmedCodigo || !trimmedDescricao) {
        await db.delete(itens).where(eq(itens.id, item.id!))
        continue
      }
      await db
        .update(itens)
        .set({
          codigo: trimmedCodigo,
          descricao: trimmedDescricao,
          valorUnitario: item.valorUnitario?.trim() || null,
          marca: item.marca?.trim() || null,
          unidade: item.unidade?.trim() || null,
          quantidade: item.quantidade?.trim() || null,
        })
        .where(eq(itens.id, item.id!))
    }

    if (newItems.length > 0) {
      await db.insert(itens).values(
        newItems.map((item) => ({
          ataId: input.ataId,
          codigo: item.codigo.trim(),
          descricao: item.descricao.trim(),
          valorUnitario: item.valorUnitario?.trim() || null,
          marca: item.marca?.trim() || null,
          unidade: item.unidade?.trim() || null,
          quantidade: item.quantidade?.trim() || null,
        })),
      )
    }

    for (const itemId of input.deletedItemIds) {
      await db.delete(itens).where(eq(itens.id, itemId))
    }

    revalidatePath("/")
    revalidatePath("/atas")
    revalidatePath(`/atas/${input.ataId}`)
    return { ok: true }
  } catch (e) {
    console.log("[v0] Erro ao atualizar ata:", e instanceof Error ? e.message : e)
    return { ok: false, error: "Erro ao atualizar a ata." }
  }
}

export async function searchItemsAction(input: {
  ataIds: number[]
  query: string
}) {
  const q = input.query.trim()
  const conditions = [] as any[]
  if (input.ataIds.length > 0) {
    conditions.push(inArray(itens.ataId, input.ataIds))
  }
  if (q) {
    conditions.push(
      or(
        ilike(itens.codigo, `%${q}%`),
        ilike(itens.descricao, `%${q}%`),
        ilike(itens.marca, `%${q}%`),
      ),
    )
  }
  if (conditions.length === 0) {
    return []
  }
  return db
    .select()
    .from(itens)
    .where(and(...conditions))
    .orderBy(itens.codigo)
    .limit(200)
}

export async function deleteAtaAction(ataId: number) {
  await db.delete(itens).where(eq(itens.ataId, ataId))
  await db.delete(atas).where(eq(atas.id, ataId))
  revalidatePath("/")
  revalidatePath("/atas")
  return { ok: true as const }
}
