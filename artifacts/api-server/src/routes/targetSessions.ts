import { Router } from "express";
import { db } from "@workspace/db";
import { targetSessionsTable, targetHolesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

const targetHoleSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const createTargetSessionSchema = z.object({
  name: z.string().min(1),
  distanceYards: z.number().positive(),
  targetWidthInches: z.number().positive(),
  imageData: z.string().min(1).max(5_000_000),
  notes: z.string().max(2000).optional().nullable(),
  holes: z.array(targetHoleSchema),
  holeCount: z.number().int().min(0),
  esInches: z.number().nullable().optional(),
  esMOA: z.number().nullable().optional(),
  mpiX: z.number().nullable().optional(),
  mpiY: z.number().nullable().optional(),
});

router.get("/target-sessions", async (_req, res) => {
  try {
    const sessions = await db
      .select()
      .from(targetSessionsTable)
      .orderBy(targetSessionsTable.createdAt);

    const result = await Promise.all(
      sessions.map(async (session) => {
        const holes = await db
          .select()
          .from(targetHolesTable)
          .where(eq(targetHolesTable.sessionId, session.id));
        return { ...session, holes };
      })
    );

    res.json(result.reverse());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch target sessions" });
  }
});

router.post("/target-sessions", async (req, res) => {
  const parsed = createTargetSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { holes, ...sessionData } = parsed.data;

  try {
    const [session] = await db
      .insert(targetSessionsTable)
      .values({
        name: sessionData.name,
        distanceYards: sessionData.distanceYards,
        targetWidthInches: sessionData.targetWidthInches,
        imageData: sessionData.imageData,
        notes: sessionData.notes ?? null,
        holeCount: sessionData.holeCount,
        esInches: sessionData.esInches ?? null,
        esMOA: sessionData.esMOA ?? null,
        mpiX: sessionData.mpiX ?? null,
        mpiY: sessionData.mpiY ?? null,
      })
      .returning();

    if (holes.length > 0) {
      await db.insert(targetHolesTable).values(
        holes.map((h) => ({ sessionId: session.id, x: h.x, y: h.y }))
      );
    }

    const savedHoles = await db
      .select()
      .from(targetHolesTable)
      .where(eq(targetHolesTable.sessionId, session.id));

    res.status(201).json({ ...session, holes: savedHoles });
  } catch (err) {
    res.status(500).json({ error: "Failed to create target session" });
  }
});

router.delete("/target-sessions/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(targetHolesTable).where(eq(targetHolesTable.sessionId, id));
    const deleted = await db
      .delete(targetSessionsTable)
      .where(eq(targetSessionsTable.id, id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete target session" });
  }
});

export default router;
