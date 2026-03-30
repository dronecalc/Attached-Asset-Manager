import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// CORS — restrict to known origin; set CORS_ORIGIN env var in production
const allowedOrigin = process.env.CORS_ORIGIN ?? "*";
app.use(cors({ origin: allowedOrigin, credentials: allowedOrigin !== "*" }));

// Body size limits — 1 MB is sufficient for all API payloads
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Rate limiting — protect /api/calculate from CPU abuse
const calcRateLimit = rateLimit({
  windowMs: 60_000,     // 1 minute
  max: 60,              // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});
app.use("/api/calculate", calcRateLimit);

app.use("/api", router);

export default app;
