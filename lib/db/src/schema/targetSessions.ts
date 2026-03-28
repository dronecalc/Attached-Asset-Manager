import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const targetSessionsTable = pgTable("target_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  distanceYards: real("distance_yards").notNull(),
  targetWidthInches: real("target_width_inches").notNull(),
  imageData: text("image_data").notNull(),
  notes: text("notes"),
  holeCount: integer("hole_count").notNull().default(0),
  esInches: real("es_inches"),
  esMOA: real("es_moa"),
  mpiX: real("mpi_x"),
  mpiY: real("mpi_y"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const targetHolesTable = pgTable("target_holes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
});

export const insertTargetSessionSchema = createInsertSchema(targetSessionsTable).omit({
  id: true,
  createdAt: true,
});

export const insertTargetHoleSchema = createInsertSchema(targetHolesTable).omit({ id: true });

export type InsertTargetSession = z.infer<typeof insertTargetSessionSchema>;
export type TargetSession = typeof targetSessionsTable.$inferSelect;
export type InsertTargetHole = z.infer<typeof insertTargetHoleSchema>;
export type TargetHole = typeof targetHolesTable.$inferSelect;
