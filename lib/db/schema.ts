import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core"

export const atas = pgTable("atas", {
  id: serial("id").primaryKey(),
  numero: text("numero").notNull(),
  descricao: text("descricao"),
  // "novo" = padrão 2026+ (coluna Marca própria)
  // "antigo" = padrão até 2025 (marca fica no descritivo)
  modelo: text("modelo").notNull().default("novo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const itens = pgTable("itens", {
  id: serial("id").primaryKey(),
  ataId: integer("ata_id").notNull(),
  codigo: text("codigo").notNull(),
  descricao: text("descricao").notNull(),
  valorUnitario: text("valor_unitario"),
  marca: text("marca"),
  unidade: text("unidade"),
  quantidade: text("quantidade"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type Ata = typeof atas.$inferSelect
export type Item = typeof itens.$inferSelect
