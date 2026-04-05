import { z, v } from "../../../utils/validation";

const childCountSchema = z.coerce.number().int().min(0);
const childAgesSchema = z.array(z.coerce.number().int().min(0).max(16));

const validateChildGuestPayload = (
  payload: {
    guestCount?: number;
    childCount?: number;
    childAges?: number[];
  },
  ctx: z.RefinementCtx,
  options: { requirePair?: boolean } = {},
) => {
  const hasChildCount = typeof payload.childCount === "number";
  const hasChildAges = Array.isArray(payload.childAges);

  if (options.requirePair && hasChildCount !== hasChildAges) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [hasChildCount ? "childAges" : "childCount"],
      message: "childCount and childAges must be provided together",
    });
    return;
  }

  if (!hasChildCount || !hasChildAges) {
    return;
  }

  if (payload.childCount !== payload.childAges.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["childAges"],
      message: "childAges length must match childCount",
    });
  }

  if (
    typeof payload.guestCount === "number" &&
    payload.childCount > payload.guestCount
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["childCount"],
      message: "childCount cannot exceed guestCount",
    });
  }
};

export const createBookingSchema = z
  .object({
    roomId: v.id(),
    checkIn: v.isoDateTime(),
    checkOut: v.isoDateTime(),
    guestCount: v.positiveInt(),
    childCount: childCountSchema.default(0),
    childAges: childAgesSchema.default([]),
    notes: v.text(1, 1000).optional(),
  })
  .superRefine((payload, ctx) => validateChildGuestPayload(payload, ctx));

export const previewSchema = z
  .object({
    roomId: v.id(),
    checkIn: v.isoDateTime(),
    checkOut: v.isoDateTime(),
    guestCount: v.positiveInt().default(1),
    childCount: childCountSchema.default(0),
    childAges: childAgesSchema.default([]),
  })
  .superRefine((payload, ctx) => validateChildGuestPayload(payload, ctx));

export const riskSchema = z
  .object({
    roomId: v.id(),
    checkIn: v.isoDateTime(),
    checkOut: v.isoDateTime(),
    guestCount: v.positiveInt().default(1),
    childCount: childCountSchema.default(0),
    childAges: childAgesSchema.default([]),
  })
  .superRefine((payload, ctx) => validateChildGuestPayload(payload, ctx));

export const cancelSchema = z.object({
  reason: v.text(2, 500).optional(),
});

export const updateSchema = z
  .object({
    guestCount: v.positiveInt().optional(),
    childCount: childCountSchema.optional(),
    childAges: childAgesSchema.optional(),
    checkIn: v.isoDateTime().optional(),
    checkOut: v.isoDateTime().optional(),
    notes: v.text(1, 1000).optional(),
  })
  .superRefine((payload, ctx) =>
    validateChildGuestPayload(payload, ctx, { requirePair: true }),
  );

export const hostDeclineSchema = z.object({
  reason: v.text(2, 500).optional(),
});

export const hostAlterSchema = z
  .object({
    guestCount: v.positiveInt().optional(),
    childCount: childCountSchema.optional(),
    childAges: childAgesSchema.optional(),
    checkIn: v.isoDateTime().optional(),
    checkOut: v.isoDateTime().optional(),
    notes: v.text(1, 1000).optional(),
  })
  .superRefine((payload, ctx) =>
    validateChildGuestPayload(payload, ctx, { requirePair: true }),
  );

export const hostNoShowSchema = z.object({
  notes: v.text(1, 1000).optional(),
});

export const rebookingSchema = z.object({
  reason: v.text(3, 500),
});

export const travelDisruptionSchema = z.object({
  eventType: z.enum([
    "weather",
    "transport_strike",
    "airport_closure",
    "medical",
    "government_restriction",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export const bookingSchemas = {
  createBookingSchema,
  previewSchema,
  riskSchema,
  cancelSchema,
  updateSchema,
  hostDeclineSchema,
  hostAlterSchema,
  hostNoShowSchema,
  rebookingSchema,
  travelDisruptionSchema,
};

export default bookingSchemas;
