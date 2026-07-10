import express from "express";
import { rateLimit } from "express-rate-limit";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { handleChat, handleFitFinder } from "./handlers.js";
import { createMcpServer } from "./mcp.js";
import {
  clientRateLimitKey,
  markOriginVerified,
  readRateLimitConfig,
  type RateLimitConfig
} from "./rateLimit.js";
import { corsHeadersFor, verifyOriginHeader } from "./security.js";

const asyncHandler =
  (fn: express.RequestHandler) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function createApp(
  rateLimitConfig: RateLimitConfig = readRateLimitConfig()
): express.Express {
  const app = express();

  // Cloud Run sits behind one Cloudflare-to-origin proxy hop. Never configure
  // permissive proxy trust: fallback identity must not accept an arbitrary chain.
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.set(corsHeadersFor(req));
    next();
  });

  app.use(express.json({ limit: "64kb" }));

  // Process-memory enforcement is per Cloud Run instance, not global. Keep a
  // shared Cloudflare edge limit as the service-wide enforcement layer.
  const apiLimiter = rateLimit({
    ...rateLimitConfig,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: clientRateLimitKey
  });

  const requireOriginVerify: express.RequestHandler = (req, res, next) => {
    const result = verifyOriginHeader(req);
    if (result.ok) {
      markOriginVerified(req);
      next();
      return;
    }

    if (result.reason === "missing_token") {
      console.error("ORIGIN_VERIFY_TOKEN is required but is not configured");
    }
    res.status(403).json({ error: "Forbidden" });
  };

  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", service: "briananderson-xyz-api" });
  });

  app.post(
    "/",
    requireOriginVerify,
    apiLimiter,
    asyncHandler((req, res) => {
      const fn = process.env.FUNCTION_TARGET || "chat";
      return fn === "fitfinder" ? handleFitFinder(req, res) : handleChat(req, res);
    })
  );
  app.options(
    "/",
    asyncHandler((req, res) => {
      const fn = process.env.FUNCTION_TARGET || "chat";
      return fn === "fitfinder" ? handleFitFinder(req, res) : handleChat(req, res);
    })
  );

  app.post("/chat", requireOriginVerify, apiLimiter, asyncHandler(handleChat));
  app.options("/chat", asyncHandler(handleChat));
  app.post("/fit-finder", requireOriginVerify, apiLimiter, asyncHandler(handleFitFinder));
  app.options("/fit-finder", asyncHandler(handleFitFinder));

  app.post(
    "/mcp",
    requireOriginVerify,
    apiLimiter,
    asyncHandler(async (req, res) => {
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
      });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    })
  );
  app.get("/mcp", (_req, res) => {
    res.status(405).json({ error: "Method not allowed" });
  });

  app.use(
    (
      err: Error & { status?: number; statusCode?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const status = err.status ?? err.statusCode ?? 500;
      if (status >= 500) console.error("Unhandled error:", err);
      res.status(status).json({ error: "Internal server error" });
    }
  );

  return app;
}
