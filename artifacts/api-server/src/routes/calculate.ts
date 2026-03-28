import { Router, type IRouter } from "express";
import { z } from "zod";
import { calculateBallistics } from "../lib/ballistics.js";

const router: IRouter = Router();

const CalculationInputSchema = z.object({
  profileId: z.number().nullable().optional(),
  muzzleVelocity: z.number().positive(),
  ballisticCoefficient: z.number().positive(),
  bcModel: z.enum(["G1", "G7"]),
  bulletWeight: z.number().positive(),
  bulletDiameter: z.number().positive(),
  zeroRange: z.number().positive(),
  scopeHeight: z.number().positive(),
  maxRange: z.number().positive().max(3000),
  rangeStep: z.number().positive().max(200),
  windSpeed: z.number().min(0),
  windAngle: z.number().min(0).max(360),
  temperature: z.number(),
  altitude: z.number().min(0),
  humidity: z.number().min(0).max(100),
  pressure: z.number().positive(),
  targetAngle: z.number().min(-90).max(90),
  unitSystem: z.enum(["imperial", "metric"]),
});

router.post("/calculate", (req, res) => {
  const parsed = CalculationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const result = calculateBallistics({
      ...parsed.data,
      bcModel: parsed.data.bcModel,
      unitSystem: parsed.data.unitSystem,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Ballistic calculation failed");
    res.status(500).json({ error: "Calculation failed" });
  }
});

export default router;
