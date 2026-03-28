import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import profilesRouter from "./profiles.js";
import calculateRouter from "./calculate.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(calculateRouter);

export default router;
