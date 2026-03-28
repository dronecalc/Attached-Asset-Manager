import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import profilesRouter from "./profiles.js";
import calculateRouter from "./calculate.js";
import targetSessionsRouter from "./targetSessions.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(calculateRouter);
router.use(targetSessionsRouter);

export default router;
