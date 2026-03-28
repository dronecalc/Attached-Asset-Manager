import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profilesTable, insertProfileSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profiles", async (req, res) => {
  try {
    const profiles = await db.select().from(profilesTable).orderBy(profilesTable.createdAt);
    res.json(profiles);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch profiles");
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

router.get("/profiles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid profile ID" });
      return;
    }
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch profile");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.post("/profiles", async (req, res) => {
  try {
    const parsed = insertProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [profile] = await db.insert(profilesTable).values(parsed.data).returning();
    res.status(201).json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to create profile");
    res.status(500).json({ error: "Failed to create profile" });
  }
});

router.put("/profiles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid profile ID" });
      return;
    }
    const parsed = insertProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [profile] = await db
      .update(profilesTable)
      .set(parsed.data)
      .where(eq(profilesTable.id, id))
      .returning();
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.delete("/profiles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid profile ID" });
      return;
    }
    const [deleted] = await db
      .delete(profilesTable)
      .where(eq(profilesTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete profile");
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

export default router;
