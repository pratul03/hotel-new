import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { hotelController } from "../controllers/hotel.controller";

const router = Router();

router.post("/", authenticate, requireRole(["host"]), catchAsync(hotelController.create));

router.get("/search", catchAsync(hotelController.search));
router.get("/", catchAsync(hotelController.search));

router.get("/experiences", catchAsync(hotelController.listExperiences));
router.post(
  "/experiences",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.createExperience),
);

router.get(
  "/services-marketplace",
  catchAsync(hotelController.listServicesMarketplace),
);
router.post(
  "/services-marketplace",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.createServiceListing),
);

router.get(
  "/recommendations/cross-vertical",
  authenticate,
  catchAsync(hotelController.crossVerticalRecommendations),
);

router.get(
  "/ranking-experiment",
  authenticate,
  requireRole(["admin"]),
  catchAsync(hotelController.getRankingExperiment),
);
router.put(
  "/ranking-experiment",
  authenticate,
  requireRole(["admin"]),
  catchAsync(hotelController.updateRankingExperiment),
);

router.get(
  "/:id/calendar-rules",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.getCalendarRules),
);
router.put(
  "/:id/calendar-rules",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.upsertCalendarRules),
);

router.get(
  "/:id/ical/export",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.exportIcal),
);
router.get(
  "/:id/ical/sources",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.getIcalSources),
);
router.post(
  "/:id/ical/sources",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.addIcalSource),
);
router.delete(
  "/:id/ical/sources/:sourceId",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.deleteIcalSource),
);
router.post(
  "/:id/ical/import",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.importIcal),
);
router.post(
  "/:id/ical/sources/:sourceId/sync",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.syncIcalSource),
);

router.get(
  "/:id/pricing-rules",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.getPricingRules),
);
router.put(
  "/:id/pricing-rules",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.upsertPricingRules),
);

router.get("/my", authenticate, requireRole(["host", "admin"]), catchAsync(hotelController.getMyHotels));
router.get("/promoted", catchAsync(hotelController.getPromotedHotels));

router.post(
  "/:id/promote",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.promote),
);
router.delete(
  "/:id/promote",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hotelController.unpromote),
);

router.get("/:id", catchAsync(hotelController.getById));
router.put("/:id", authenticate, requireRole(["host"]), catchAsync(hotelController.update));
router.delete("/:id", authenticate, requireRole(["host"]), catchAsync(hotelController.delete));

router.post(
  "/:id/block-dates",
  authenticate,
  requireRole(["host"]),
  catchAsync(hotelController.blockDates),
);
router.get(
  "/:id/block-dates",
  authenticate,
  requireRole(["host"]),
  catchAsync(hotelController.getBlockedDates),
);

export default router;
