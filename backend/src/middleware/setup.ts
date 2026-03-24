import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { env } from "../config/environment";
import { errorHandler } from "../middleware/errorHandler";
import { requestLogger } from "../middleware/requestLogger";
import authRoutes from "../modules/auth/routes/auth.routes";
import hotelRoutes from "../modules/hotel/routes/hotel.routes";
import roomRoutes from "../modules/room/routes/room.routes";
import bookingRoutes from "../modules/booking/routes/booking.routes";
import reviewRoutes from "../modules/review/routes/review.routes";
import wishlistRoutes from "../modules/wishlist/routes/wishlist.routes";
import usersRoutes from "../modules/users/routes/users.routes";
import messagesRoutes from "../modules/messages/routes/messages.routes";
import notificationsRoutes from "../modules/notifications/routes/notifications.routes";
import supportRoutes from "../modules/support/routes/support.routes";
import searchHistoryRoutes from "../modules/search-history/routes/search-history.routes";
import reportsRoutes from "../modules/reports/routes/reports.routes";
import paymentsRoutes from "../modules/payments/routes/payments.routes";
import promotionsRoutes from "../modules/promotions/routes/promotions.routes";
import hostProfileRoutes from "../modules/host-profile/routes/host-profile.routes";
import hostFinanceRoutes from "../modules/host-finance/routes/host-finance.routes";
import hostToolsRoutes from "../modules/host-tools/routes/host-tools.routes";
import invoicesRoutes from "../modules/invoices/routes/invoices.routes";

export const setupMiddleware = (app: Express) => {
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

  // Health check (before other routes)
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  });

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/hotels", hotelRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/wishlists", wishlistRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/support", supportRoutes);
  app.use("/api/search-history", searchHistoryRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/invoices", invoicesRoutes);
  app.use("/api/promotions", promotionsRoutes);
  app.use("/api/host", hostProfileRoutes);
  app.use("/api/host/finance", hostFinanceRoutes);
  app.use("/api/host/tools", hostToolsRoutes);

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
};

export default setupMiddleware;
