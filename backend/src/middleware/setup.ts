import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { env } from "../config/environment";
import { errorHandler } from "../middleware/errorHandler";
import { requestLogger } from "../middleware/requestLogger";
import { setupGraphQL } from "../graphql/server";
import { setupSwaggerDocs } from "../docs/swagger";

export const setupMiddleware = async (app: Express) => {
  // Trust proxy
  app.set("trust proxy", 1);

  // Helmet - Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Compression
  app.use(compression());

  // Morgan - Request logging
  app.use(morgan("combined"));

  // Body parsers
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    }),
  );
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Request logger middleware
  app.use(requestLogger);

  // API docs (Swagger/OpenAPI)
  setupSwaggerDocs(app);

  // GraphQL-only mode: REST routes are no longer mounted.

  // GraphQL endpoint.
  await setupGraphQL(app);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.path} not found`,
      },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);
};;

export default setupMiddleware;
