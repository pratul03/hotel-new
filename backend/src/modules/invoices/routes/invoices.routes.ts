import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { invoicesController } from "../controllers/invoices.controller";

const router = Router();

router.post("/", authenticate, catchAsync(invoicesController.create));

router.get("/", authenticate, catchAsync(invoicesController.list));

router.get("/:id/pdf", authenticate, catchAsync(invoicesController.getPdf));

router.get(
  "/:id/url",
  authenticate,
  catchAsync(invoicesController.getAccessUrl),
);

router.post(
  "/ops/storage-audit",
  authenticate,
  requireRole(["admin"]),
  catchAsync(invoicesController.runStorageAudit),
);

router.patch(
  "/:id/revoke",
  authenticate,
  catchAsync(invoicesController.revoke),
);

export default router;
