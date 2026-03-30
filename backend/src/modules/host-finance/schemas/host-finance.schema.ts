import { z, v } from "../../../utils/validation";

export const payoutAccountSchema = z.object({
  accountHolderName: v.text(2, 120),
  bankName: v.text(2, 120),
  accountNumber: v.text(8, 24),
  ifscCode: v.text(8, 20),
  payoutMethod: z.enum(["bank_transfer", "upi"]).optional(),
  upiId: v.text(3, 120).optional(),
});

export const payoutRequestSchema = z.object({
  amount: v.positiveNumber(),
  notes: v.trimmed(500).optional(),
});

export const hostFinanceQuerySchema = z.object({
  months: v.int(1, 60).optional(),
  limit: v.int(1, 200).optional(),
});

export const hostfinanceSchemas = {
  payoutAccountSchema,
  payoutRequestSchema,
  hostFinanceQuerySchema,
};

export default hostfinanceSchemas;
