import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  caliber: text("caliber").notNull(),
  bulletWeight: real("bullet_weight").notNull(),
  bulletDiameter: real("bullet_diameter").notNull(),
  muzzleVelocity: real("muzzle_velocity").notNull(),
  ballisticCoefficient: real("ballistic_coefficient").notNull(),
  bcModel: text("bc_model").notNull().default("G1"),
  zeroRange: real("zero_range").notNull(),
  scopeHeight: real("scope_height").notNull(),
  rifleWeight: real("rifle_weight").notNull().default(8),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
